import React, { useState, useMemo, useEffect } from 'react';

function riskLevel(r) {
  if (r >= 0.7) return "high";
  if (r >= 0.4) return "mid";
  return "low";
}

const ModuleTable = ({ modules, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'risk', direction: 'desc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [modules]);

  const sortedModules = useMemo(() => {
    let sortableItems = [...modules];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // 🔥 Updated for new ML features
        if (
          ['lines_of_code', 'test_coverage', 'security_vulnerabilities']
          .includes(sortConfig.key)
        ) {
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

  const displayedModules = useMemo(() => {
    if (rowsPerPage === 'All') return sortedModules;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedModules.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedModules, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === 'All'
    ? 1
    : Math.ceil(sortedModules.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) {
      return <span style={{ opacity: 0.3, paddingLeft: '4px' }}>↕</span>;
    }
    return sortConfig.direction === 'asc'
      ? <span style={{ paddingLeft: '4px' }}>↑</span>
      : <span style={{ paddingLeft: '4px' }}>↓</span>;
  };

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table className="mod-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('module')}>Module {getSortIcon('module')}</th>
              <th onClick={() => requestSort('risk')}>Risk {getSortIcon('risk')}</th>

              {/* ✅ UPDATED COLUMNS */}
              <th onClick={() => requestSort('lines_of_code')} style={{ textAlign: "right" }}>
                LOC {getSortIcon('lines_of_code')}
              </th>

              <th onClick={() => requestSort('test_coverage')} style={{ textAlign: "right" }}>
                Coverage {getSortIcon('test_coverage')}
              </th>

              <th onClick={() => requestSort('security_vulnerabilities')} style={{ textAlign: "right" }}>
                Vuln {getSortIcon('security_vulnerabilities')}
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedModules.map((m) => {
              const pct = Math.round((m.risk || 0) * 100);
              const lvl = riskLevel(m.risk || 0);

              return (
                <tr
                  key={m.module}
                  onClick={() => onRowClick(m)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{m.module}</td>

                  <td>
                    <span className={`risk-chip risk-${lvl}`}>
                      {pct}%
                    </span>
                  </td>

                  {/* ✅ NEW DATA */}
                  <td style={{ textAlign: "right" }}>
                    {m.features?.lines_of_code || 0}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    {Math.round((m.features?.test_coverage || 0) * 100)}%
                  </td>

                  <td
                    style={{
                      textAlign: "right",
                      color:
                        (m.features?.security_vulnerabilities || 0) > 2
                          ? "#E24B4A"
                          : "#639922"
                    }}
                  >
                    {m.features?.security_vulnerabilities || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedModules.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          fontSize: '12px'
        }}>
          <div>
            Page {currentPage} of {totalPages}
          </div>

          <div>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              Prev
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleTable;