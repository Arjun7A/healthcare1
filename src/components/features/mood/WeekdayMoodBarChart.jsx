import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeekdayMoodBarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Weekday Mood Average</h3>
          <p>Average mood scores by day of the week</p>
        </div>
        <div className="no-data">
          <p>No weekday data available for the selected period</p>
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
            {label}
          </p>
          <p style={{ margin: '0', color: '#667eea' }}>
            Average Mood: {payload[0].value}/5
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Weekday Mood Average</h3>
        <p>Average mood scores by day of the week</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="weekday" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="avgMood" 
              fill="url(#weekdayGradient)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeekdayMoodBarChart; 