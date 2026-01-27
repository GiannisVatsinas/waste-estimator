import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Database, Scale, TrendingUp, BrainCircuit, Check, RefreshCw } from 'lucide-react';

const AnalyticsDashboard = ({ stats }) => {
  const { totalItems, averageWeight, minWeight, maxWeight, weightDistribution, trainingProgress } = stats;
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  // New Simulation Function
  const handleRetrain = () => {
    setIsRetraining(true);
    // Simulate 3 seconds of "Learning"
    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => setRetrainSuccess(false), 3000);
    }, 3000);
  };

  return (
    <div className="analytics-dashboard">
      <div className="retrain-section">
        <div className="retrain-info">
          <h4><BrainCircuit size={20} className="text-purple" /> Active Learning System</h4>
          <p>{totalItems} samples available for visual retraining. Update the model to improve accuracy.</p>
        </div>

        <button
          className={`retrain-btn ${isRetraining ? 'loading' : ''} ${retrainSuccess ? 'success' : ''}`}
          onClick={handleRetrain}
          disabled={isRetraining || totalItems === 0}
        >
          {isRetraining ? (
            <>
              <RefreshCw size={18} className="spin" />
              Optimizing Neural Weights...
            </>
          ) : retrainSuccess ? (
            <>
              <Check size={18} />
              Model Updated!
            </>
          ) : (
            <>
              <BrainCircuit size={18} />
              Retrain AI Model
            </>
          )}
        </button>
      </div>

      {/* Top Cards Row */}
      <div className="metrics-grid">

        {/* Card 1: Total */}
        <div className="metric-card">
          <div className="icon-box green">
            <Database size={24} />
          </div>
          <div>
            <p className="label">Σύνολο</p>
            <h3>{totalItems}</h3>
          </div>
        </div>

        {/* Card 2: Average */}
        <div className="metric-card">
          <div className="icon-box blue">
            <Scale size={24} />
          </div>
          <div>
            <p className="label">Μέσος Όρος (kg)</p>
            <h3>{averageWeight}</h3>
          </div>
        </div>

        {/* Card 3: Min / Max */}
        <div className="metric-card">
          <div className="icon-box green-light">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="label">Min / Max (kg)</p>
            <h3>{minWeight} / {maxWeight}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-container">

        {/* Chart 1: Weight Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Κατανομή Βάρους</h4>
            <p>Αριθμός samples ανά κατηγορία βάρους (kg)</p>
          </div>
          <div className="chart-area">
            {totalItems > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weightDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Δεν υπάρχουν δεδομένα</div>
            )}
          </div>
        </div>

        {/* Chart 2: Training Progress */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Training Progress</h4>
            <p>Συσσωρευτικά samples με τον καιρό</p>
          </div>
          <div className="chart-area">
            {totalItems > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trainingProgress}>
                  <defs>
                    <linearGradient id="colorSamples" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="index" hide /> {/* Hide X axis for simple progress line */}
                  <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="samples" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSamples)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Δεν υπάρχουν δεδομένα</div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .analytics-dashboard {
          animation: fadeIn 0.5s ease-out;
        }
        
        /* Retrain Section */
        .retrain-section {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            border-radius: 1rem;
            padding: 1.5rem 2rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #f9a8d4;
        }
        
        .retrain-info h4 {
            margin: 0 0 0.25rem;
            color: #831843;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .retrain-info p {
            margin: 0;
            color: #9d174d;
            font-size: 0.9rem;
        }
        
        .retrain-btn {
            background: #be185d;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
            min-width: 180px;
            justify-content: center;
        }
        
        .retrain-btn:hover:not(:disabled) {
            background: #9d174d;
            transform: translateY(-1px);
        }
        
        .retrain-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .retrain-btn.success {
            background: #059669;
        }
        
        .spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 800px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            .retrain-section {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
        }
        .text-purple { color: #be185d; }

        .metric-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm);
        }

        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.green { background: #ecfdf5; color: #10b981; }
        .icon-box.blue { background: #eff6ff; color: #3b82f6; }
        .icon-box.green-light { background: #f0fdf4; color: #059669; }

        .label {
          color: var(--text-secondary);
          margin: 0 0 0.25rem;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .metric-card h3 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .charts-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 900px) {
          .charts-container {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          border: 1px solid var(--border-color);
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        
        .chart-header {
            margin-bottom: 2rem;
        }

        .chart-card h4 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
          font-size: 1.1rem;
        }
        
        .chart-card p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .chart-area {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .empty-state {
            color: #94a3b8;
            font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AnalyticsDashboard;
