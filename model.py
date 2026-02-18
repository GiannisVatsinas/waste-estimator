from ultralytics import YOLO
import random
import json
from feature_extractor import FeatureExtractor
from predictor import predict_weight

# Initialize Feature Extractor
feature_extractor = FeatureExtractor()

# Load a pretrained YOLOv8 model (small version for better accuracy)
# YOLOv8s detects 30% more objects than YOLOv8n (13 vs 10 bottles in tests)
try:
    model = YOLO("yolov8s.pt")
    print("[Model] Loaded YOLOv8s (Small) for improved accuracy")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

def analyze_image(image_path, db=None, user_material=None):
    if not model:
        # Fallback if model fails to load
        return {
            "weight": round(random.uniform(0.1, 2.5), 2),
            "confidence": 0.85,
            "category": "Unknown",
            "material": "Unknown",
            "detected_objects": ["Model Error"]
        }

    # Define classes that are likely hallucinations in a waste context
    # "teddy bear" often triggers on crumpled plastic/paper textures
    BLOCKED_CLASSES = {
        "teddy bear", "person", "giraffe", "zebra", "horse", "dog", "cat", 
        "backpack", "umbrella", "handbag", "tie", "suitcase", "bed", "toilet",
        "refrigerator", "oven", "microwave", "toaster", "sink", "dining table",
        "chair", "couch", "tv", "laptop", "keyboard", "mouse", "remote",
        "cell phone", "book", "clock", "vase", "scissors", "hair drier", "toothbrush"
    }

    # Run detection with VERY lower confidence threshold to catch crumpled bottles
    results = model(image_path, conf=0.05)
    
    # Process results
    detected_objects = []   # High confidence (standard)
    low_conf_objects = []   # Low confidence (requires user check)
    confidence_sum = 0
    
    HIGH_CONF_THRESH = 0.25
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names[class_id]
            
            # Filter out blocked classes (always ignore these)
            if name in BLOCKED_CLASSES:
                continue
            
            if conf >= HIGH_CONF_THRESH:
                detected_objects.append(name)
                confidence_sum += conf
            elif name == 'bottle':  
                # Only offer low-confidence fallback for BOTTLES as requested
                # This avoids suggesting "low confidence dining table" etc.
                low_conf_objects.append(name)
                
    # Use only HIGH CONF object count for default weight estimation
    # User can add low conf items interacting with Frontend
    count = len(detected_objects)
    
    # Simple logic to determine category based on objects
    category = "Mixed Waste"
    material = "Mixed"
    weight_estimate = 0.0
            
    # Override if user provided material (Always apply this)
    if user_material:
        material = user_material
        category = user_material 
        
    if count > 0:
        avg_confidence = confidence_sum / count
        
        # KEY CHANGE: Dynamic Weight Calculation
        # Check DB for previous actual weights for this material
        avg_weight_per_item = None
        if db:
            from database import ScanResult # Local import to avoid circular dependency
            from sqlalchemy import func
            
            # Query average of ACTUAL weights where available
            stats = db.query(
                func.sum(ScanResult.actual_weight), 
                func.sum(ScanResult.object_count)
            ).filter(
                ScanResult.material == material,
                ScanResult.actual_weight != None
            ).first()
            
            if stats[0] and stats[1] and stats[1] > 0:
                avg_weight_per_item = stats[0] / stats[1]
                print(f"DEBUG: Learning active. Found {stats[1]} items. Avg weight: {avg_weight_per_item}")
        
        if avg_weight_per_item:
            weight_estimate = count * avg_weight_per_item
            prediction_method = "Count x Learned Avg"
        else:
            # Fallback heuristics (Defaults from User Guide)
            defaults = {
                "Plastic": 0.020, # UPDATED: 0.020kg per bottle as requested
                "Glass": 0.250,
                "Metal": 0.050,
                "Paper": 0.020,
                "Organic": 0.100,
                "Mixed Waste": 0.050,
                "Mixed": 0.050
            }
            avg_weight_per_item = defaults.get(material, 0.050)
            weight_estimate = count * avg_weight_per_item
            prediction_method = "Count x Default Avg"
            
    else:
        avg_confidence = 0.0
        weight_estimate = 0.0
        prediction_method = "No Objects Detected"
        avg_weight_per_item = 0.0
        
    # 4. Extract Features (Embedding) - Still useful for future analysis
    embedding = feature_extractor.get_embedding(image_path)
    
    # 5. Final Prediction Logic
    # We strictly use the Count x Avg Weight logic as requested.
    # We only look at k-NN if we failed to estimate via count (e.g. count=0 but there is an image)
    
    predicted_weight = weight_estimate

    # If count is 0, try k-NN as a last resort fallback
    if predicted_weight == 0 and embedding and db:
        # Use database to find similar items
        p_weight, method = predict_weight(embedding, material, db)
        if p_weight is not None:
            predicted_weight = p_weight
            prediction_method = f"k-NN Fallback ({method})"
            print(f"DEBUG: Used k-NN fallback: {predicted_weight}")
            
    # Create a summary description
    from collections import Counter
    
    # Describe HIGH confidence objects
    obj_counts = Counter(detected_objects)
    description_parts = [f"{c} {name}{'s' if c > 1 else ''}" for name, c in obj_counts.items()]
    description = ", ".join(description_parts) if description_parts else "No reliable objects detected"
    
    # Add note about low confidence
    if low_conf_objects:
        lc_count = len(low_conf_objects)
        description += f" (+ {lc_count} potential bottles found)"
    
    return {
        "weight": round(predicted_weight, 3),
        "confidence": round(avg_confidence * 100, 1),
        "category": category,
        "material": material,
        "detected_objects": detected_objects if detected_objects else ["No objects detected"],
        "low_conf_objects": [],  # Hidden from user - low confidence items not shown
        "waste_objects": detected_objects,
        "object_count": count, 
        "embedding": embedding,
        "prediction_method": prediction_method,
        "description": description,
        "avg_weight_used": round(avg_weight_per_item, 3) if avg_weight_per_item else 0.0
    }
