import React from 'react';
import { Database, TrendingUp, Scale } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>
    </div>

    <style>{`
      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex: 1;
        min-width: 250px; /* Ensure cards don't get too squashed */
        box-shadow: var(--shadow-sm);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon.green { background: #ecfdf5; color: #10b981; }
      .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
      .stat-icon.emerald { background: #f0fdf4; color: #059669; }

      .stat-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .stat-label {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        white-space: nowrap;
      }

      .stat-value {
        color: var(--text-primary);
        font-size: 1.25rem;
        font-weight: 700;
        white-space: nowrap;
      }
    `}</style>
  </div>
);

const StatsRow = ({ accuracy, totalSamples, avgWeight }) => {
  // Ensure we have fallbacks
  const safeSamples = totalSamples !== undefined ? totalSamples : 0;
  const safeAccuracy = accuracy !== undefined ? accuracy : "N/A";
  const safeAvg = avgWeight !== undefined ? avgWeight : "0.00";

  // Format accuracy
  const accuracyDisplay = safeAccuracy === "N/A" ? "N/A" : `${safeAccuracy}%`;

  return (
    <div className="stats-row">
      <StatCard
        icon={Database}
        label="Training Samples"
        value={`${safeSamples} items`}
        colorClass="green"
      />
      <StatCard
        icon={TrendingUp}
        label="Average Weight"
        value={`${safeAvg} kg`}
        colorClass="blue"
      />
      <StatCard
        icon={Scale}
        label="Model Accuracy"
        value={accuracyDisplay}
        colorClass="emerald"
      />
      <style>{`
        .stats-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
          flex-wrap: wrap; /* Allow wrapping on smaller screens */
        }
        
        @media (max-width: 768px) {
          .stats-row {
            flex-direction: column;
          }
           .stat-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsRow;
