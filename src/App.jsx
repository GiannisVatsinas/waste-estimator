import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import StatsRow from './components/StatsRow';
import { Brain, Database, BarChart3, Trash2, Download, ListFilter } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import AnalysisView from './components/AnalysisView';
import ResultCard from './components/ResultCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { saveScan, getStats, getScans, deleteScan, deleteScans } from './services/storage';

// Standardized Waste Categories
const WASTE_CATEGORIES = [
  'Mixed Waste',
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Organic'
];

function App() {
  const [activeTab, setActiveTab] = useState('training');
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [wasteType, setWasteType] = useState(WASTE_CATEGORIES[0]);

  // Data State
  const [stats, setStats] = useState(getStats());
  const [recentScans, setRecentScans] = useState(getScans());
  const [selectedIds, setSelectedIds] = useState([]);

  // Function to refresh data logic
  const refreshData = () => {
    setStats(getStats());
    setRecentScans(getScans());
    setSelectedIds([]); // Clear selection on refresh
  };

  // Calculate Average Weight
  const avgWeight = stats.totalItems > 0 ? (parseFloat(stats.totalWeight) / stats.totalItems).toFixed(2) : "0.00";

  const handleImageSelected = async (imgData) => {
    setImage(imgData);
    setIsAnalyzing(true);

    try {
      // 1. Prepare for Real Backend
      const res = await fetch(imgData);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", blob, `scan_${Date.now()}.jpg`);

      // 2. Attempt Contact with Python Backend
      const response = await fetch(`http://localhost:8000/analyze?material=${encodeURIComponent(wasteType)}`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Backend unavailable");

      const data = await response.json();

      setResult({
        ...data, // Pass all backend fields (description, avg_weight_used, etc.)
        // Override backend category with User Selected Waste Type (can be corrected later)
        category: wasteType,
        material: wasteType
      });

    } catch (error) {
      console.log("Using Mock Logic (Backend Offline)", error);

      // 3. Smart Mock Logic (Learning from History + Image Determinism)
      setTimeout(() => {
        // Get history to find average for this category
        const history = getScans();
        const categorySamples = history.filter(s => s.category === wasteType);

        let estimatedWeight;

        if (categorySamples.length > 0) {
          // 3. STATISTICAL LEARNING (Standard Deviation)
          const weights = categorySamples.map(s => parseFloat(s.weight));
          const total = weights.reduce((sum, w) => sum + w, 0);
          const avg = total / weights.length;

          // Calculate Standard Deviation (σ)
          const squareDiffs = weights.map(w => Math.pow(w - avg, 2));
          const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / weights.length;
          const stdDev = Math.sqrt(avgSquareDiff);

          // 4. IMAGE-BASED DETERMINISM
          // Generate a pseudo-random seed from the image data string
          // This ensures the SAME photo gets the SAME estimate relative to history
          let imageSeed = 0;
          if (typeof image === 'string') {
            const magicStr = image.length.toString() + image.slice(-50);
            for (let i = 0; i < magicStr.length; i++) imageSeed = ((imageSeed << 5) - imageSeed) + magicStr.charCodeAt(i) | 0;
          }
          const seededRandom = (seed) => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); }

          // Box-Muller using Seeded Randomness
          const u1 = seededRandom(imageSeed);
          const u2 = seededRandom(imageSeed + 1);
          const z = Math.sqrt(-2.0 * Math.log(u1 || 0.001)) * Math.cos(2.0 * Math.PI * u2);

          // Est = Average + (Z-score * Standard Deviation)
          let variation = z * stdDev;
          estimatedWeight = (avg + variation);

          // Safety Clamps: Min 0.05kg
          estimatedWeight = Math.max(0.05, estimatedWeight).toFixed(2);

          console.log(`Stats for ${wasteType}: Avg=${avg.toFixed(2)}, SD=${stdDev.toFixed(2)}, Z=${z.toFixed(2)} -> Est=${estimatedWeight}`);
        } else {
          // Fallback: Default Random Logic (1.10 - 1.80 range roughly)
          estimatedWeight = (Math.random() * 0.7 + 1.1).toFixed(2);
        }

        setResult({
          weight: estimatedWeight,
          confidence: Math.floor(Math.random() * 10 + 88), // High confidence "Simulation"
          category: wasteType,
          material: wasteType
        });
      }, 1500);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Ensure we save the CONFIRMED category (which might differ from the initial one)
  const handleUserSave = (actualWeight, confirmedCategory) => {
    if (!image || !result) return;

    const finalRecord = {
      ...result,
      ai_weight: result.weight,
      weight: actualWeight,
      // image: image, // Don't save base64 to avoid LocalStorage quota limits & crashes
      category: confirmedCategory || wasteType // Use confirmed or fallback to initial
    };

    saveScan(finalRecord);
    refreshData();
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) {
      deleteScans(selectedIds);
      refreshData();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recentScans.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recentScans.map(s => s.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteScan(id);
      refreshData();
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Date", "Waste Type", "AI Estimate (kg)", "Actual Weight (kg)", "Accuracy (%)"];
    const csvContent = [
      headers.join(","),
      ...recentScans.map(scan => [
        scan.id,
        new Date(scan.timestamp).toLocaleString(),
        scan.category || 'Mixed Waste',
        scan.ai_weight || 0,
        scan.weight,
        scan.accuracy || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `waste_vision_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  // Analytics Data Preparation (Reverse for Chart)
  // X: Index 1..N
  // Y: Accuracy
  const chartData = [...recentScans].reverse().map((scan, index) => ({
    sample: index + 1,
    accuracy: scan.accuracy || 0,
    id: scan.id
  }));

  return (
    <div className="app-container">
      <DashboardHeader />

      <main className="main-content">
        <StatsRow accuracy={stats.accuracy} totalSamples={stats.totalItems} avgWeight={avgWeight} />

        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>AI Weight Estimation System</h2>
              <p>Φόρτωση φωτογραφίας → Εκτίμηση AI → Διόρθωση → Εκπαίδευση</p>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              <Brain size={18} />
              Training & Prediction
            </button>
            <button
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <Database size={18} />
              Recent Data
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'training' && (
              <div className="training-mode">
                <div className="section-title">
                  <Database size={20} className="text-green-500" />
                  <h3>Training Mode</h3>
                </div>

                <div className="split-view">
                  <div className="left-panel">
                    <h4>1. Select Waste Type & Upload</h4>

                    {!image && (
                      <div className="type-selector">
                        <label>Waste Category:</label>
                        <div className="select-wrapper">
                          <ListFilter size={18} className="select-icon" />
                          <select
                            value={wasteType}
                            onChange={(e) => setWasteType(e.target.value)}
                            className="waste-select"
                          >
                            {WASTE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Upload / Analysis / Result Steps */}
                    {!image && (
                      <div className="uploader-wrapper">
                        <ImageUploader onImageSelected={handleImageSelected} />
                      </div>
                    )}

                    {image && isAnalyzing && (
                      <AnalysisView />
                    )}

                    {image && !isAnalyzing && result && (
                      <ResultCard
                        result={result}
                        image={image}
                        categories={WASTE_CATEGORIES}
                        onSave={handleUserSave}
                        onReset={handleReset}
                      />
                    )}
                  </div>

                  <div className="right-panel">
                    <h4>Recently Processed Queue</h4>
                    <div className="queue-list">
                      {recentScans.length === 0 ? (
                        <div className="empty-queue">
                          <p>Προσθέστε εικόνες για να ξεκινήσετε</p>
                        </div>
                      ) : (
                        recentScans.slice(0, 3).map((scan) => (
                          <div key={scan.id} className="queue-item">
                            <div className="queue-info">
                              <span className="queue-cat">{scan.category || "Mixed Waste"} #{scan.id}</span>
                              <div className="queue-meta">
                                <span className="queue-weight">{scan.weight} kg</span>
                                {scan.accuracy !== undefined && scan.accuracy !== null && (
                                  <span className={`queue-acc ${scan.accuracy > 80 ? 'good' : 'bad'}`}>
                                    (Acc: {scan.accuracy}%)
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="queue-time">{new Date(scan.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="data-view">
                <div className="data-header-actions">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <h3>History Log & Accuracy</h3>
                    {selectedIds.length > 0 && (
                      <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                        <Trash2 size={16} /> Delete ({selectedIds.length})
                      </button>
                    )}
                  </div>
                  <button className="export-btn" onClick={handleExport}>
                    <Download size={16} /> Export CSV
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={recentScans.length > 0 && selectedIds.length === recentScans.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>AI Est.</th>
                        <th>Actual</th>
                        <th>Score</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.map(scan => (
                        <tr key={scan.id} className={selectedIds.includes(scan.id) ? 'selected-row' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(scan.id)}
                              onChange={() => toggleSelectOne(scan.id)}
                            />
                          </td>
                          <td>{new Date(scan.timestamp).toLocaleTimeString()}</td>
                          <td><span className="badge-type">{scan.category || 'Mixed Waste'}</span></td>
                          <td className="text-gray-500">{scan.ai_weight || '?'} kg</td>
                          <td><strong>{scan.weight} kg</strong></td>
                          <td>
                            {scan.accuracy !== undefined && scan.accuracy !== null ? (
                              <span style={{
                                color: scan.accuracy > 90 ? '#10b981' : scan.accuracy > 70 ? '#f59e0b' : '#ef4444',
                                fontWeight: 'bold'
                              }}>
                                {scan.accuracy}%
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            <button className="delete-btn" onClick={() => handleDelete(scan.id)} title="Delete Record">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-view">
                <div className="chart-card-full">
                  <h4>Model Accuracy Progression</h4>
                  <p className="chart-subtitle">Training Score per Sample Input</p>

                  <div className="chart-container-large">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="sample"
                          label={{ value: 'Samples Sequence', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          label={{ value: 'Accuracy Score (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          background: #f8fafc;
        }

        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          min-height: 600px;
        }

        .card-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-color);
        }

        /* Type Selector Styles */
        .type-selector {
            margin-bottom: 1.5rem;
        }
        
        .type-selector label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .select-wrapper {
            position: relative;
        }
        
        .select-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
        }
        
        .waste-select {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            font-size: 1rem;
            background: white;
            color: var(--text-primary);
            cursor: pointer;
            appearance: none; /* Remove default arrow */
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem top 50%;
            background-size: 0.65rem auto;
        }

        .card-header h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin: 0 0 0.25rem;
        }

        .card-header p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.9rem;
        }

        .tabs {
          background: #f8fafc;
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          gap: 2rem;
          overflow-x: auto;
        }

        .tab-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-weight: 600;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--primary-color);
          background: rgba(16, 185, 129, 0.05);
        }

        .tab-btn.active {
          background: white;
          color: var(--primary-dark);
          box-shadow: var(--shadow-sm);
        }

        .tab-content {
          padding: 2rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          color: var(--primary-dark);
        }

        .section-title h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .split-view {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          min-height: 500px;
        }

        @media (max-width: 900px) {
          .split-view {
            grid-template-columns: 1fr;
          }
        }

        .left-panel, .right-panel {
          border: 1px dashed var(--border-color);
          border-radius: 1rem;
          padding: 1.5rem;
          background: #fcfcfc;
        }

        .left-panel h4, .right-panel h4 {
          margin: 0 0 1.5rem;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .uploader-wrapper {
            height: 100%;
        }

        .empty-queue {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        /* Queue List Styles */
        .queue-item {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          margin-bottom: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .queue-info {
          display: flex;
          flex-direction: column;
        }
        
        .queue-cat {
             font-weight: 600;
             font-size: 0.85rem;
             color: var(--text-secondary);
        }

        .queue-meta {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .queue-weight {
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 700;
        }
    
        .queue-acc.good { color: #10b981; font-size: 0.75rem; }
        .queue-acc.bad { color: #ef4444; font-size: 0.75rem; }

        .queue-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        /* Data View Styles */
        .data-header-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap; /* Good for mobile */
            gap: 1rem;
        }
        
        .export-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        .export-btn:hover { opacity: 0.9; }

        .bulk-delete-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #ef4444;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        .bulk-delete-btn:hover { opacity: 0.9; }

        /* Data Table Styles - Responsive Wrapper */
        .table-responsive {
            overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px; /* Ensure table doesn't squish too much */
        }

        .data-table th, .data-table td {
          text-align: left;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .selected-row {
            background-color: #fef2f2; /* Light red highlight */
        }

        .data-table th {
          font-weight: 600;
          color: var(--text-secondary);
          background: #f9fafb;
        }
        .text-gray-500 { color: #64748b; font-size: 0.9rem; }
        
        .delete-btn {
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
        }
        .delete-btn:hover { background: #fee2e2; }

        .badge-type {
            background: #e0f2fe;
            color: #0284c7;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        /* Analytics Chart */
        .chart-card-full {
             background: white;
             padding: 1.5rem;
             border-radius: 1rem;
        }
        
        .chart-container-large {
             margin-top: 1rem;
             height: 400px;
        }
        
        .chart-subtitle {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
}

export default App;
