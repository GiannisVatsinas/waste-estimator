#!/bin/bash
# Start backend server
echo "Starting Waste Estimator Backend (FastAPI)..."
echo "-----------------------------------------------"
uv run --with fastapi --with uvicorn --with sqlalchemy --with ultralytics --with pillow --with python-multipart --with scikit-learn --with torch --with torchvision uvicorn main:app --reload --port 8000
