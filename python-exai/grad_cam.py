"""
Grad-CAM implementation for DenseNet-121.
Computes gradient-weighted class activation maps from the last convolutional
layer (features.denseblock4) to produce heatmaps showing which image regions
the model focuses on for a given prediction.
"""

import numpy as np
import torch
import torch.nn.functional as F


class GradCAM:
    """
    Grad-CAM for DenseNet-121.
    Hooks into the target layer to capture activations and gradients,
    then computes the weighted activation map for a target class.
    """

    def __init__(self, model, target_layer):
        """
        Args:
            model: The DenseNet-121 model (eval mode).
            target_layer: The layer to hook, e.g. model.features.denseblock4
        """
        self.model = model
        self.target_layer = target_layer
        self.activations = None
        self.gradients = None

        # Register hooks
        self._forward_hook = target_layer.register_forward_hook(self._save_activation)
        self._backward_hook = target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        """Store the forward-pass activations."""
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        """Store the backward-pass gradients."""
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, target_class=None):
        """
        Generate a Grad-CAM heatmap.

        Args:
            input_tensor: Preprocessed image tensor [1, 3, 224, 224].
            target_class: Class index to generate heatmap for.
                          If None, uses the predicted class.

        Returns:
            heatmap: numpy array of shape (H_feature, W_feature), values in [0, 1].
            predicted_class: The predicted class index.
            probabilities: Softmax probabilities for all classes.
        """
        self.model.eval()
        input_tensor.requires_grad_(True)

        # Forward pass
        output = self.model(input_tensor)
        
        # Determine if it's a multilabel model (pro model uses sigmoid)
        # We can just apply sigmoid since it's an independent probability per class.
        # Softmax would force them to sum to 1, which breaks multilabel.
        probabilities = torch.sigmoid(output).detach().cpu().numpy()[0]

        if target_class is None:
            target_class = int(output.argmax(dim=1).item())

        # Zero all gradients
        self.model.zero_grad()

        # Backward pass for the target class
        target_score = output[0, target_class]
        target_score.backward()

        # Get the gradients and activations
        gradients = self.gradients[0]    # shape: (C, H_feat, W_feat)
        activations = self.activations[0]  # shape: (C, H_feat, W_feat)

        # Global average pooling of gradients → weights per channel
        weights = gradients.mean(dim=(1, 2))  # shape: (C,)

        # Weighted combination of activation maps
        cam = torch.zeros(activations.shape[1:], dtype=activations.dtype,
                          device=activations.device)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        # ReLU — keep only positive contributions
        cam = F.relu(cam)

        # Normalize to [0, 1]
        cam = cam.cpu().numpy()
        if cam.max() > 0:
            cam = cam / cam.max()

        return cam, target_class, probabilities

    def remove_hooks(self):
        """Remove the registered hooks."""
        self._forward_hook.remove()
        self._backward_hook.remove()
