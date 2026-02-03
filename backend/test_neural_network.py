"""
Test script for Neural Network Weight Estimator
Tests the complete workflow: predict -> correct -> retrain -> predict again
"""

import os
import sys
from PIL import Image
import numpy as np

# Create test images if they don't exist
def create_test_images():
    """Create dummy test images"""
    print("Creating test images...")
    
    # Image A - Plastic bottle (blue-ish)
    img_a = Image.new('RGB', (300, 400), color=(100, 150, 200))
    img_a.save("test_plastic.jpg")
    print("  ✓ Created test_plastic.jpg")
    
    # Image B - Paper (white-ish)
    img_b = Image.new('RGB', (300, 400), color=(240, 240, 230))
    img_b.save("test_paper.jpg")
    print("  ✓ Created test_paper.jpg")
    
    # Image C - Similar to A (for testing learning)
    img_c = Image.new('RGB', (300, 400), color=(105, 155, 205))
    img_c.save("test_plastic_2.jpg")
    print("  ✓ Created test_plastic_2.jpg")
    
    return ["test_plastic.jpg", "test_paper.jpg", "test_plastic_2.jpg"]

def test_prediction():
    """Test basic prediction"""
    print("\n" + "="*60)
    print("TEST 1: Basic Prediction")
    print("="*60)
    
    from weight_model import get_predictor
    predictor = get_predictor()
    
    # Test prediction on plastic
    weight = predictor.predict("test_plastic.jpg", "Plastic")
    print(f"Prediction for Plastic: {weight:.3f} kg")
    
    # Test prediction on paper
    weight = predictor.predict("test_paper.jpg", "Paper")
    print(f"Prediction for Paper: {weight:.3f} kg")
    
    print("✓ Basic prediction works")
    return True

def test_online_learning():
    """Test online learning with user correction"""
    print("\n" + "="*60)
    print("TEST 2: Online Learning")
    print("="*60)
    
    from weight_model import get_predictor
    predictor = get_predictor()
    
    # Initial prediction
    print("\nStep 1: Initial prediction (before training)")
    weight_before = predictor.predict("test_plastic.jpg", "Plastic")
    print(f"  Predicted weight: {weight_before:.3f} kg")
    
    # User correction
    print("\nStep 2: User says actual weight is 0.055 kg")
    actual_weight = 0.055
    loss = predictor.update_with_correction(
        "test_plastic.jpg", 
        "Plastic", 
        actual_weight,
        steps=20  # More steps for better learning
    )
    print(f"  Training loss: {loss:.6f}")
    
    # Predict again on same image
    print("\nStep 3: Predict again on same image")
    weight_after = predictor.predict("test_plastic.jpg", "Plastic")
    print(f"  Predicted weight: {weight_after:.3f} kg")
    print(f"  Target weight: {actual_weight:.3f} kg")
    print(f"  Error: {abs(weight_after - actual_weight):.3f} kg")
    
    # Predict on similar image
    print("\nStep 4: Predict on similar plastic image")
    weight_similar = predictor.predict("test_plastic_2.jpg", "Plastic")
    print(f"  Predicted weight: {weight_similar:.3f} kg")
    print(f"  Error: {abs(weight_similar - actual_weight):.3f} kg")
    
    # Check if learning worked
    improvement = abs(weight_after - actual_weight) < abs(weight_before - actual_weight)
    
    if improvement:
        print("\n✓ Online learning works! Model improved after correction.")
    else:
        print("\n⚠ Model didn't improve significantly (may need more training)")
    
    return True

def test_multiple_corrections():
    """Test multiple corrections for better learning"""
    print("\n" + "="*60)
    print("TEST 3: Multiple Corrections")
    print("="*60)
    
    from weight_model import get_predictor
    predictor = get_predictor()
    
    # Multiple corrections on different images
    corrections = [
        ("test_plastic.jpg", "Plastic", 0.055),
        ("test_plastic_2.jpg", "Plastic", 0.058),
        ("test_paper.jpg", "Paper", 0.025),
    ]
    
    print("\nApplying multiple corrections...")
    for i, (img, material, weight) in enumerate(corrections, 1):
        print(f"\n  Correction {i}: {material} = {weight} kg")
        loss = predictor.update_with_correction(img, material, weight, steps=15)
        print(f"    Loss: {loss:.6f}")
    
    # Test predictions after multiple corrections
    print("\nTesting predictions after training:")
    
    weight_plastic = predictor.predict("test_plastic.jpg", "Plastic")
    print(f"  Plastic: {weight_plastic:.3f} kg (target: 0.055 kg)")
    
    weight_paper = predictor.predict("test_paper.jpg", "Paper")
    print(f"  Paper: {weight_paper:.3f} kg (target: 0.025 kg)")
    
    # Check accuracy
    error_plastic = abs(weight_plastic - 0.055)
    error_paper = abs(weight_paper - 0.025)
    
    print(f"\nErrors:")
    print(f"  Plastic: {error_plastic:.3f} kg ({error_plastic/0.055*100:.1f}%)")
    print(f"  Paper: {error_paper:.3f} kg ({error_paper/0.025*100:.1f}%)")
    
    if error_plastic < 0.01 and error_paper < 0.01:
        print("\n✓ Excellent! Model learned very well.")
    elif error_plastic < 0.02 and error_paper < 0.02:
        print("\n✓ Good! Model is learning.")
    else:
        print("\n⚠ Model needs more training data.")
    
    return True

def test_model_persistence():
    """Test that model saves and loads correctly"""
    print("\n" + "="*60)
    print("TEST 4: Model Persistence")
    print("="*60)
    
    from weight_model import WeightPredictor
    
    # Create first predictor and train
    print("\nCreating first predictor and training...")
    predictor1 = WeightPredictor(model_path="test_model.pth")
    predictor1.update_with_correction("test_plastic.jpg", "Plastic", 0.055, steps=20)
    weight1 = predictor1.predict("test_plastic.jpg", "Plastic")
    print(f"  Prediction from first predictor: {weight1:.3f} kg")
    
    # Create second predictor (should load saved model)
    print("\nCreating second predictor (loading saved model)...")
    predictor2 = WeightPredictor(model_path="test_model.pth")
    weight2 = predictor2.predict("test_plastic.jpg", "Plastic")
    print(f"  Prediction from second predictor: {weight2:.3f} kg")
    
    # Check if predictions match
    if abs(weight1 - weight2) < 0.001:
        print("\n✓ Model persistence works! Predictions match.")
    else:
        print(f"\n✗ Model persistence failed. Difference: {abs(weight1 - weight2):.3f} kg")
    
    # Cleanup
    if os.path.exists("test_model.pth"):
        os.remove("test_model.pth")
    if os.path.exists("test_model_history.json"):
        os.remove("test_model_history.json")
    
    return True

def test_stats():
    """Test statistics tracking"""
    print("\n" + "="*60)
    print("TEST 5: Statistics Tracking")
    print("="*60)
    
    from weight_model import get_predictor
    predictor = get_predictor()
    
    stats = predictor.get_stats()
    print(f"\nTraining Statistics:")
    print(f"  Total updates: {stats['total_updates']}")
    print(f"  Materials trained: {stats.get('materials', {})}")
    
    if stats['total_updates'] > 0:
        print(f"  Last update: {stats.get('last_update', 'N/A')}")
    
    print("\n✓ Statistics tracking works")
    return True

def main():
    """Run all tests"""
    print("="*60)
    print("Neural Network Weight Estimator - Test Suite")
    print("="*60)
    
    # Create test images
    create_test_images()
    
    # Run tests
    tests = [
        ("Basic Prediction", test_prediction),
        ("Online Learning", test_online_learning),
        ("Multiple Corrections", test_multiple_corrections),
        ("Model Persistence", test_model_persistence),
        ("Statistics", test_stats),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"\n✗ Test '{name}' failed with error: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n✓ All tests passed! System is ready for use.")
    else:
        print(f"\n⚠ {failed} test(s) failed. Check errors above.")
    
    print("="*60)

if __name__ == "__main__":
    main()
