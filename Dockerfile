# Χρησιμοποιούμε μια έκδοση Python που υποστηρίζει το YOLOv8
FROM python:3.11-slim

# Εγκατάσταση απαραίτητων βιβλιοθηκών συστήματος για το OpenCV και το YOLO
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Ορισμός φακέλου εργασίας
WORKDIR /code

# Αντιγραφή των απαιτήσεων και εγκατάσταση
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Αντιγραφή όλου του κώδικα του backend
COPY . .

# Κατέβασμα του μοντέλου YOLOv8n προκαταβολικά
RUN wget https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.pt -O yolov8n.pt

# Το Hugging Face Spaces χρησιμοποιεί την πόρτα 7860
ENV PORT=7860
EXPOSE 7860

# Εκκίνηση του FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
