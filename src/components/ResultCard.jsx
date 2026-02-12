import React, { useState, useEffect } from 'react';
import { Scale, RotateCcw, Save, CheckCircle2, Tag } from 'lucide-react';

const ResultCard = ({ result, onReset, onSave, image, categories }) => {
  const [actualWeight, setActualWeight] = useState(result.weight);
  const [selectedCategory, setSelectedCategory] = useState(result.category || 'Mixed Waste');
  const [isSaved, setIsSaved] = useState(false);
  const [items, setItems] = useState([]);

  // Fallback if categories prop is missing
  const categoryOptions = categories || ['Mixed Waste', 'Plastic', 'Paper', 'Glass', 'Metal', 'Organic'];

  // Initialize items from result
  useEffect(() => {
    if (!result) return;

    const newItems = [];

    // 1. Process High Confidence Objects (Standard)
    if (result.detected_objects) {
      const counts = {};
      result.detected_objects.forEach(obj => {
        counts[obj] = (counts[obj] || 0) + 1;
      });

      Object.keys(counts).forEach(name => {
        newItems.push({
          id: `high-${name}`,
          name: name,
          count: counts[name],
          isLowConf: false,
          checked: true // Default: Checked
        });
      });
    }

    // 2. Process Low Confidence Objects (User Verification Needed)
    if (result.low_conf_objects) {
      const counts = {};
      result.low_conf_objects.forEach(obj => {
        counts[obj] = (counts[obj] || 0) + 1;
      });

      Object.keys(counts).forEach(name => {
        newItems.push({
          id: `low-${name}`,
          name: name,
          count: counts[name],
          isLowConf: true,
          checked: false // Default: Unchecked
        });
      });
    }

    // Sort: High conf first, then by count
    newItems.sort((a, b) => {
      if (a.isLowConf !== b.isLowConf) return a.isLowConf ? 1 : -1;
      return b.count - a.count;
    });

    setItems(newItems);
  }, [result]);

  // Recalculate weight when selection changes
  useEffect(() => {
    if (items.length === 0) return;

    const activeCount = items.reduce((sum, item) => item.checked ? sum + item.count : sum, 0);
    const avg = result.avg_weight_used || 0;
    const newWeight = (activeCount * avg).toFixed(3);

    setActualWeight(newWeight);
  }, [items, result.avg_weight_used]);

  const toggleItem = (name) => {
    setItems(prev => prev.map(item =>
      item.name === name ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleSave = () => {
    try {
      // Fix comma issue if user enters "0,020"
      const sanitizedWeight = actualWeight.toString().replace(',', '.');
      onSave(sanitizedWeight, selectedCategory);
      setIsSaved(true);
    } catch (error) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message}`);
    }
  };

  if (isSaved) {
    return (
      <div className="result-card success-card">
        <div className="success-content">
          <CheckCircle2 size={64} className="text-green-500" />
          <h3>Saved Successfully!</h3>
          <p>Weight: <strong>{actualWeight} kg</strong></p>
          <p>Type: <strong>{selectedCategory}</strong></p>

          <button className="reset-btn" onClick={onReset}>
            <RotateCcw size={18} />
            Scan Next Item
          </button>
        </div>
        <style>{`
                .success-card {
                    background: white;
                    border-radius: 1.5rem;
                    padding: 3rem 1.5rem;
                    text-align: center;
                    box-shadow: var(--shadow-lg);
                    max-width: 400px;
                    width: 100%;
                }
                .success-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                }
                .success-content h3 { margin: 0; color: var(--text-primary); }
                .text-green-500 { color: #10b981; }
                
                .reset-btn {
                  width: 100%;
                  background: var(--primary-color);
                  color: white;
                  border: none;
                  padding: 1rem;
                  border-radius: 0.75rem;
                  font-weight: 600;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.5rem;
                  margin-top: 1rem;
                }
             `}</style>
      </div>
    );
  }

  return (
    <div className="result-card">
      <div className="image-preview">
        <img src={image} alt="Analyzed waste" />
        <div className="overlay-badge">
          AI Estimate
        </div>
      </div>

      <div className="result-content">
        <div className="ai-estimate">
          <span className="label">AI Estimated Weight</span>
          <div className="value">
            <Scale size={20} className="text-secondary" />
            <span>{result.weight} kg</span>
          </div>
        </div>

        <div className="calculation-details">
          <h4>Detected Objects (Select to Count)</h4>
          <div className="items-list">
            {items.map(item => (
              <div
                key={item.id}
                className={`item-row ${item.checked ? 'checked' : 'unchecked'} ${item.isLowConf ? 'low-conf-row' : ''}`}
                onClick={() => toggleItem(item.name)}
              >
                <div className="checkbox-wrapper">
                  <div className={`custom-checkbox ${item.checked ? 'checked' : ''}`}>
                    {item.checked && <span className="check-mark">✓</span>}
                  </div>
                </div>
                <div className="item-info">
                  <span className="item-name">
                    {item.count} {item.name}{item.count > 1 ? 's' : ''}
                    {item.isLowConf && <span className="low-conf-badge">Low Confidence</span>}
                  </span>
                  {!item.isWaste && !item.isLowConf && <span className="ignored-badge">Ignored</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="formula-row">
            <span>Estimate:</span>
            <strong>{items.filter(i => i.checked).reduce((s, i) => s + i.count, 0)} items × {result.avg_weight_used} kg</strong>
          </div>

          <p className="correction-hint">
            Confirming will save this weight as the correct value.
          </p>
        </div>

        <div className="manual-input-section">
          <div className="input-group">
            <label>Actual Weight (kg)</label>
            <div className="input-row">
              <input
                type="number"
                step="0.01"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                className="weight-input"
              />
              <span className="unit">kg</span>
            </div>
          </div>

          <div className="input-group">
            <label>Waste Type</label>
            <div className="input-row">
              <div className="select-container">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Tag size={16} className="select-icon" />
              </div>
            </div>
          </div>

          <p className="hint">Verify weight and type before saving.</p>
        </div>

        <div className="actions">
          <button className="save-btn" onClick={handleSave}>
            <Save size={18} />
            Confirm
          </button>
          <button className="reset-link" onClick={onReset}>
            Discard & Try Again
          </button>
        </div>
      </div>

      <style>{`
        .result-card {
          background: white;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          max-width: 400px;
          width: 100%;
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .image-preview {
          position: relative;
          height: 200px;
          background: #f1f5f9;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(59, 130, 246, 0.9);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .result-content {
          padding: 2rem;
        }
        
        .ai-estimate {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 0.75rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ai-estimate .label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .ai-estimate .value {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 700;
            color: var(--text-primary);
            font-size: 1.1rem;
        }

        /* NEW CALCULATION DETAILS STYLES */
        .calculation-details {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 1rem;
            border-radius: 0.75rem;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        
        .calculation-details h4 {
            margin: 0 0 0.5rem 0;
            font-size: 0.95rem;
            color: #166534;
        }
        
        .items-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
            max-height: 150px;
            overflow-y: auto;
        }
        
        .item-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem;
            background: white;
            border: 1px solid #bbf7d0;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .item-row:hover {
            background: #f0fdf4;
            border-color: #86efac;
        }
        
        .item-row.unchecked {
            background: #f9fafb;
            border-color: #e5e7eb;
            color: #9ca3af;
        }
        
        .custom-checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #cbd5e1;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            transition: all 0.2s;
        }
        
        .custom-checkbox.checked {
            background: #10b981;
            border-color: #10b981;
            color: white;
        }
        
        .check-mark {
            font-size: 14px;
            font-weight: bold;
        }
        
        .item-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
        }
        
        .ignored-badge {
            font-size: 0.7rem;
            background: #e2e8f0;
            color: #64748b;
            padding: 0.1rem 0.4rem;
            border-radius: 999px;
            margin-left: 0.5rem;
        }

        .low-conf-badge {
            font-size: 0.65rem;
            background: #fff7ed;
            color: #c2410c;
            border: 1px solid #fed7aa;
            padding: 0.1rem 0.4rem;
            border-radius: 999px;
            margin-left: 0.5rem;
            text-transform: uppercase;
            font-weight: 700;
        }

        .item-row.low-conf-row {
            border-style: dashed;
            background: #fffaf0;
        }
        
        .item-row.low-conf-row:hover {
            background: #fff7ed;
            border-color: #fdba74;
        }
        
        .formula-row {
            display: flex;
            justify-content: space-between;
            background: rgba(255,255,255,0.6);
            padding: 0.5rem;
            border-radius: 0.5rem;
            margin-top: 0.5rem;
            color: #166534;
        }

        .correction-hint {
            margin-top: 0.75rem;
            font-size: 0.8rem;
            color: #15803d;
            font-style: italic;
            border-top: 1px dashed #86efac;
            padding-top: 0.5rem;
        }

        .manual-input-section {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .input-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.9rem;
        }
        
        .input-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .weight-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid var(--border-color);
            border-radius: 0.75rem;
            font-size: 1.25rem;
            font-weight: 600;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .weight-input:focus {
            border-color: var(--primary-color);
        }
        
        .select-container {
            position: relative;
            width: 100%;
        }
        
        .category-select {
            width: 100%;
            padding: 0.75rem 0.75rem 0.75rem 2.5rem;
            border: 2px solid var(--border-color);
            border-radius: 0.75rem;
            font-size: 1rem;
            font-weight: 500;
            outline: none;
            background: white;
            cursor: pointer;
            appearance: none;
        }
        
        .category-select:focus {
             border-color: var(--primary-color);
        }
        
        .select-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
        }
        
        .unit {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-secondary);
        }
        
        .hint {
            margin: 0;
            font-size: 0.8rem;
            color: var(--text-secondary);
            text-align: center;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .save-btn {
          width: 100%;
          background: var(--text-primary);
          color: white;
          border: none;
          padding: 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.2s;
        }

        .save-btn:hover {
          background: #0f172a;
        }
        
        .reset-link {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 0.9rem;
        }
        .reset-link:hover {
            color: var(--text-primary);
            text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default ResultCard;
