import React from 'react';
import ProgressSteps from './ProgressSteps';

// A tiny helper to draw a grey pulsing box
const SkeletonBox = ({ height, width = '100%', borderRadius = '8px', marginBottom = '0' }) => (
  <div style={{
    height, width, borderRadius, marginBottom,
    background: 'var(--color-border-tertiary)',
    animation: 'pulse-skeleton 1.5s ease-in-out infinite'
  }} />
);

const SkeletonDashboard = () => {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* THE OVERLAY WITH YOUR PROGRESS STEPS */}
      <div style={{
        position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
        background: 'rgba(9, 9, 11, 0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--border-radius-lg)'
      }}>
        <div style={{ background: 'var(--color-background-secondary)', padding: '30px 40px', borderRadius: '16px', border: '1px solid var(--color-border-tertiary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <ProgressSteps />
        </div>
      </div>

      {/* THE GHOST DASHBOARD */}
      <div className="metrics" style={{ filter: 'brightness(0.7)', margin: 0 }}>
        {[1, 2, 3, 4].map(i => (
          <div className="metric-card" key={i}>
            <SkeletonBox height="12px" width="40%" marginBottom="16px" />
            <SkeletonBox height="28px" width="60%" marginBottom="8px" />
            <SkeletonBox height="10px" width="30%" />
          </div>
        ))}
      </div>

      <div className="main-grid" style={{ filter: 'brightness(0.7)', margin: 0 }}>
         <div className="panel" style={{ height: '260px' }}><SkeletonBox height="100%" /></div>
         <div className="panel" style={{ height: '260px' }}><SkeletonBox height="100%" /></div>
      </div>

      <div className="panel" style={{ height: '300px', filter: 'brightness(0.7)' }}>
        <SkeletonBox height="100%" />
      </div>
    </div>
  );
};

export default SkeletonDashboard;