from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os
import json
from database import SessionLocal, init_db, ScanResult
from model import analyze_image

# Initialize DB
init_db()

app = FastAPI()


# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_endpoint(file: UploadFile = File(...), material: str = None, db: Session = Depends(get_db)):
    # Save uploaded file
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Run AI Analysis
    # Pass DB session to allow learning from history
    result_data = analyze_image(file_location, db, user_material=material)
    
    # Save to Database
    db_scan = ScanResult(
        filename=file.filename,
        category=result_data["category"],
        material=result_data["material"],
        weight=result_data["weight"],
        confidence=result_data["confidence"],
        object_count=result_data.get("object_count", 1),
        embedding=json.dumps(result_data.get("embedding")) if result_data.get("embedding") else None
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    
    return {
        "id": db_scan.id,
        "filename": db_scan.filename,
        **result_data
    }

@app.put("/scan/{scan_id}/update_weight")
def update_weight(scan_id: int, actual_weight: float, category: str = None, db: Session = Depends(get_db)):
    scan = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not scan:
        return {"error": "Scan not found"}
    
    scan.actual_weight = actual_weight
    if category:
        scan.category = category
        # Also update material to match category so future AI lookups for this material type use this weight
        scan.material = category 
        
    db.commit()
    return {"message": "Weight and Category updated successfully", "new_weight": actual_weight, "new_category": category}

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    scans = db.query(ScanResult).order_by(ScanResult.timestamp.desc()).limit(20).all()
    return scans

@app.get("/")
def read_root():
    return {"status": "WasteVisionAI Backend Running"}
