import requests
import os
import shutil
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_IMAGE_SOURCE = "../test_scan.jpg" 
TEST_IMAGE_A = "test_image_A.jpg"
TEST_IMAGE_B = "test_image_B.jpg" # Identical or similar
SCAN_ID = None

def setup():
    # Always create valid dummy images for testing to avoid issues with source file
    print("Creating dummy images...")
    from PIL import Image
    # Image A
    img = Image.new('RGB', (224, 224), color = (73, 109, 137))
    img.save(TEST_IMAGE_A)
    # Image B (Similar)
    img2 = Image.new('RGB', (224, 224), color = (75, 110, 140)) 
    img2.save(TEST_IMAGE_B)

def test_analyze(image_path, label, material=None):
    print(f"\n--- Analyzing {label} ({image_path}) [Material: {material}] ---")
    with open(image_path, "rb") as f:
        files = {"file": f}
        params = {}
        if material: params["material"] = material
        response = requests.post(f"{BASE_URL}/analyze", files=files, params=params)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Result: {data['weight']}g, Material: {data['material']}")
        print(f"Method: {data.get('prediction_method', 'N/A')}")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def test_correction(scan_id, weight, category):
    print(f"\n--- Correcting Scan ID {scan_id} to {weight}g ({category}) ---")
    response = requests.put(
        f"{BASE_URL}/scan/{scan_id}/update_weight", 
        params={"actual_weight": weight, "category": category}
    )
    if response.status_code == 200:
        print("Correction success.")
    else:
        print(f"Error correcting: {response.text}")

def main():
    setup()
    
    # 1. First Scan (Cold Start)
    result_a = test_analyze(TEST_IMAGE_A, "Image A (First time)")
    if not result_a: return
    
    scan_id = result_a["id"]
    initial_weight = result_a["weight"]
    
    # 2. User Correction (Simulate user saying "No, it's 55g")
    target_weight = 55.0
    test_correction(scan_id, target_weight, "Plastic")
    
    # 3. Second Scan (Similar Image) with known material
    # The system should now find the previous scan and use its weight
    result_b = test_analyze(TEST_IMAGE_B, "Image B (Similar Object)", material="Plastic")
    
    if result_b:
        print(f"\nComparison:")
        print(f"A (Initial): {initial_weight}g")
        print(f"B (After Learning): {result_b['weight']}g")
        
        if abs(result_b['weight'] - target_weight) < 1.0:
            print("\nSUCCESS: System learned the new weight!")
        else:
            print("\nFAILURE: System did not predict the corrected weight.")
            
if __name__ == "__main__":
    main()
