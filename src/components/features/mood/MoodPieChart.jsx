import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MoodPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Mood Breakdown</h3>
          <p>Distribution of mood categories</p>
        </div>
        <div className="no-data">
          <p>No mood data available for the selected period</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
  const MOOD_LABELS = ['Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / data.payload.total) * 100).toFixed(1);
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#374151' }}>
            {data.name}
          </p>
          <p style={{ margin: '0 0 4px 0', color: data.color }}>
            Count: {data.value}
          </p>
          <p style={{ margin: '0', color: '#6b7280' }}>
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => (
    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: entry.color, 
              borderRadius: '50%' 
            }} 
          />
          <span style={{ fontSize: '14px', color: '#374151' }}>
            {entry.value} ({entry.payload.value})
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Mood Breakdown</h3>
        <p>Distribution of mood categories over time</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodPieChart; 