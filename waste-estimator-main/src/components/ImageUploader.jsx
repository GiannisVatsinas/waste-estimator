import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ onImageSelected }) => {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        // In a real app, we might check file type here
        const reader = new FileReader();
        reader.onload = (e) => {
            onImageSelected(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className={`upload-container ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                ref={inputRef}
                type="file"
                className="file-input"
                onChange={handleChange}
                accept="image/*"
            />

            <div className="upload-content">
                <div className="icon-wrapper">
                    <Upload size={48} className="upload-icon" />
                </div>
                <h3>Upload Waste Photo</h3>
                <p>Drag & drop or click to browse</p>
                <button className="upload-btn" onClick={() => inputRef.current?.click()}>
                    Select File
                </button>
            </div>

            <style>{`
        .upload-container {
          width: 100%;
          max-width: 600px;
          height: 300px;
          border: 2px dashed #cbd5e1;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .upload-container.drag-active {
          border-color: var(--primary-color);
          background: rgba(16, 185, 129, 0.1);
          transform: scale(1.02);
        }

        .file-input {
          display: none;
        }

        .upload-content {
          text-align: center;
          z-index: 10;
        }

        .icon-wrapper {
          margin-bottom: 1rem;
          color: var(--primary-color);
          background: rgba(16, 185, 129, 0.1);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .upload-content h3 {
          margin: 0 0 0.5rem;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .upload-content p {
          margin: 0 0 1.5rem;
          color: var(--text-secondary);
        }

        .upload-btn {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 9999px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
        }

        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
        }
      `}</style>
        </div>
    );
};

export default ImageUploader;
