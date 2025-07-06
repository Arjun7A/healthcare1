import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MoodSpikeDetectionChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Mood Spike Detection</h3>
          <p>Detect significant mood changes over time</p>
        </div>
        <div className="no-data">
          <p>No mood spike data available for the selected period</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const spike = payload[0].payload;
      const change = spike.to - spike.from;
      const isPositive = change > 0;
      
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#374151' }}>
            {new Date(label).toLocaleDateString()}
          </p>
          <p style={{ margin: '0 0 2px 0', color: isPositive ? '#10b981' : '#ef4444' }}>
            Mood Change: {spike.from} → {spike.to} ({isPositive ? '+' : ''}{change})
          </p>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
            {isPositive ? 'Positive spike detected' : 'Negative spike detected'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Mood Spike Detection</h3>
        <p>Detect significant mood changes over time</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={3} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="to" 
              stroke="#667eea" 
              strokeWidth={3}
              dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodSpikeDetectionChart; 