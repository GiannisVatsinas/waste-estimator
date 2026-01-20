from ultralytics import YOLO
import random

# Load a pretrained YOLOv8 model (nano version for speed)
try:
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Error loading YOLO model: {e}")
    model = None

def analyze_image(image_path, db=None):
    if not model:
        # Fallback if model fails to load
        return {
            "weight": round(random.uniform(0.1, 2.5), 2),
            "confidence": 0.85,
            "category": "Unknown",
            "material": "Unknown",
            "detected_objects": ["Model Error"]
        }

    results = model(image_path)
    
    # Process results
    detected_objects = []
    confidence_sum = 0
    count = 0
    
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names[class_id]
            
            detected_objects.append(name)
            confidence_sum += conf
            count += 1
    
    # Simple logic to determine category based on objects
    category = "Mixed Waste"
    material = "Mixed"
    weight_estimate = 0.0
    
    if count > 0:
        avg_confidence = confidence_sum / count
        
        # Determine material first
        if "bottle" in detected_objects:
            category = "Plastic"
            material = "PET"
        elif "cup" in detected_objects:
            category = "Paper/Plastic"
            material = "Cup"
        elif "can" in detected_objects:
            category = "Metal"
            material = "Aluminum"
        
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
        else:
            # Fallback heuristics
            if material == "PET":
                weight_estimate = count * 0.05
            elif material == "Cup":
                weight_estimate = count * 0.02
            elif material == "Aluminum":
                weight_estimate = count * 0.015
            else:
                weight_estimate = count * 0.1
            
    else:
        avg_confidence = 0.0
        weight_estimate = 0.0
        
    return {
        "weight": round(weight_estimate, 3),
        "confidence": round(avg_confidence * 100, 1),
        "category": category,
        "material": material,
        "detected_objects": detected_objects if detected_objects else ["No objects detected"],
        "object_count": count
    }
