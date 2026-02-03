"""
Neural Network Weight Estimator for WasteVisionAI
Direct Regression approach - predicts weight directly from images
"""

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os
import json
from datetime import datetime

# ============================================================================
# MODEL ARCHITECTURE
# ============================================================================

class WeightEstimator(nn.Module):
    """
    Neural network for weight estimation from images.
    Uses MobileNetV3 as backbone with material embeddings.
    """
    
    def __init__(self, num_materials=6, feature_dim=576, embedding_dim=32):
        super().__init__()
        
        # Feature Extractor (MobileNetV3 Small - lightweight)
        self.backbone = models.mobilenet_v3_small(
            weights=models.MobileNet_V3_Small_Weights.DEFAULT
        )
        
        # Remove classifier to get features
        self.backbone.classifier = nn.Identity()
        
        # Material embedding layer
        self.material_embedding = nn.Embedding(num_materials, embedding_dim)
        
        # Regression head with dropout for regularization
        self.regressor = nn.Sequential(
            nn.Linear(feature_dim + embedding_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.ReLU()  # Weight is always positive
        )
        
    def forward(self, image, material_id):
        """Forward pass"""
        # Extract visual features
        visual_features = self.backbone(image)
        
        # Get material embedding
        material_emb = self.material_embedding(material_id)
        
        # Concatenate features
        combined = torch.cat([visual_features, material_emb], dim=1)
        
        # Predict weight
        weight = self.regressor(combined)
        
        return weight


# ============================================================================
# PREDICTOR CLASS
# ============================================================================

class WeightPredictor:
    """
    High-level interface for weight prediction with online learning.
    """
    
    def __init__(self, model_path="weight_model.pth", device=None):
        """Initialize predictor"""
        # Auto-detect device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = device
        
        print(f"[WeightPredictor] Using device: {self.device}")
        
        # Initialize model
        self.model = WeightEstimator().to(self.device)
        
        # Load pretrained weights if exist
        if os.path.exists(model_path):
            try:
                self.model.load_state_dict(
                    torch.load(model_path, map_location=self.device)
                )
                print(f"[WeightPredictor] ✓ Loaded model from {model_path}")
            except Exception as e:
                print(f"[WeightPredictor] ⚠ Failed to load model: {e}")
                print(f"[WeightPredictor]   Using random initialization.")
        else:
            print(f"[WeightPredictor] ⚠ No pretrained model found.")
            print(f"[WeightPredictor]   Model will be saved to: {model_path}")
        
        self.model.eval()
        self.model_path = model_path
        
        # Image preprocessing (ImageNet normalization)
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Material to ID mapping
        self.material_to_id = {
            'Mixed Waste': 0,
            'Plastic': 1,
            'Paper': 2,
            'Glass': 3,
            'Metal': 4,
            'Organic': 5
        }
        
        # Training statistics
        self.training_history = []
        self._load_history()
    
    def predict(self, image_path, material):
        """
        Predict weight from image and material type.
        
        Args:
            image_path: Path to image file
            material: Material type string
        
        Returns:
            weight: Predicted weight in kg
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Get material ID
            material_id = self.material_to_id.get(material, 0)
            material_tensor = torch.tensor([material_id]).to(self.device)
            
            # Predict
            with torch.no_grad():
                weight = self.model(image_tensor, material_tensor)
            
            return float(weight.item())
        
        except Exception as e:
            print(f"[WeightPredictor] ✗ Prediction failed: {e}")
            # Return a reasonable default
            return 0.1
    
    def update_with_correction(self, image_path, material, actual_weight, 
                              lr=0.0001, steps=10, save=True):
        """
        Update model with user correction (online learning).
        
        Args:
            image_path: Path to image file
            material: Material type
            actual_weight: Ground truth weight
            lr: Learning rate
            steps: Number of gradient steps
            save: Save model after update
        
        Returns:
            final_loss: Final training loss
        """
        try:
            # Load and preprocess
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            material_id = self.material_to_id.get(material, 0)
            material_tensor = torch.tensor([material_id]).to(self.device)
            
            actual_weight_tensor = torch.tensor([[actual_weight]], dtype=torch.float32).to(self.device)
            
            # Setup training
            self.model.train()
            optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
            criterion = nn.MSELoss()
            
            # Training loop
            losses = []
            for step in range(steps):
                optimizer.zero_grad()
                
                predicted = self.model(image_tensor, material_tensor)
                loss = criterion(predicted, actual_weight_tensor)
                
                loss.backward()
                optimizer.step()
                
                losses.append(loss.item())
            
            self.model.eval()
            
            final_loss = losses[-1]
            
            # Log training
            self.training_history.append({
                'timestamp': datetime.now().isoformat(),
                'material': material,
                'actual_weight': actual_weight,
                'final_loss': final_loss,
                'steps': steps,
                'lr': lr
            })
            
            print(f"[WeightPredictor] ✓ Model updated: {material} = {actual_weight}kg (loss: {final_loss:.4f})")
            
            # Save model and history
            if save:
                self.save_model()
                self._save_history()
            
            return final_loss
        
        except Exception as e:
            print(f"[WeightPredictor] ✗ Update failed: {e}")
            return None
    
    def save_model(self, path=None):
        """Save model weights"""
        if path is None:
            path = self.model_path
        
        try:
            torch.save(self.model.state_dict(), path)
            print(f"[WeightPredictor] ✓ Model saved to {path}")
        except Exception as e:
            print(f"[WeightPredictor] ✗ Failed to save model: {e}")
    
    def _save_history(self):
        """Save training history to JSON"""
        try:
            history_path = self.model_path.replace('.pth', '_history.json')
            with open(history_path, 'w') as f:
                json.dump(self.training_history, f, indent=2)
        except Exception as e:
            print(f"[WeightPredictor] ⚠ Failed to save history: {e}")
    
    def _load_history(self):
        """Load training history from JSON"""
        try:
            history_path = self.model_path.replace('.pth', '_history.json')
            if os.path.exists(history_path):
                with open(history_path, 'r') as f:
                    self.training_history = json.load(f)
                print(f"[WeightPredictor] ✓ Loaded training history ({len(self.training_history)} updates)")
        except Exception as e:
            print(f"[WeightPredictor] ⚠ Failed to load history: {e}")
    
    def get_stats(self):
        """Get training statistics"""
        if len(self.training_history) == 0:
            return {
                'total_updates': 0,
                'materials': {}
            }
        
        materials = {}
        for entry in self.training_history:
            mat = entry['material']
            if mat not in materials:
                materials[mat] = 0
            materials[mat] += 1
        
        return {
            'total_updates': len(self.training_history),
            'materials': materials,
            'last_update': self.training_history[-1]['timestamp']
        }


# ============================================================================
# GLOBAL INSTANCE
# ============================================================================

# Global predictor instance
_predictor = None

def get_predictor():
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = WeightPredictor(model_path="weight_model.pth")
    return _predictor


# ============================================================================
# MAIN INTERFACE FOR model.py
# ============================================================================

def analyze_image(image_path, db=None, user_material=None):
    """
    Analyze image and predict weight using neural network.
    This replaces the old analyze_image() function.
    
    Args:
        image_path: Path to uploaded image
        db: Database session (optional, for compatibility)
        user_material: User-specified material type
    
    Returns:
        dict: Analysis results
    """
    predictor = get_predictor()
    
    material = user_material or "Mixed Waste"
    
    # Predict weight using neural network
    try:
        predicted_weight = predictor.predict(image_path, material)
        confidence = 85.0
        prediction_method = "Neural Network"
        
    except Exception as e:
        print(f"[analyze_image] Neural network prediction failed: {e}")
        predicted_weight = 0.1
        confidence = 50.0
        prediction_method = "Fallback"
    
    # Optional: Extract embedding for analytics
    embedding = None
    try:
        from feature_extractor import FeatureExtractor
        extractor = FeatureExtractor()
        embedding = extractor.get_embedding(image_path)
    except:
        pass
    
    return {
        "weight": round(predicted_weight, 3),
        "confidence": round(confidence, 1),
        "category": material,
        "material": material,
        "detected_objects": [],
        "object_count": 1,
        "embedding": embedding,
        "prediction_method": prediction_method
    }


def update_model_with_correction(image_path, material, actual_weight):
    """
    Update model with user correction.
    Called from main.py after user provides actual weight.
    
    Args:
        image_path: Path to image file
        material: Material type
        actual_weight: Ground truth weight
    
    Returns:
        loss: Training loss (or None if failed)
    """
    predictor = get_predictor()
    return predictor.update_with_correction(
        image_path=image_path,
        material=material,
        actual_weight=actual_weight,
        lr=0.0001,
        steps=10,
        save=True
    )


def get_model_stats():
    """Get model training statistics"""
    predictor = get_predictor()
    return predictor.get_stats()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Weight Estimator Model - Test")
    print("=" * 60)
    
    # Initialize
    predictor = get_predictor()
    
    # Print stats
    stats = predictor.get_stats()
    print(f"\nTraining Stats:")
    print(f"  Total updates: {stats['total_updates']}")
    print(f"  Materials: {stats.get('materials', {})}")
    
    print("\n✓ Model ready for use")
    print("=" * 60)
