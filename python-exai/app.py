"""
FastAPI microservice for chest X-ray inference with Explainable AI (Grad-CAM).
Loads a DenseNet-121 model trained on 8 chest X-ray classes and returns
predictions + Grad-CAM heatmaps.

Usage:
    uvicorn app:app --host 0.0.0.0 --port 8000
"""

import io
import os
import json
import base64
import logging

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from grad_cam import GradCAM

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("exai-service")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(BASE_DIR, "..", "best_densenet121.pth")
)
CLASS_MAPPING_PATH = os.path.join(BASE_DIR, "class_mapping.json")

# ImageNet normalization (same as training)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]
IMG_SIZE = 224

# ---------------------------------------------------------------------------
# Global state — loaded once at startup
# ---------------------------------------------------------------------------
model = None
grad_cam_instance = None
class_mapping = None


def load_class_mapping():
    """Load the class mapping JSON."""
    with open(CLASS_MAPPING_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_model(model_path: str, num_classes: int = 8):
    """
    Load the DenseNet-121 model from a .pth checkpoint.
    Mirrors the training setup: ImageNet features + custom classifier head.
    """
    net = models.densenet121(weights=None)
    # Replace classifier head to match training (8 classes)
    # Training used nn.Sequential(Dropout, Linear) → keys: classifier.0.*, classifier.1.*
    num_features = net.classifier.in_features
    net.classifier = torch.nn.Sequential(
        torch.nn.Dropout(p=0.2),
        torch.nn.Linear(num_features, num_classes),
    )

    # Load trained weights
    state_dict = torch.load(model_path, map_location="cpu", weights_only=True)

    # Handle DataParallel-wrapped state dicts (keys prefixed with 'module.')
    if any(k.startswith("module.") for k in state_dict.keys()):
        state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}

    net.load_state_dict(state_dict)
    net.eval()
    logger.info("✅ DenseNet-121 model loaded from %s", model_path)
    return net


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
    Take the raw Grad-CAM heatmap and produce a colorized PNG overlay
    at the original image size, returned as a base64 data-URI.

    Args:
        cam: 2D numpy array in [0, 1], shape (H_feat, W_feat).
        original_image: Original PIL Image (any size).

    Returns:
        Base64-encoded PNG data URI string.
    """
    orig_w, orig_h = original_image.size

    # Resize heatmap to original image dimensions
    cam_resized = cv2.resize(cam, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)

    # Convert to uint8 for colormap
    cam_uint8 = np.uint8(255 * cam_resized)

    # Apply JET colormap (blue → green → yellow → red)
    heatmap_colored = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    # Convert BGR → RGBA and set alpha based on intensity
    heatmap_rgba = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2BGRA)
    # Alpha channel: transparent where heatmap is cold, opaque where hot
    heatmap_rgba[:, :, 3] = np.uint8(cam_resized * 200)  # max alpha = 200/255

    # Encode to PNG in memory
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
    description="DenseNet-121 inference + Grad-CAM for chest X-ray analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Load model and class mapping once when the server starts."""
    global model, grad_cam_instance, class_mapping

    logger.info("🚀 Starting EXAI microservice...")

    # Load class mapping
    class_mapping = load_class_mapping()
    logger.info("📋 Class mapping loaded: %s", class_mapping["class_order"])

    # Load model
    model = load_model(MODEL_PATH, num_classes=len(class_mapping["class_order"]))

    # Initialize Grad-CAM on the last dense block
    # DenseNet-121 architecture: features → (conv0, norm0, relu0, pool0,
    #   denseblock1, transition1, denseblock2, transition2,
    #   denseblock3, transition3, denseblock4)
    target_layer = model.features.denseblock4
    grad_cam_instance = GradCAM(model, target_layer)
    logger.info("🔥 Grad-CAM initialized on features.denseblock4")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "classes": class_mapping["class_order"] if class_mapping else [],
    }


@app.post("/predict-exai")
async def predict_exai(file: UploadFile = File(...)):
    """
    Analyze a chest X-ray image:
    - Run DenseNet-121 inference
    - Generate Grad-CAM heatmap
    - Return predictions + heatmap

    Request: multipart/form-data with 'file' field containing the image.

    Response JSON:
    {
        "predictions": [
            {"class_en": "Pneumonia", "class_es": "Neumonía", "probability": 0.85},
            ...
        ],
        "predicted_class": "Neumonía",
        "predicted_class_en": "Pneumonia",
        "confidence": 0.85,
        "heatmap_base64": "data:image/png;base64,...",
        "description": "Opacidad focal sugestiva de consolidación neumónica."
    }
    """
    if model is None or grad_cam_instance is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

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

    # Run Grad-CAM (inference + heatmap generation)
    try:
        cam, predicted_idx, probabilities = grad_cam_instance.generate(input_tensor)
    except Exception as e:
        logger.error("Grad-CAM error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Build predictions list sorted by probability (descending)
    class_order = class_mapping["class_order"]
    names_es = class_mapping["class_names_es"]
    descriptions_es = class_mapping["class_descriptions_es"]

    predictions = []
    for i, class_en in enumerate(class_order):
        predictions.append({
            "class_en": class_en,
            "class_es": names_es.get(class_en, class_en),
            "probability": round(float(probabilities[i]), 6),
        })

    # Sort descending by probability
    predictions.sort(key=lambda x: x["probability"], reverse=True)

    top = predictions[0]

    # Generate heatmap image
    try:
        heatmap_b64 = generate_heatmap_image(cam, original_image)
    except Exception as e:
        logger.error("Heatmap generation error: %s", str(e))
        heatmap_b64 = None

    return {
        "predictions": predictions,
        "predicted_class": top["class_es"],
        "predicted_class_en": top["class_en"],
        "confidence": top["probability"],
        "heatmap_base64": heatmap_b64,
        "description": descriptions_es.get(top["class_en"], ""),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
