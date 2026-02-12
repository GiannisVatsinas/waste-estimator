
import os
from dotenv import load_dotenv

# Load config
load_dotenv()
API_KEY = os.getenv("ROBOFLOW_API_KEY")
WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "project-kq2no") # Default public
PROJECT = os.getenv("ROBOFLOW_PROJECT", "bottles-9je04")     # Default public
VERSION = int(os.getenv("ROBOFLOW_VERSION", 1))

print("========================================")
print(f"Testing Roboflow Connection...")
print(f"KEY: {'***' + API_KEY[-4:] if API_KEY else 'MISSING'}")
print(f"TARGET: {WORKSPACE}/{PROJECT}/{VERSION}")
print("========================================")

if not API_KEY:
    print("❌ ERROR: Please set ROBOFLOW_API_KEY in .env")
    exit(1)

try:
    from roboflow import Roboflow
    rf = Roboflow(api_key=API_KEY)
    
    print(f"Connecting to workspace '{WORKSPACE}'...")
    project = rf.workspace(WORKSPACE).project(PROJECT)
    
    print(f"Loading version {VERSION}...")
    model = project.version(VERSION).model
    
    print("✅ SUCCESS! Model initialized correctly.")
    print(f"Model ID: {model.id}")
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    print("\nTroubleshooting:")
    print("1. Check if your API Key is correct.")
    print("2. If using a Private/Forked project, set ROBOFLOW_WORKSPACE in .env")
    print("3. Ensure the version number is correct (default 1).")
