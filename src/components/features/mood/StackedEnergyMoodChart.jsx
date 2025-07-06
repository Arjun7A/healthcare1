import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StackedEnergyMoodChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Energy vs Mood</h3>
          <p>Correlation between energy levels and mood scores</p>
        </div>
        <div className="no-data">
          <p>No energy data available for the selected period</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '0 0 2px 0', color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Energy vs Mood</h3>
        <p>Correlation between energy levels and mood scores</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#d97706" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#5b21b6" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="energy" stackId="a" fill="url(#energyGradient)" name="Energy Level" />
            <Bar dataKey="mood" stackId="a" fill="url(#moodGradient)" name="Mood Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StackedEnergyMoodChart; 