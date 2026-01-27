import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np

class FeatureExtractor:
    def __init__(self):
        # Load pre-trained MobileNetV3 Small (lighter/faster)
        self.model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        
        # Remove the classifier head (final linear layer)
        # MobileNetV3 classifier is a Sequential block. We want the features before the final classification.
        # However, it's safer to just set the classifier to Identity or slice the model.
        # But for MobileNetV3, the classifier part includes pooling and hardswish. 
        # A common trick is to use `torch.nn.Identity()` for the last layer.
        self.model.classifier[3] = nn.Identity() 
        
        self.model.eval()
        
        # Standard ImageNet normalization
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def get_embedding(self, image_path):
        try:
            input_image = Image.open(image_path).convert('RGB')
            input_tensor = self.preprocess(input_image)
            input_batch = input_tensor.unsqueeze(0) # create a mini-batch as expected by the model

            with torch.no_grad():
                # Get the feature vector
                embedding = self.model(input_batch)
            
            # Convert to list for storage
            return embedding.flatten().tolist()
        except Exception as e:
            print(f"Error extracting features: {e}")
            return None
