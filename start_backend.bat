@echo off
echo Starting Waste Estimator Backend...
echo Ensure you have installed requirements: pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
pause
