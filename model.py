from ultralytics import YOLO
import random
import json
import os
from dotenv import load_dotenv
from feature_extractor import FeatureExtractor
from predictor import predict_weight

# Load env variables
load_dotenv()
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
RF_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "project-kq2no")
RF_PROJECT = os.getenv("ROBOFLOW_PROJECT", "bottles-9je04")
RF_VERSION = int(os.getenv("ROBOFLOW_VERSION", 1))

# Initialize Feature Extractor
feature_extractor = FeatureExtractor()

# Initialize Models
rf_model = None
local_model = None

try:
    if ROBOFLOW_API_KEY:
        print("[Model] Initializing Roboflow Model...")
        from roboflow import Roboflow
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)
        project = rf.workspace(RF_WORKSPACE).project(RF_PROJECT)
        rf_model = project.version(RF_VERSION).model
        print(f"[Model] Using Roboflow Model: {RF_WORKSPACE}/{RF_PROJECT}/{RF_VERSION}")
    else:
        raise Exception("No API Key found")
except Exception as e:
    print(f"[Model] Using Local YOLOv8s (Fallback: {e})")
    try:
        local_model = YOLO("yolov8s.pt")
        print("[Model] Loaded YOLOv8s (Small) for improved accuracy")
    except Exception as ex:
        print(f"Error loading local YOLO model: {ex}")

def analyze_image(image_path, db=None, user_material="Plastic"):
    detected_objects = []   # High confidence
    low_conf_objects = []   # Low confidence (requires check)
    confidence_sum = 0
    
    # Define thresholds
    HIGH_CONF_THRESH = 0.25
    LOW_CONF_THRESH = 0.05
    
    # Define classes to block (hallucinations)
    BLOCKED_CLASSES = {
        "teddy bear", "person", "giraffe", "zebra", "horse", "dog", "cat", 
        "backpack", "umbrella", "handbag", "tie", "suitcase", "bed", "toilet"
    }

    # 1. Try ROBOFLOW Inference
    if rf_model:
        try:
            # Predict with low confidence (Roboflow returns object, .json() gets dict)
            resp = rf_model.predict(image_path, confidence=LOW_CONF_THRESH*100, overlap=30).json()
            
            for pred in resp['predictions']:
                name = pred['class']
                conf = pred['confidence']
                
                if name in BLOCKED_CLASSES: continue
                
                # Normalize class names from external datasets
                if "bottle" in name.lower():
                    name = "bottle"
                
                if conf >= HIGH_CONF_THRESH:
                    detected_objects.append(name)
                    confidence_sum += conf
                elif name == 'bottle':
                    low_conf_objects.append(name)
                    
        except Exception as e:
            print(f"[Model] Roboflow Inference Failed: {e}")
            # Ensure local model is ready for fallback
            if not local_model:
                 try: 
                     global local_model
                     local_model = YOLO('yolov8s.pt')
                 except: pass

    # 2. Try LOCAL YOLO Inference (Fallback)
    # Run if Roboflow didn't run OR returned nothing/failed (and we want to try local too?)
    # For now, if RF is active, we trust it. Only fallback if NO RF model or RF failed/returned nothing?
    # Actually, if RF returns 0 objects, maybe local model is better? 
    # Let's stick to: Use RF if loaded. Use Local if RF not loaded.
    
    if not rf_model and local_model:
        results = local_model(image_path, conf=LOW_CONF_THRESH)
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                conf = float(box.conf[0])
                name = local_model.names[class_id]
                
                if name in BLOCKED_CLASSES: continue
                
                if conf >= HIGH_CONF_THRESH:
                    detected_objects.append(name)
                    confidence_sum += conf
                elif name == 'bottle':
                    low_conf_objects.append(name)
    
    # 3. Handle Complete Failure
    if not detected_objects and not low_conf_objects:
        # If both failed, return empty or error
        pass # Will result in count=0 below
                
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
        "low_conf_objects": low_conf_objects, # List of low confidence bottles for user review
        "waste_objects": detected_objects, # Only high conf are counted by default
        "object_count": count, 
        "embedding": embedding,
        "prediction_method": prediction_method,
        # New fields for Frontend
        "description": description,
        "avg_weight_used": round(avg_weight_per_item, 3) if avg_weight_per_item else 0.0
    }
