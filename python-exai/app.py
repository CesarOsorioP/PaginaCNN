"""
FastAPI microservice for chest X-ray inference with Explainable AI (Grad-CAM).
Supports multiple DenseNet-121 models selectable per-request.

Usage:
    uvicorn app:app --host 0.0.0.0 --port 8000
"""

import io
import os
import json
import base64
import logging
import hashlib
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import requests
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from grad_cam import GradCAM

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("exai-service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.environ.get("MODEL_CACHE_DIR", os.path.join(BASE_DIR, ".cache"))

CLASS_MAPPING_PATH = os.path.join(BASE_DIR, "class_mapping.json")

# ImageNet normalization (same as training)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]
IMG_SIZE = 320

# ---------------------------------------------------------------------------
# Model Registry — add new models here
# ---------------------------------------------------------------------------
# Priority order for path resolution: first existing path wins.
MODEL_REGISTRY = {
    "densenet-pro": {
        "display_name": "DenseNet Pro",
        "paths": [
            os.path.join(BASE_DIR, "..", "densenet_multilabel_modelpro.pth"),
        ],
        "num_classes": 8,
    },
}

# Also honour legacy env-var MODEL_URL/MODEL_PATH for the default model
_ENV_MODEL_URL = os.environ.get("MODEL_URL", "")
if _ENV_MODEL_URL:
    MODEL_REGISTRY["densenet-pro"]["paths"].insert(0, _ENV_MODEL_URL)  # handled below

# ---------------------------------------------------------------------------
# Global state — one entry per model_id
# models_cache: { model_id: { "net": nn.Module, "grad_cam": GradCAM } }
# ---------------------------------------------------------------------------
models_cache: dict = {}
class_mapping = None


# ---------------------------------------------------------------------------
# Path resolution helpers
# ---------------------------------------------------------------------------

def _resolve_path_for(model_id: str) -> str:
    """Return the first existing local path for the given model_id."""
    config = MODEL_REGISTRY.get(model_id)
    if config is None:
        raise ValueError(f"Unknown model_id: {model_id!r}. Choose from {list(MODEL_REGISTRY)}")

    for p in config["paths"]:
        if p and os.path.isfile(p):
            logger.info("Model %s found at: %s", model_id, p)
            return p

    # Special case: if MODEL_URL env-var is set and model_id is the default
    if model_id == "densenet-pro" and _ENV_MODEL_URL:
        return _download_model(_ENV_MODEL_URL)

    raise FileNotFoundError(
        f"Model '{model_id}' not found. Searched: {config['paths']}"
    )


def _download_model(url: str) -> str:
    """Download the model from *url* into CACHE_DIR. Cached after first download."""
    Path(CACHE_DIR).mkdir(parents=True, exist_ok=True)
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:12]
    cached_path = os.path.join(CACHE_DIR, f"model_{url_hash}.pth")

    if os.path.isfile(cached_path):
        logger.info("Model already cached at %s — skipping download.", cached_path)
        return cached_path

    logger.info("Downloading model from %s …", url)
    try:
        resp = requests.get(url, stream=True, timeout=600)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to download model from {url}: {exc}") from exc

    tmp_path = cached_path + ".tmp"
    downloaded = 0
    with open(tmp_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8 * 1024 * 1024):
            f.write(chunk)
            downloaded += len(chunk)

    os.replace(tmp_path, cached_path)
    logger.info("Model downloaded (%.1f MB) → %s", downloaded / (1024 * 1024), cached_path)
    return cached_path


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def load_class_mapping():
    """Load the class mapping JSON."""
    with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def build_densenet121(num_classes: int = 8, is_pro: bool = False):
    """Build DenseNet-121 with custom head (matches training setup)."""
    net = models.densenet121(weights=None)
    num_features = net.classifier.in_features
    
    if is_pro:
        # Based on the error log, Pro model has a deeper sequential head
        # Linear(1), BN(3), Linear(5), BN(7), Linear(9)
        net.classifier = torch.nn.Sequential(
            torch.nn.Dropout(p=0.4),            # 0
            torch.nn.Linear(num_features, 512), # 1
            torch.nn.ReLU(inplace=True),        # 2
            torch.nn.BatchNorm1d(512),          # 3
            torch.nn.Dropout(p=0.3),            # 4
            torch.nn.Linear(512, 256),          # 5
            torch.nn.ReLU(inplace=True),        # 6
            torch.nn.BatchNorm1d(256),          # 7
            torch.nn.Dropout(p=0.2),            # 8
            torch.nn.Linear(256, num_classes)   # 9
        )
    else:
        net.classifier = torch.nn.Sequential(
            torch.nn.Dropout(p=0.2),
            torch.nn.Linear(num_features, num_classes),
        )
    return net


def load_model_entry(model_id: str) -> dict:
    """
    Load a model (if not already cached) and return a dict with 'net' and 'grad_cam'.
    Handles both plain state-dicts and full training checkpoints.
    """
    if model_id in models_cache:
        return models_cache[model_id]

    config = MODEL_REGISTRY[model_id]
    num_classes = config.get("num_classes", len(class_mapping["class_order"]))
    is_pro = (model_id == "densenet-pro")

    model_path = _resolve_path_for(model_id)
    net = build_densenet121(num_classes=num_classes, is_pro=is_pro)

    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)

    # Support full training checkpoints that wrap the state dict
    disease_names = None
    optimal_thresholds = None
    
    if isinstance(checkpoint, dict):
        disease_names = checkpoint.get("disease_names")
        optimal_thresholds = checkpoint.get("optimal_thresholds")
        
        if "model_state_dict" in checkpoint:
            logger.info("Detected full training checkpoint for '%s', extracting model_state_dict", model_id)
            state_dict = checkpoint["model_state_dict"]
        elif "state_dict" in checkpoint:
            logger.info("Detected checkpoint with 'state_dict' key for '%s'", model_id)
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint  # Plain state dict
    else:
        state_dict = checkpoint

    # Clean up prefixes: 'module.' (DataParallel) and 'backbone.' (Custom wrapper)
    new_state_dict = {}
    for k, v in state_dict.items():
        name = k
        if name.startswith("module."):
            name = name.replace("module.", "", 1)
        if name.startswith("backbone."):
            name = name.replace("backbone.", "", 1)
        new_state_dict[name] = v

    net.load_state_dict(new_state_dict)
    net.eval()
    logger.info("Model '%s' loaded from %s", model_id, model_path)

    # Note: For Pro model, Grad-CAM target layer is still features.denseblock4 (standard for DenseNet121)
    target_layer = net.features.denseblock4
    gc = GradCAM(net, target_layer)
    logger.info("Grad-CAM initialised on features.denseblock4 for '%s'", model_id)

    entry = {
        "net": net,
        "grad_cam": gc,
        "disease_names": disease_names,
        "optimal_thresholds": optimal_thresholds
    }
    models_cache[model_id] = entry
    return entry




# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------

# Preprocessing pipeline — must match training exactly
preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def preprocess_image(image_bytes: bytes):
    """
    Preprocess a raw image for model inference.
    Returns (tensor [1,3,224,224], original PIL image).
    """
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(pil_image).unsqueeze(0)  # [1, 3, 224, 224]
    return tensor, pil_image


def generate_heatmap_image(cam: np.ndarray, original_image: Image.Image) -> str:
    """
    Colourize raw Grad-CAM heatmap and overlay it on the original image.
    Returns base64-encoded PNG data URI.
    """
    orig_w, orig_h = original_image.size
    cam_resized = cv2.resize(cam, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    cam_uint8 = np.uint8(255 * cam_resized)

    heatmap_colored = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgba = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2BGRA)
    heatmap_rgba[:, :, 3] = np.uint8(cam_resized * 200)

    success, buffer = cv2.imencode(".png", heatmap_rgba)
    if not success:
        raise RuntimeError("Failed to encode heatmap to PNG")

    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{b64}"


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Chest X-Ray EXAI Microservice",
    description="Multi-model DenseNet inference + Grad-CAM for chest X-ray analysis",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Load class mapping and eagerly warm up the default model."""
    global class_mapping

    logger.info("Starting EXAI microservice (multi-model) …")
    class_mapping = load_class_mapping()
    logger.info("Class mapping loaded: %s", class_mapping["class_order"])

    # Warm up default model so first request is fast
    try:
        load_model_entry("densenet-pro")
        logger.info("Default model 'densenet-pro' warmed up.")
    except Exception as exc:
        logger.warning("Could not warm up default model: %s", exc)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "loaded_models": list(models_cache.keys()),
        "available_models": list(MODEL_REGISTRY.keys()),
        "classes": class_mapping["class_order"] if class_mapping else [],
    }


@app.get("/models")
def list_models():
    """List all available models."""
    result = []
    for model_id, config in MODEL_REGISTRY.items():
        # Check at least one path exists (or URL is set)
        paths_exist = any(p and os.path.isfile(p) for p in config["paths"])
        url_set = model_id == "densenet-pro" and bool(_ENV_MODEL_URL)
        available = paths_exist or url_set
        result.append({
            "id": model_id,
            "display_name": config["display_name"],
            "available": available,
        })
    return {"models": result}


@app.post("/predict-exai")
async def predict_exai(
    file: UploadFile = File(...),
    model_id: Optional[str] = Form("densenet-pro"),
):
    """
    Analyze a chest X-ray image with the specified model.

    Request: multipart/form-data with:
      - 'file': image file
      - 'model_id': (optional) model identifier, defaults to 'densenet121-exai'

    Response JSON:
    {
        "model_id": "densenet-pro",
        "predictions": [...],
        "predicted_class": "Neumonía",
        "predicted_class_en": "Pneumonia",
        "confidence": 0.85,
        "heatmap_base64": "data:image/png;base64,...",
        "description": "..."
    }
    """
    if class_mapping is None:
        raise HTTPException(status_code=503, detail="Service not fully initialised yet")

    if model_id not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model_id '{model_id}'. Valid options: {list(MODEL_REGISTRY)}"
        )

    # Load (or retrieve cached) model
    try:
        entry = load_model_entry(model_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    net = entry["net"]
    grad_cam_instance = entry["grad_cam"]

    # Read and validate image
    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file received")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Preprocess
    try:
        input_tensor, original_image = preprocess_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")

    # Run Grad-CAM
    try:
        cam, predicted_idx, probabilities = grad_cam_instance.generate(input_tensor)
    except Exception as e:
        logger.error("Grad-CAM error (%s): %s", model_id, str(e))
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Build predictions
    disease_names = entry.get("disease_names")
    optimal_thresholds = entry.get("optimal_thresholds") or {}
    
    names_es = class_mapping["class_names_es"]
    descriptions_es = class_mapping["class_descriptions_es"]

    predictions = []
    
    if disease_names:
        es_to_en_map = {
            "Neumonía": "Pneumonia", "Neumonia": "Pneumonia", "Neumona": "Pneumonia", "Neumona": "Pneumonia",
            "Atelectasia": "Atelectasis", "Edema": "Edema", "Tuberculosis": "Tuberculosis",
            "COVID-19": "COVID-19", "Normal": "Normal", "Nodules": "Nodule", "Mass": "Mass"
        }
        for i, raw_name in enumerate(disease_names):
            # Sometimes encoding issues happen with 'Neumonía'
            clean_name = raw_name
            if 'Neumon' in raw_name:
                clean_name = 'Neumonía'
                
            prob = float(probabilities[i])
            threshold = optimal_thresholds.get(raw_name, optimal_thresholds.get(clean_name, 0.5))
            
            class_en = es_to_en_map.get(clean_name, clean_name)
            class_es = names_es.get(class_en, clean_name)
            
            predictions.append({
                "class_en": class_en,
                "class_es": class_es,
                "probability": round(prob, 6),
                "threshold": round(float(threshold), 6),
                "is_positive": prob >= threshold
            })
    else:
        class_order = class_mapping["class_order"]
        for i, class_en in enumerate(class_order):
            prob = float(probabilities[i])
            predictions.append({
                "class_en": class_en,
                "class_es": names_es.get(class_en, class_en),
                "probability": round(prob, 6),
                "threshold": 0.5,
                "is_positive": prob >= 0.5
            })

    predictions.sort(key=lambda x: x["probability"], reverse=True)
    top = predictions[0]

    # Generate heatmap
    try:
        heatmap_b64 = generate_heatmap_image(cam, original_image)
    except Exception as e:
        logger.error("Heatmap generation error: %s", str(e))
        heatmap_b64 = None

    return {
        "model_id": model_id,
        "predictions": predictions,
        "predicted_class": top["class_es"],
        "predicted_class_en": top["class_en"],
        "confidence": top["probability"],
        "heatmap_base64": heatmap_b64,
        "description": descriptions_es.get(top["class_en"], ""),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
