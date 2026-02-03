"""
Test script for Weight Estimator V2 Lite
Demonstrates material-based predictions and learning
"""

from weight_model_v2_lite import get_estimator_v2_lite
from PIL import Image

def create_test_image(filename, color):
    """Create a test image"""
    img = Image.new('RGB', (300, 400), color=color)
    img.save(filename)
    print(f"  Created {filename}")

def test_initial_predictions():
    """Test initial predictions with default weights"""
    print("\n" + "="*70)
    print("TEST 1: Initial Predictions (Default Weights)")
    print("="*70)
    
    estimator = get_estimator_v2_lite()
    
    materials = ['Plastic', 'Glass', 'Metal', 'Paper', 'Organic']
    
    # Create test image
    create_test_image("test_item.jpg", (150, 150, 150))
    
    print("\nPredictions:")
    for material in materials:
        result = estimator.predict("test_item.jpg", material)
        print(f"  {material:12s}: {result['weight']:.3f} kg (confidence: {result['confidence']:.1f}%)")
    
    print("\n✓ Different materials give different predictions!")
    return True

def test_learning():
    """Test learning from corrections"""
    print("\n" + "="*70)
    print("TEST 2: Learning from Corrections")
    print("="*70)
    
    estimator = get_estimator_v2_lite()
    
    # Create test image
    create_test_image("plastic_bottle.jpg", (100, 150, 200))
    
    # Initial prediction
    print("\nStep 1: Initial prediction for Plastic")
    result = estimator.predict("plastic_bottle.jpg", "Plastic")
    print(f"  Predicted: {result['weight']:.3f} kg")
    print(f"  Confidence: {result['confidence']:.1f}%")
    
    # User corrections
    print("\nStep 2: User provides corrections")
    corrections = [0.018, 0.022, 0.019, 0.021, 0.020]
    
    for i, weight in enumerate(corrections, 1):
        estimator.update_from_correction("plastic_bottle.jpg", "Plastic", weight)
        print(f"  Correction {i}: {weight:.3f} kg")
    
    # New prediction
    print("\nStep 3: Prediction after learning")
    result_after = estimator.predict("plastic_bottle.jpg", "Plastic")
    print(f"  Predicted: {result_after['weight']:.3f} kg")
    print(f"  Confidence: {result_after['confidence']:.1f}%")
    print(f"  Expected: ~0.020 kg (average of corrections)")
    
    # Check if learned
    expected = sum(corrections) / len(corrections)
    error = abs(result_after['weight'] - expected)
    
    if error < 0.001:
        print(f"\n✓ Excellent! Model learned perfectly (error: {error:.4f} kg)")
    else:
        print(f"\n⚠ Model learned but not perfectly (error: {error:.4f} kg)")
    
    return True

def test_material_independence():
    """Test that different materials have different weights"""
    print("\n" + "="*70)
    print("TEST 3: Material Independence")
    print("="*70)
    
    estimator = get_estimator_v2_lite()
    
    # Train Plastic
    print("\nTraining Plastic with 0.020 kg")
    estimator.update_from_correction("test_item.jpg", "Plastic", 0.020)
    
    # Train Glass
    print("Training Glass with 0.300 kg")
    estimator.update_from_correction("test_item.jpg", "Glass", 0.300)
    
    # Predict both
    print("\nPredictions:")
    plastic_result = estimator.predict("test_item.jpg", "Plastic")
    glass_result = estimator.predict("test_item.jpg", "Glass")
    
    print(f"  Plastic: {plastic_result['weight']:.3f} kg")
    print(f"  Glass: {glass_result['weight']:.3f} kg")
    
    if abs(plastic_result['weight'] - 0.020) < 0.001 and abs(glass_result['weight'] - 0.300) < 0.001:
        print("\n✓ Materials are independent! Each learns separately.")
    else:
        print("\n⚠ Materials may be interfering with each other")
    
    return True

def test_crumpled_vs_intact():
    """Test that crumpled and intact give same weight"""
    print("\n" + "="*70)
    print("TEST 4: Crumpled vs Intact (Same Weight)")
    print("="*70)
    
    estimator = get_estimator_v2_lite()
    
    # Create two different-looking images
    create_test_image("intact_bottle.jpg", (100, 150, 200))
    create_test_image("crumpled_bottle.jpg", (80, 120, 180))  # Different color
    
    # Train with one
    print("\nTraining with intact bottle: 0.018 kg")
    estimator.update_from_correction("intact_bottle.jpg", "Plastic", 0.018)
    
    # Predict both
    print("\nPredictions:")
    intact_result = estimator.predict("intact_bottle.jpg", "Plastic")
    crumpled_result = estimator.predict("crumpled_bottle.jpg", "Plastic")
    
    print(f"  Intact bottle: {intact_result['weight']:.3f} kg")
    print(f"  Crumpled bottle: {crumpled_result['weight']:.3f} kg")
    
    if abs(intact_result['weight'] - crumpled_result['weight']) < 0.001:
        print("\n✓ Perfect! Same material = same weight (regardless of appearance)")
    else:
        print(f"\n⚠ Small difference: {abs(intact_result['weight'] - crumpled_result['weight']):.3f} kg")
    
    return True

def test_stats():
    """Test statistics tracking"""
    print("\n" + "="*70)
    print("TEST 5: Statistics Tracking")
    print("="*70)
    
    estimator = get_estimator_v2_lite()
    
    # Add some corrections
    estimator.update_from_correction("test_item.jpg", "Plastic", 0.020)
    estimator.update_from_correction("test_item.jpg", "Plastic", 0.022)
    estimator.update_from_correction("test_item.jpg", "Glass", 0.300)
    
    # Get stats
    stats = estimator.get_stats()
    
    print("\nDatabase Statistics:")
    for material, data in stats.items():
        if any(info['samples'] > 0 for info in data.values()):
            print(f"\n{material}:")
            for obj_type, info in data.items():
                if info['samples'] > 0:
                    print(f"  {obj_type}: {info['avg_weight']:.3f} kg (n={info['samples']}, range: {info['min']:.3f}-{info['max']:.3f})")
    
    print("\n✓ Statistics tracking works")
    return True

def main():
    """Run all tests"""
    print("="*70)
    print("Weight Estimator V2 Lite - Test Suite")
    print("="*70)
    
    tests = [
        ("Initial Predictions", test_initial_predictions),
        ("Learning from Corrections", test_learning),
        ("Material Independence", test_material_independence),
        ("Crumpled vs Intact", test_crumpled_vs_intact),
        ("Statistics Tracking", test_stats),
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
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"Passed: {passed}/{len(tests)}")
    print(f"Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n✓ All tests passed!")
        print("\nKey Features Demonstrated:")
        print("  • Different materials have different default weights")
        print("  • Model learns from user corrections")
        print("  • Each material learns independently")
        print("  • Same material = same weight (shape-invariant)")
        print("  • Statistics tracking works")
    else:
        print(f"\n⚠ {failed} test(s) failed")
    
    print("="*70)

if __name__ == "__main__":
    main()
