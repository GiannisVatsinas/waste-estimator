"""
Improved Weight Estimation Model V2 Lite
Material-based approach WITHOUT YOLO dependency (lightweight)
Uses material database and simple heuristics for object counting
"""

import json
import os
from datetime import datetime
from PIL import Image
import numpy as np

# ============================================================================
# MATERIAL WEIGHT DATABASE
# ============================================================================

class MaterialWeightDB:
    """
    Database of average weights per material and object type.
    Updates from user corrections using running average.
    """
    
    def __init__(self, db_path="material_weights.json"):
        self.db_path = db_path
        self.weights = self._load_or_initialize()
    
    def _load_or_initialize(self):
        """Load existing database or create with defaults"""
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, 'r') as f:
                    data = json.load(f)
                    print(f"[MaterialWeightDB] Loaded database with {len(data)} materials")
                    return data
            except Exception as e:
                print(f"[MaterialWeightDB] Failed to load: {e}")
        
        # Default weights (in kg) based on typical waste items
        defaults = {
            'Plastic': {
                'bottle': {'avg': 0.020, 'count': 0, 'std': 0.005, 'min': 0.010, 'max': 0.035},
                'bag': {'avg': 0.005, 'count': 0, 'std': 0.002, 'min': 0.002, 'max': 0.010},
                'container': {'avg': 0.050, 'count': 0, 'std': 0.015, 'min': 0.030, 'max': 0.100},
                'cup': {'avg': 0.010, 'count': 0, 'std': 0.003, 'min': 0.005, 'max': 0.020},
                'default': {'avg': 0.025, 'count': 0, 'std': 0.010, 'min': 0.010, 'max': 0.050}
            },
            'Glass': {
                'bottle': {'avg': 0.300, 'count': 0, 'std': 0.100, 'min': 0.150, 'max': 0.500},
                'jar': {'avg': 0.200, 'count': 0, 'std': 0.050, 'min': 0.100, 'max': 0.350},
                'default': {'avg': 0.250, 'count': 0, 'std': 0.100, 'min': 0.100, 'max': 0.500}
            },
            'Metal': {
                'can': {'avg': 0.015, 'count': 0, 'std': 0.003, 'min': 0.010, 'max': 0.025},
                'tin': {'avg': 0.100, 'count': 0, 'std': 0.030, 'min': 0.050, 'max': 0.200},
                'default': {'avg': 0.050, 'count': 0, 'std': 0.020, 'min': 0.010, 'max': 0.150}
            },
            'Paper': {
                'sheet': {'avg': 0.005, 'count': 0, 'std': 0.001, 'min': 0.003, 'max': 0.010},
                'cardboard': {'avg': 0.050, 'count': 0, 'std': 0.020, 'min': 0.020, 'max': 0.100},
                'default': {'avg': 0.020, 'count': 0, 'std': 0.010, 'min': 0.005, 'max': 0.050}
            },
            'Organic': {
                'default': {'avg': 0.100, 'count': 0, 'std': 0.050, 'min': 0.020, 'max': 0.300}
            },
            'Mixed Waste': {
                'default': {'avg': 0.050, 'count': 0, 'std': 0.030, 'min': 0.010, 'max': 0.200}
            }
        }
        
        print("[MaterialWeightDB] Initialized with default weights")
        return defaults
    
    def get_weight(self, material, object_type='default'):
        """Get average weight for material and object type"""
        if material: material = material.strip().title()
        if material not in self.weights:
            material = 'Mixed Waste'
        
        material_data = self.weights[material]
        
        if object_type in material_data:
            return material_data[object_type]['avg']
        elif 'default' in material_data:
            return material_data['default']['avg']
        else:
            return 0.050  # Fallback
    
    def get_confidence(self, material, object_type='default'):
        """Get confidence based on number of training samples"""
        if material: material = material.strip().title()
        if material not in self.weights:
            return 50.0
        
        material_data = self.weights[material]
        
        if object_type in material_data:
            count = material_data[object_type]['count']
        elif 'default' in material_data:
            count = material_data['default']['count']
        else:
            return 50.0
        
        # Confidence increases with more samples (max 95%)
        confidence = min(50 + count * 5, 95)
        return confidence
    
    def update(self, material, object_type, new_weight):
        """Update database with new weight using running average"""
        if material: material = material.strip().title()
        if material not in self.weights:
            material = 'Mixed Waste'
        
        material_data = self.weights[material]
        
        # Get or create entry
        if object_type not in material_data:
            if 'default' in material_data:
                object_type = 'default'
            else:
                material_data[object_type] = {
                    'avg': new_weight,
                    'count': 1,
                    'std': 0.0,
                    'min': new_weight,
                    'max': new_weight
                }
                self.save()
                print(f"[MaterialWeightDB] Created new entry: {material}/{object_type} = {new_weight:.3f} kg")
                return
        
        entry = material_data[object_type]
        
        # Running average
        old_avg = entry['avg']
        old_count = entry['count']
        
        new_avg = (old_avg * old_count + new_weight) / (old_count + 1)
        
        # Update entry
        entry['avg'] = new_avg
        entry['count'] = old_count + 1
        entry['min'] = min(entry.get('min', new_weight), new_weight)
        entry['max'] = max(entry.get('max', new_weight), new_weight)
        
        # Save to disk
        self.save()
        
        print(f"[MaterialWeightDB] Updated {material}/{object_type}: {old_avg:.3f} → {new_avg:.3f} kg (n={entry['count']})")
    
    def save(self):
        """Save database to disk"""
        try:
            with open(self.db_path, 'w') as f:
                json.dump(self.weights, f, indent=2)
        except Exception as e:
            print(f"[MaterialWeightDB] Failed to save: {e}")
    
    def get_stats(self):
        """Get database statistics"""
        stats = {}
        for material, data in self.weights.items():
            stats[material] = {}
            for obj_type, entry in data.items():
                stats[material][obj_type] = {
                    'avg_weight': round(entry['avg'], 3),
                    'samples': entry['count'],
                    'min': round(entry.get('min', 0), 3),
                    'max': round(entry.get('max', 0), 3)
                }
        return stats


# ============================================================================
# SIMPLE OBJECT ESTIMATOR (without YOLO)
# ============================================================================

class SimpleObjectEstimator:
    """
    Simple heuristic-based object counting without YOLO.
    Uses image analysis to estimate number of objects.
    """
    
    def estimate_count(self, image_path):
        """
        Estimate object count from image using simple heuristics.
        
        Returns:
            int: Estimated object count (default: 1)
        """
        try:
            img = Image.open(image_path)
            width, height = img.size
            
            # Simple heuristic: assume 1 object for now
            # In a real implementation, you could use:
            # - Image segmentation
            # - Connected components
            # - Clustering algorithms
            
            # For now, always return 1
            # User corrections will improve the weight database
            return 1
        
        except Exception as e:
            print(f"[SimpleObjectEstimator] Error: {e}")
            return 1


# ============================================================================
# WEIGHT ESTIMATOR V2 LITE
# ============================================================================

class WeightEstimatorV2Lite:
    """
    Lightweight weight estimator using material-based approach.
    No YOLO dependency - uses simple heuristics.
    """
    
    def __init__(self):
        self.db = MaterialWeightDB()
        self.estimator = SimpleObjectEstimator()
        print("[WeightEstimatorV2Lite] Initialized (no YOLO)")
    
    def predict(self, image_path, material):
        """
        Predict weight based on material and simple estimation.
        
        Args:
            image_path: Path to image
            material: Material type (Plastic, Glass, Metal, Paper, etc.)
        
        Returns:
            dict: Prediction results
        """
        # Estimate object count (simple heuristic)
        object_count = self.estimator.estimate_count(image_path)
        
        # Get weight from database
        unit_weight = self.db.get_weight(material, 'default')
        db_confidence = self.db.get_confidence(material, 'default')
        
        # Calculate total weight
        total_weight = unit_weight * object_count
        
        return {
            'weight': round(total_weight, 3),
            'confidence': round(db_confidence, 1),
            'object_count': object_count,
            'detected_objects': [],
            'object_type': 'default',
            'unit_weight': round(unit_weight, 3),
            'method': 'Material Database (Lite)'
        }
    
    def update_from_correction(self, image_path, material, actual_weight):
        """
        Update database when user corrects a prediction.
        
        Args:
            image_path: Path to image
            material: Material type
            actual_weight: Ground truth weight from user
        """
        # Estimate object count
        object_count = max(self.estimator.estimate_count(image_path), 1)
        
        # Calculate unit weight (per object)
        unit_weight = actual_weight / object_count
        
        # Update database
        self.db.update(material, 'default', unit_weight)
        
        return {
            'unit_weight': unit_weight,
            'object_count': object_count,
            'object_type': 'default'
        }
    
    def get_stats(self):
        """Get database statistics"""
        return self.db.get_stats()


# ============================================================================
# GLOBAL INSTANCE
# ============================================================================

_estimator_v2_lite = None

def get_estimator_v2_lite():
    """Get or create global estimator instance"""
    global _estimator_v2_lite
    if _estimator_v2_lite is None:
        _estimator_v2_lite = WeightEstimatorV2Lite()
    return _estimator_v2_lite


# ============================================================================
# MAIN INTERFACE
# ============================================================================

def analyze_image_v2(image_path, material):
    """
    Analyze image and predict weight using improved approach.
    
    Args:
        image_path: Path to image
        material: Material type
    
    Returns:
        dict: Analysis results
    """
    estimator = get_estimator_v2_lite()
    result = estimator.predict(image_path, material)
    
    return {
        'weight': result['weight'],
        'confidence': result['confidence'],
        'category': material,
        'material': material,
        'detected_objects': result['detected_objects'],
        'object_count': result['object_count'],
        'prediction_method': result['method'],
        'unit_weight': result.get('unit_weight', 0),
        'object_type': result.get('object_type', 'default')
    }


def update_model_v2(image_path, material, actual_weight):
    """
    Update model with user correction.
    
    Args:
        image_path: Path to image
        material: Material type
        actual_weight: Ground truth weight
    """
    estimator = get_estimator_v2_lite()
    return estimator.update_from_correction(image_path, material, actual_weight)


def get_model_stats_v2():
    """Get model statistics"""
    estimator = get_estimator_v2_lite()
    return estimator.get_stats()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    print("="*60)
    print("Weight Estimator V2 Lite - Test")
    print("="*60)
    
    estimator = get_estimator_v2_lite()
    
    # Print initial stats
    print("\nInitial Database:")
    stats = estimator.get_stats()
    for material, data in stats.items():
        print(f"\n{material}:")
        for obj_type, info in data.items():
            print(f"  {obj_type}: {info['avg_weight']:.3f} kg (n={info['samples']})")
    
    print("\n" + "="*60)
    print("✓ Estimator V2 Lite ready")
    print("="*60)
