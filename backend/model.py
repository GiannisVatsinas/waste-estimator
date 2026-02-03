"""
Updated model.py - Neural Network Weight Estimation
Replaces YOLOv8-based approach with direct regression
"""

# Import everything from weight_model
from weight_model import (
    analyze_image,
    update_model_with_correction,
    get_model_stats,
    get_predictor
)

# Initialize predictor on module load
print("[model.py] Initializing Neural Network Weight Estimator...")
predictor = get_predictor()
print("[model.py] ✓ Weight Estimator ready")

# Export functions for backward compatibility
__all__ = [
    'analyze_image',
    'update_model_with_correction', 
    'get_model_stats',
    'predictor'
]
