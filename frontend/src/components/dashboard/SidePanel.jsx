import React from 'react';

const SidePanel = ({ isOpen, onClose, moduleData, recommendation, context = 'module' }) => {
  if (!isOpen && !moduleData) return null;

  const pct = moduleData ? Math.round((moduleData.risk || 0) * 100) : 0;
  const isRecMode = context === 'recommendation';

  // 1. The Stats Block
  const renderStats = () => (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Structural Assessment</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px', fontWeight: 'bold', color: pct >= 70 ? '#E24B4A' : pct >= 40 ? '#EF9F27' : '#639922' }}>
          {pct}%
        </span>
        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: 'var(--color-background-tertiary)' }}>
          {pct >= 70 ? 'High Risk' : pct >= 40 ? 'Medium Risk' : 'Low Risk'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px', background: 'var(--color-background-primary)', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>In-Degree</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{moduleData.features?.in_degree || 0}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--color-background-primary)', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Out-Degree</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{moduleData.features?.out_degree || 0}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--color-background-primary)', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Cycles</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{moduleData.features?.cycle_count || 0}</div>
        </div>
      </div>
    </div>
  );

  // 2. The Recommendation & Code Preview Block
  const renderRecommendation = () => (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>AI Analysis & Recommendations</h3>
      {recommendation ? (
        <div style={{ 
          background: isRecMode ? 'rgba(226, 75, 74, 0.08)' : 'rgba(226, 75, 74, 0.03)', 
          border: isRecMode ? '1px solid rgba(226, 75, 74, 0.4)' : '1px solid rgba(226, 75, 74, 0.15)', 
          borderRadius: '8px', 
          boxShadow: isRecMode ? '0 0 20px rgba(226, 75, 74, 0.1)' : 'none',
          overflow: 'hidden'
        }}>
          {/* Explanation Text */}
          <div style={{ padding: '16px', color: 'var(--color-text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
            {recommendation.explanation}
          </div>

          {/* NEW: Code Evidence Previews! */}
          {recommendation.evidence && recommendation.evidence.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(226, 75, 74, 0.15)', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
              <h4 style={{ fontSize: '11px', color: '#fca5a5', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                Code Evidence
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendation.evidence.map((ev, i) => (
                  <div key={i} style={{ background: '#09090b', border: '1px solid var(--color-border-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#18181b', padding: '6px 12px', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                      <span style={{ color: '#60a5fa', marginRight: '8px' }}>Line {ev.line}</span>
                    </div>
                    <pre style={{ margin: 0, padding: '12px', fontSize: '12px', color: '#e4e4e7', overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: '1.5' }}>
                      <code>{ev.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'var(--color-background-primary)', borderRadius: '8px', color: 'var(--color-text-tertiary)', fontSize: '14px', border: '1px solid var(--color-border-tertiary)' }}>
          No critical structural issues detected for this module.
        </div>
      )}
    </div>
  );

  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '100%',
        backgroundColor: 'var(--color-background-secondary)', boxShadow: '-4px 0 25px rgba(0,0,0,0.5)', zIndex: 1000,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border-tertiary)'
      }}>
        {moduleData && (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isRecMode ? 'rgba(226, 75, 74, 0.05)' : 'transparent' }}>
              <div>
                <div style={{ fontSize: '12px', color: isRecMode ? '#E24B4A' : 'var(--color-text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                  {isRecMode ? 'Recommendation Focus' : 'Module Details'}
                </div>
                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{moduleData.module}</h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'var(--color-text-secondary)'}>×</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {isRecMode ? <>{renderRecommendation()}{renderStats()}</> : <>{renderStats()}{renderRecommendation()}</>}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SidePanel;