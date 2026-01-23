import React, { useState, useMemo } from 'react';
import { Download, Trash2, Edit2, Filter, ArrowUpDown, CheckSquare, Square, Calendar } from 'lucide-react';

const TrainingDataset = ({ scans, onDelete, onExport }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sortOrder, setSortOrder] = useState('date_desc'); // date_desc, date_asc, weight_desc, weight_asc
    const [minWeight, setMinWeight] = useState('');
    const [maxWeight, setMaxWeight] = useState('');

    // 1. Filter
    const filteredData = useMemo(() => {
        return scans.filter(scan => {
            const w = parseFloat(scan.weight);
            if (minWeight && w < parseFloat(minWeight)) return false;
            if (maxWeight && w > parseFloat(maxWeight)) return false;
            return true;
        });
    }, [scans, minWeight, maxWeight]);

    // 2. Sort
    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            if (sortOrder === 'date_desc') return new Date(b.timestamp) - new Date(a.timestamp);
            if (sortOrder === 'date_asc') return new Date(a.timestamp) - new Date(b.timestamp);
            if (sortOrder === 'weight_desc') return parseFloat(b.weight) - parseFloat(a.weight);
            if (sortOrder === 'weight_asc') return parseFloat(a.weight) - parseFloat(b.weight);
            return 0;
        });
    }, [filteredData, sortOrder]);

    // 3. Stats (Dynamic based on filtered view)
    const stats = useMemo(() => {
        if (filteredData.length === 0) return { avg: 0, min: 0, max: 0 };
        let total = 0;
        let min = parseFloat(filteredData[0].weight);
        let max = 0;

        filteredData.forEach(s => {
            const w = parseFloat(s.weight);
            total += w;
            if (w < min) min = w;
            if (w > max) max = w;
        });

        return {
            avg: (total / filteredData.length).toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2)
        };
    }, [filteredData]);

    // Selection Logic
    const handleSelectAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(s => s.id)));
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleExportSelection = () => {
        // If selection exists, export only selection. Else export all visible.
        const idsToExport = selectedIds.size > 0 ? Array.from(selectedIds) : filteredData.map(s => s.id);
        onExport(idsToExport);
    };

    return (
        <div className="dataset-container">

            {/* Header & Actions */}
            <div className="dataset-header-row">
                <div>
                    <h3 className="section-title">Training Dataset</h3>
                    <p className="section-subtitle">Όλα τα δεδομένα που χρησιμοποιούνται για εκπαίδευση</p>
                </div>

                <div className="header-actions">
                    <button className="icon-btn text-btn" onClick={handleSelectAll}>
                        {selectedIds.size > 0 && selectedIds.size === filteredData.length ?
                            <CheckSquare size={18} /> : <Square size={18} />
                        }
                        Επιλογή όλων
                    </button>
                    <button className="primary-btn small" onClick={handleExportSelection}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="sort-dropdown-wrapper">
                    <ArrowUpDown size={16} className="sort-icon" />
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="sort-select"
                    >
                        <option value="date_desc">Ημ/νία (Νεότερα)</option>
                        <option value="date_asc">Ημ/νία (Παλαιότερα)</option>
                        <option value="weight_desc">Βάρος (Μεγαλύτερα)</option>
                        <option value="weight_asc">Βάρος (Μικρότερα)</option>
                    </select>
                </div>

                <div className="weight-filter-group">
                    <Filter size={16} className="filter-icon" />
                    <input
                        type="number"
                        placeholder="Min kg"
                        value={minWeight}
                        onChange={(e) => setMinWeight(e.target.value)}
                        className="filter-input"
                    />
                    <span className="separator">-</span>
                    <input
                        type="number"
                        placeholder="Max kg"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(e.target.value)}
                        className="filter-input"
                    />
                </div>
            </div>

            {/* List */}
            <div className="scans-list">
                {sortedData.length === 0 ? (
                    <div className="empty-state">Δεν βρέθηκαν δεδομένα με αυτά τα κριτήρια.</div>
                ) : (
                    sortedData.map(scan => (
                        <div key={scan.id} className={`scan-card ${selectedIds.has(scan.id) ? 'selected' : ''}`}>
                            <div className="checkbox-area" onClick={() => toggleSelection(scan.id)}>
                                {selectedIds.has(scan.id) ?
                                    <div className="custom-checkbox checked"><CheckSquare size={20} color="#10b981" /></div> :
                                    <div className="custom-checkbox"><Square size={20} color="#cbd5e1" /></div>
                                }
                            </div>

                            <div className="scan-image">
                                {/* Use dummy placeholder if no image, or real image */}
                                {scan.image ? <img src={scan.image} alt="scan" /> : <div className="no-img">No Img</div>}
                            </div>

                            <div className="scan-details">
                                <div className="scan-primary">
                                    <span className="scan-weight">{parseFloat(scan.weight).toFixed(2)} kg</span>
                                    <span className="badge">Sample</span>
                                </div>
                                <div className="scan-meta">
                                    <Calendar size={14} />
                                    {new Date(scan.timestamp).toLocaleString('el-GR')}
                                </div>
                            </div>

                            <div className="scan-actions">
                                <button className="action-btn edit" title="Edit"><Edit2 size={18} /></button>
                                <button className="action-btn delete" title="Delete" onClick={() => onDelete(scan.id)}><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Stats */}
            <div className="stats-footer">
                <h4>Dataset Statistics</h4>
                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-label">Μέσος Όρος Βάρους</span>
                        <span className="stat-value">{stats.avg} kg</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Min Βάρος</span>
                        <span className="stat-value">{stats.min} kg</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Max Βάρος</span>
                        <span className="stat-value">{stats.max} kg</span>
                    </div>
                </div>
            </div>

            <style>{`
        .dataset-container {
            background: transparent;
        }

        .dataset-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.25rem;
            color: var(--text-primary);
            margin: 0 0 0.5rem;
        }

        .section-subtitle {
            color: var(--text-secondary);
            margin: 0;
            font-size: 0.9rem;
        }

        .header-actions {
            display: flex;
            gap: 1rem;
        }

        .icon-btn {
            background: none;
            border: 1px solid var(--border-color);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .primary-btn {
            background: var(--text-primary); /* Blackish */
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-weight: 600;
        }

        /* Filter Bar */
        .filters-bar {
            background: white;
            padding: 1rem;
            border-radius: 1rem;
            border: 1px solid var(--border-color);
            display: flex;
            gap: 1.5rem;
            align-items: center;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .sort-dropdown-wrapper {
            position: relative;
            display: flex;
            align-items: center;
            background: #f8fafc;
            border-radius: 0.5rem;
            padding: 0 0.75rem;
        }
        
        .sort-icon { color: var(--text-secondary); }

        .sort-select {
            background: transparent;
            border: none;
            padding: 0.75rem;
            font-size: 0.9rem;
            color: var(--text-primary);
            outline: none;
            cursor: pointer;
            width: 160px;
        }

        .weight-filter-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8fafc;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
        }
        
        .filter-icon { color: var(--text-secondary); margin-right: 0.5rem; }

        .filter-input {
            background: transparent;
            border: none;
            width: 70px;
            outline: none;
            font-size: 0.9rem;
        }
        
        .separator { color: var(--text-secondary); }

        /* Scans List */
        .scans-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .scan-card {
            background: white;
            padding: 1rem;
            border-radius: 1rem;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 1.5rem;
            transition: all 0.2s;
        }
        
        .scan-card.selected {
            border-color: #10b981;
            background: #f0fdf4;
        }

        .checkbox-area {
            cursor: pointer;
            display: flex;
            align-items: center;
        }

        .scan-image {
            width: 80px;
            height: 80px;
            border-radius: 0.5rem;
            overflow: hidden;
            background: #f1f5f9;
            flex-shrink: 0;
        }
        
        .scan-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .scan-details {
            flex: 1;
        }

        .scan-primary {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }
        
        .scan-weight {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .badge {
            background: #f1f5f9;
            color: var(--text-secondary);
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-weight: 600;
        }

        .scan-meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.85rem;
        }

        .scan-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .action-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            color: var(--text-secondary);
            transition: background 0.2s;
        }
        
        .action-btn:hover { background: #f1f5f9; color: var(--text-primary); }
        .action-btn.delete:hover { background: #fee2e2; color: #ef4444; }

        /* Stats Footer */
        .stats-footer {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            border: 1px solid var(--border-color);
        }
        
        .stats-footer h4 {
            margin: 0 0 1.5rem;
            font-size: 1.1rem;
            color: var(--text-primary);
        }
        
        .stats-row {
            display: flex;
            gap: 4rem;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        @media (max-width: 600px) {
            .stats-row {
                flex-direction: column;
                gap: 1.5rem;
            }
        }
        
        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
        }
      `}</style>
        </div>
    );
};

export default TrainingDataset;
