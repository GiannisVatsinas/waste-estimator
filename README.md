# Waste Estimator AI 🗑️

Waste Estimator is an intelligent application that uses computer vision to analyze images of waste, categorize them, and estimate their weight. It is designed to help track waste generation and improve recycling efforts.

![Waste Estimator Screenshot](https://via.placeholder.com/800x400?text=Waste+Estimator+Dashboard) *(Replace with actual screenshot)*

## 🚀 Features

-   **Image Analysis**: Upload photos of waste to automatically detect objects.
-   **Intelligent Categorization**: Identifies materials (Plastic, Glass, Metal, etc.) using YOLOv8.
-   **Weight Estimation**: Estimates waste weight based on detected objects and material density.
-   **History & Analytics**: Tracks past scans and visualizes waste trends over time.
-   **Sleek UI**: Modern, responsive interface built with React.
-   **Docker Support**: Easy deployment with Docker.

## 🛠️ Tech Stack

### Backend
-   **Language**: Python 3.11
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - High-performance web framework.
-   **AI Model**: [YOLOv8](https://docs.ultralytics.com/) (Ultralytics) - State-of-the-art object detection.
-   **Database**: SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM.
-   **Image Processing**: OpenCV, Pillow.

### Frontend
-   **Framework**: [React](https://react.dev/) (via [Vite](https://vitejs.dev/)).
-   **Styling**: Custom CSS (Modern, Responsive).
-   **Icons**: [Lucide React](https://lucide.dev/).
-   **Charts**: [Recharts](https://recharts.org/).

### DevOps
-   **Containerization**: Docker.

## 📂 Project Structure

```
waste-estimator/
├── backend/            # Backend API code
│   ├── main.py         # FastAPI application entry point
│   ├── model.py        # YOLOv8 inference logic
│   ├── database.py     # Database models and connection
│   └── Dockerfile      # Docker configuration for backend
├── src/                # Frontend React code
│   ├── components/     # Reusable UI components
│   ├── services/       # API integration services
│   ├── styles/         # CSS stylesheets
│   └── App.jsx         # Main application component
├── uploads/            # Temporary storage for uploaded images
├── requirements.txt    # Python dependencies
├── package.json        # Frontend dependencies
├── Dockerfile          # Root Dockerfile
└── README.md           # Project documentation
```

## ⚡ Getting Started

### Prerequisites
-   Python 3.10+
-   Node.js 18+
-   Docker (Optional)

### Local Installation

#### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
# Windows
start_backend.bat
# Linux/Mac
./run_backend.sh
```
The backend will run on `http://localhost:8000`.

#### 2. Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start the frontend development server
# Windows
start_frontend.bat
# Linux/Mac
./run_frontend.sh
# Or manually
npm run dev
```
The frontend will run on `http://localhost:5173`.

### 🐳 Docker Deployment

Build and run the application using Docker:

```bash
# Build the Docker image
docker build -t waste-estimator-backend .

# Run the container
docker run -p 7860:7860 waste-estimator-backend
```
The Docker container exposes port `7860` (compatible with Hugging Face Spaces).

## 🔌 API Documentation

Once the backend is running, full API documentation is available at:
-   **Swagger UI**: `http://localhost:8000/docs`
-   **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints
-   `POST /analyze`: Analysis endpoint accepting image uploads.
-   `GET /history`: Retrieve past scan history.
-   `PUT /scan/{id}/update_weight`: Manually correct estimated weight.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
