import React, { useState, useEffect } from 'react';

// The steps we know the backend is taking
const steps = [
  "Initializing scan...",
  "Cloning repository data...",
  "Parsing Python Abstract Syntax Trees (AST)...",
  "Mapping module dependencies...",
  "Running ML heuristic risk scoring...",
  "Generating LangGraph AI recommendations...",
  "Finalizing structural report..."
];

const ProgressSteps = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Advance the step every 2.5 seconds to make the UI feel alive
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        // Stop advancing if we reach the last step
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 2500);
    
    // Cleanup the timer when the component unmounts (scan finishes)
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="empty-content" style={{ maxWidth: '450px', margin: '0 auto', textAlign: 'left', padding: '20px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--color-text-primary)' }}>
        Analyzing Repository
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          
          return (
            <div key={index} style={{ 
              display: 'flex', alignItems: 'center', gap: '16px',
              opacity: isActive || isDone ? 1 : 0.4,
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              transform: isActive ? 'scale(1.02)' : 'scale(1)'
            }}>
              {/* Status Circle */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                background: isDone ? '#639922' : isActive ? '#60a5fa' : 'var(--color-background-tertiary)',
                color: isDone || isActive ? '#fff' : 'var(--color-text-tertiary)',
                fontSize: '12px', fontWeight: 'bold',
                boxShadow: isActive ? '0 0 10px rgba(96, 165, 250, 0.4)' : 'none'
              }}>
                {isDone ? '✓' : index + 1}
              </div>
              
              {/* Step Text */}
              <span style={{ 
                fontSize: '15px', 
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? '500' : '400'
              }}>
                {step}
              </span>
              
              {/* Mini Loading Spinner for the active step */}
              {isActive && (
                <span className="loader" style={{ 
                  width: '14px', height: '14px', marginLeft: 'auto', borderWidth: '2px', borderColor: 'var(--color-text-tertiary) transparent' 
                }}></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;