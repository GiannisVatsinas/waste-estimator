import json
import numpy as np
from sklearn.neighbors import KNeighborsRegressor
from sklearn.linear_model import BayesianRidge
from sqlalchemy import select
from database import ScanResult

def predict_weight(current_embedding, material, db):
    """
    Predicts weight based on k-NN of similar past items.
    """
    if not current_embedding or not material:
        return None, "Missing Data"

    # 1. Fetch history for this material
    # We need samples that have BOTH an embedding AND a verified actual_weight
    scans = db.query(ScanResult).filter(
        ScanResult.material == material,
        ScanResult.actual_weight != None,
        ScanResult.embedding != None
    ).all()

    # Parse data
    X = []
    y = []
    
    for scan in scans:
        try:
            emb = json.loads(scan.embedding)
            if len(emb) == len(current_embedding):
                X.append(emb)
                y.append(scan.actual_weight)
        except:
            continue
            
    num_samples = len(X)
    print(f"DEBUG: Found {num_samples} training samples for {material}")

    # 2. Logic based on sample size
    
    # Case A: Cold Start (No samples)
    if num_samples < 1:
        return None, "Cold Start"

    X = np.array(X)
    y = np.array(y)
    current_embedding = np.array(current_embedding).reshape(1, -1)

    # Case B: Very few samples (1-4) -> Weighted Average (1-NN or simple mean)
    if num_samples < 5:
        # Just use 1-NN or 2-NN to find the closest match
        k = min(num_samples, 3) 
        knn = KNeighborsRegressor(n_neighbors=k, weights='distance')
        knn.fit(X, y)
        prediction = knn.predict(current_embedding)[0]
        return float(prediction), f"k-NN (k={k})"

    # Case C: Enough samples -> Robust Regression or larger k-NN
    # For now, stick to k-NN as requested, maybe slightly larger k
    k = min(num_samples, 5)
    knn = KNeighborsRegressor(n_neighbors=k, weights='distance')
    knn.fit(X, y)
    prediction = knn.predict(current_embedding)[0]
    
    return float(prediction), f"k-NN (k={k})"
