import React from 'react';
import { CircleDot } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <header className="dashboard-header">
      <div className="logo-section">
        <div className="logo-container">
          <h1 className="logo-text">
            <span className="text-cyan">Waste</span>
            <span className="text-blue relative-container">
              V
              <span className="i-with-icon">
                i
                <div className="floating-icon">
                  <div className="icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" className="custom-moon-icon">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" />
                    </svg>
                  </div>
                </div>
              </span>
              sion
            </span>
            <span className="text-blue space-left">AI</span>
          </h1>
        </div>
      </div>

      <div className="header-right">
        <span className="user-badge">Admin Workspace</span>
      </div>

      <style>{`
        .dashboard-header {
          background: white;
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 80px;
        }

        .logo-section {
          display: flex;
          align-items: center;
        }

        .logo-container {
            display: flex;
            align-items: center;
        }

        .logo-text {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.04em;
            margin: 0;
            line-height: 1;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: baseline;
        }

        .text-cyan {
            color: #22d3ee;
            background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .text-blue {
            color: #1e3a8a; /* Dark Blue */
        }
        
        .space-left {
            margin-left: 0.3em;
        }
        
        .relative-container {
            position: relative;
        }
        
        .i-with-icon {
            position: relative;
            display: inline-block;
        }
        
        /* The main logo icon replacing the dot */
        .floating-icon {
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
        }
        
        .icon-circle {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .custom-moon-icon {
            width: 14px;
            height: 14px;
        }

      `}</style>
    </header>
  );
};

export default DashboardHeader;
