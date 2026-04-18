import React, { useMemo } from 'react';

const RiskDonut = ({ modules, summary }) => {
  // We moved the math out of App.jsx into here!
  // Now only the Donut chart re-calculates this, not the whole app.
  const donutData = useMemo(() => {
    if (!modules || !modules.length) return null;
    
    const displayTotal = summary?.module_count || modules.length || 1;
    const hDisp = summary?.high_risk_modules || modules.filter(m => m.risk >= 0.7).length;
    const mDisp = modules.filter(m => m.risk >= 0.4 && m.risk < 0.7).length;
    const lDisp = modules.filter(m => m.risk < 0.4).length;

    const circum = 2 * Math.PI * 36; // ~226
    const hDash = (hDisp / displayTotal) * circum;
    const mDash = (mDisp / displayTotal) * circum;
    const lDash = (lDisp / displayTotal) * circum;

    return {
      total: displayTotal,
      hVal: hDisp, hPct: Math.round((hDisp/displayTotal)*100) || 0, hDash,
      mVal: mDisp, mPct: Math.round((mDisp/displayTotal)*100) || 0, mDash, mOff: -hDash,
      lVal: lDisp, lPct: Math.round((lDisp/displayTotal)*100) || 0, lDash, lOff: -(hDash + mDash)
    };
  }, [modules, summary]);

  if (!donutData) return null;

  return (
    <div className="donut-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" fill="none" stroke="var(--color-background-tertiary)" strokeWidth="12"/>
        
        {donutData.hVal > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#E24B4A" strokeWidth="12"
          strokeDasharray={`${donutData.hDash} 226`} strokeDashoffset="0" transform="rotate(-90 50 50)"/>}
          
        {donutData.mVal > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#EF9F27" strokeWidth="12"
          strokeDasharray={`${donutData.mDash} 226`} strokeDashoffset={donutData.mOff} transform="rotate(-90 50 50)"/>}
          
        {donutData.lVal > 0 && <circle cx="50" cy="50" r="36" fill="none" stroke="#639922" strokeWidth="12"
          strokeDasharray={`${donutData.lDash} 226`} strokeDashoffset={donutData.lOff} transform="rotate(-90 50 50)"/>}
          
        <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="500" fill="var(--color-text-primary)">{donutData.total}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)">total</text>
      </svg>
      
      <div className="donut-legend">
        <div className="legend-item"><div className="legend-swatch" style={{background:"#E24B4A"}}></div>High — {donutData.hVal} ({donutData.hPct}%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{background:"#EF9F27"}}></div>Medium — {donutData.mVal} ({donutData.mPct}%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{background:"#639922"}}></div>Low — {donutData.lVal} ({donutData.lPct}%)</div>
      </div>
    </div>
  );
};

export default RiskDonut;