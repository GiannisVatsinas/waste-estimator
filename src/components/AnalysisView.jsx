import React from 'react';
import { Loader2 } from 'lucide-react';

const AnalysisView = () => {
    return (
        <div className="analysis-view">
            <div className="scanner">
                <Loader2 className="spinner" size={64} />
            </div>
            <h2>Analyzing Content...</h2>
            <p>Identifying waste type and estimating volume</p>

            <style>{`
        .analysis-view {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 1.5rem;
          box-shadow: var(--shadow-lg);
          max-width: 400px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .scanner {
          color: var(--primary-color);
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .spinner {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        h2 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }

        p {
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
        </div>
    );
};

export default AnalysisView;
