import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const MoodLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Mood Over Time</h3>
          <p>Track your daily mood scores</p>
        </div>
        <div className="no-data">
          <p>No mood data available for the selected period</p>
        </div>
      </div>
    );
  }

  const getMoodColor = (mood) => {
    const colors = {
      1: '#ef4444', // Red for very low mood
      2: '#f97316', // Orange for low mood
      3: '#eab308', // Yellow for neutral mood
      4: '#22c55e', // Green for good mood
      5: '#3b82f6'  // Blue for excellent mood
    };
    return colors[mood] || '#6b7280';
  };

  const getMoodLabel = (mood) => {
    const labels = {
      1: 'Very Low',
      2: 'Low', 
      3: 'Neutral',
      4: 'Good',
      5: 'Excellent'
    };
    return labels[mood] || 'Unknown';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const mood = payload[0].value;
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
          <p style={{ margin: '0', color: getMoodColor(mood) }}>
            Mood: {mood} - {getMoodLabel(mood)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Mood Over Time</h3>
        <p>Track your daily mood scores over the last 7 days</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => getMoodLabel(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="mood" 
              stroke="#667eea" 
              strokeWidth={3}
              fill="url(#moodGradient)"
              dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodLineChart; 