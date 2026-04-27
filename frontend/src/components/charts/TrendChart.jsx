import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data }) => {
  // If there's no data or only 1 scan, we show a sleek placeholder
  if (!data || data.length < 2) {
    return (
      <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--color-text-tertiary)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '32px', height: '32px', marginBottom: '8px', opacity: 0.5 }}>
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 9l-5 5-4-4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: '13px' }}>Run one more scan to generate a trendline.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '240px', width: '100%', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="var(--color-text-tertiary)" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="var(--color-text-tertiary)" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(25, 25, 29, 0.9)', 
              borderColor: 'var(--color-border-tertiary)', 
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
            }}
            itemStyle={{ fontSize: '13px', fontWeight: '500' }}
            labelStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}
          />
          
          {/* Total Modules Line (Subtle Blue) */}
          <Line 
            type="monotone" 
            name="Total Modules"
            dataKey="total" 
            stroke="#60a5fa" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#141417', stroke: '#60a5fa', strokeWidth: 2 }} 
            activeDot={{ r: 5, fill: '#60a5fa', stroke: '#fff' }} 
          />
          
          {/* High Risk Line (Neon Red) */}
          <Line 
            type="monotone" 
            name="Critical Risks"
            dataKey="highRisk" 
            stroke="#E24B4A" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#141417', stroke: '#E24B4A', strokeWidth: 2 }} 
            activeDot={{ r: 5, fill: '#E24B4A', stroke: '#fff', boxShadow: '0 0 10px #E24B4A' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;