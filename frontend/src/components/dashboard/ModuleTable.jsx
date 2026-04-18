import React, { useState, useMemo, useEffect } from 'react';

function riskLevel(r) {
  if (r >= 0.7) return "high";
  if (r >= 0.4) return "mid";
  return "low";
}

const ModuleTable = ({ modules, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'risk', direction: 'desc' });
  
  // NEW: Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // If the user searches a new project, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [modules]);

  const sortedModules = useMemo(() => {
    let sortableItems = [...modules];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (['in_degree', 'out_degree', 'cycle_count'].includes(sortConfig.key)) {
          aValue = a.features?.[sortConfig.key] || 0;
          bValue = b.features?.[sortConfig.key] || 0;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [modules, sortConfig]);

  // NEW: Calculate the specific rows to show on this page
  const displayedModules = useMemo(() => {
    if (rowsPerPage === 'All') return sortedModules;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedModules.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedModules, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === 'All' ? 1 : Math.ceil(sortedModules.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to page 1 when they sort
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) return <span style={{ opacity: 0.3, paddingLeft: '4px' }}>↕</span>;
    return sortConfig.direction === 'asc' ? <span style={{ paddingLeft: '4px' }}>↑</span> : <span style={{ paddingLeft: '4px' }}>↓</span>;
  };

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="mod-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('module')} style={{ cursor: 'pointer', userSelect: 'none' }}>Module {getSortIcon('module')}</th>
              <th onClick={() => requestSort('risk')} style={{ cursor: 'pointer', userSelect: 'none' }}>Risk {getSortIcon('risk')}</th>
              <th onClick={() => requestSort('in_degree')} style={{ textAlign: "right", cursor: 'pointer', userSelect: 'none' }}>In {getSortIcon('in_degree')}</th>
              <th onClick={() => requestSort('out_degree')} style={{ textAlign: "right", cursor: 'pointer', userSelect: 'none' }}>Out {getSortIcon('out_degree')}</th>
              <th onClick={() => requestSort('cycle_count')} style={{ textAlign: "right", cursor: 'pointer', userSelect: 'none' }}>Cyc {getSortIcon('cycle_count')}</th>
            </tr>
          </thead>
          <tbody>
            {/* UPDATED: Map over 'displayedModules' instead of all modules */}
            {displayedModules.map((m) => {
              const pct = Math.round((m.risk || 0) * 100);
              const lvl = riskLevel(m.risk || 0);
              return (
                <tr key={m.module} onClick={() => onRowClick(m)} style={{ cursor: 'pointer' }} title="Click to view module details">
                  <td><span className="mod-name">{m.module}</span></td>
                  <td><span className={`risk-chip risk-${lvl}`}>{pct}%</span></td>
                  <td style={{textAlign: "right"}} className="stat-num">{m.features?.in_degree || 0}</td>
                  <td style={{textAlign: "right"}} className="stat-num">{m.features?.out_degree || 0}</td>
                  <td style={{textAlign: "right"}} className="stat-num">{m.features?.cycle_count || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NEW: Pagination Footer */}
      {sortedModules.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--color-border-tertiary)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <div>
            Showing {rowsPerPage === 'All' ? sortedModules.length : Math.min(sortedModules.length, (currentPage - 1) * rowsPerPage + 1)} to {rowsPerPage === 'All' ? sortedModules.length : Math.min(sortedModules.length, currentPage * rowsPerPage)} of {sortedModules.length} entries
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              Rows per page: 
              <select 
                value={rowsPerPage} 
                onChange={(e) => { setRowsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
                style={{ marginLeft: '6px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value="All">All</option>
              </select>
            </div>
            
            {rowsPerPage !== 'All' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: currentPage === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: currentPage === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleTable;