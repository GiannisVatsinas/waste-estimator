"""
Updated model.py - Using Weight Estimator V2 Lite
Material-based approach without YOLO (lightweight)
"""

# Import V2 Lite functions
from weight_model_v2_lite import (
    analyze_image_v2,
    update_model_v2,
    get_model_stats_v2,
    get_estimator_v2_lite
)

# Wrapper functions for compatibility
def analyze_image(image_path, db=None, user_material=None):
    """
    Analyze image using V2 Lite estimator.
    
    Args:
        image_path: Path to image
        db: Database session (not used in V2)
        user_material: Material type
    
    Returns:
        dict: Analysis results
    """
    material = user_material or "Mixed Waste"
    return analyze_image_v2(image_path, material)


def update_model_with_correction(image_path, material, actual_weight):
    """
    Update model with user correction.
    
    Args:
        image_path: Path to image
        material: Material type
        actual_weight: Ground truth weight
    """
    return update_model_v2(image_path, material, actual_weight)


def get_model_stats():
    """Get model statistics"""
    return get_model_stats_v2()


# Initialize estimator on module load
print("[model.py] Initializing Weight Estimator V2 Lite...")
estimator = get_estimator_v2_lite()
print("[model.py] ✓ Weight Estimator V2 Lite ready")

# Export
__all__ = [
    'analyze_image',
    'update_model_with_correction',
    'get_model_stats',
    'estimator'
]
