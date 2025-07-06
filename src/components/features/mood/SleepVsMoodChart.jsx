import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

const SleepVsMoodChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Sleep vs Mood</h3>
          <p>Correlation between sleep hours and mood scores</p>
        </div>
        <div className="no-data">
          <p>No sleep data available for the selected period</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#374151' }}>
            {new Date(data.date).toLocaleDateString()}
          </p>
          <p style={{ margin: '0 0 2px 0', color: '#667eea' }}>
            Sleep: {data.sleep} hours
          </p>
          <p style={{ margin: '0', color: '#10b981' }}>
            Mood: {data.mood}/5
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Sleep vs Mood</h3>
        <p>Correlation between sleep hours and mood scores</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number" 
              dataKey="sleep" 
              name="Sleep Hours"
              domain={[0, 12]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Sleep Hours', position: 'insideBottom', offset: -10, style: { fill: '#6b7280' } }}
            />
            <YAxis 
              type="number" 
              dataKey="mood" 
              name="Mood Score"
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{ value: 'Mood Score', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            />
            <ZAxis type="number" range={[60, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              data={data} 
              fill="#667eea"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SleepVsMoodChart; 