#!/bin/bash

echo "============================================================"
echo "WasteVisionAI - Neural Network Weight Estimator"
echo "Quick Start Script"
echo "============================================================"

cd /home/ubuntu/waste-estimator/backend

# Check if server is already running
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ Server is already running on http://localhost:8000"
else
    echo "Starting server..."
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    sleep 3
    
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo "✓ Server started successfully on http://localhost:8000"
    else
        echo "✗ Failed to start server"
        exit 1
    fi
fi

echo ""
echo "Available endpoints:"
echo "  POST   http://localhost:8000/analyze"
echo "  PUT    http://localhost:8000/scan/{id}/update_weight"
echo "  GET    http://localhost:8000/model/stats"
echo "  GET    http://localhost:8000/history"
echo ""
echo "Run tests:"
echo "  python3 test_neural_network.py"
echo "  python3 demo_learning.py"
echo ""
echo "View documentation:"
echo "  cat IMPLEMENTATION_GUIDE.md"
echo "  cat CHANGES.txt"
echo ""
echo "============================================================"
