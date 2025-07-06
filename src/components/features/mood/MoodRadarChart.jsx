import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

const MoodRadarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Mood Radar</h3>
          <p>Mood dimensions and emotional patterns</p>
        </div>
        <div className="no-data">
          <p>No mood data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Generate radar data from mood entries
  const generateRadarData = () => {
    // Analyze different aspects of mood
    const aspects = {
      'Average Mood': 0,
      'Mood Stability': 0,
      'Positive Days': 0,
      'High Energy': 0,
      'Social Activity': 0,
      'Productivity': 0
    };

    if (data.length === 0) return [];

    // Calculate average mood
    aspects['Average Mood'] = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;

    // Calculate mood stability (inverse of variance)
    const avgMood = aspects['Average Mood'];
    const variance = data.reduce((sum, entry) => sum + Math.pow(entry.mood - avgMood, 2), 0) / data.length;
    aspects['Mood Stability'] = Math.max(0, 5 - Math.sqrt(variance));

    // Calculate positive days percentage
    const positiveDays = data.filter(entry => entry.mood >= 4).length;
    aspects['Positive Days'] = (positiveDays / data.length) * 5;

    // Calculate high energy days (placeholder - would need energy data)
    aspects['High Energy'] = aspects['Average Mood'] * 0.8; // Placeholder calculation

    // Calculate social activity based on activities
    const socialActivities = data.filter(entry => 
      entry.activities && entry.activities.some(activity => 
        ['friends', 'family', 'social', 'party', 'meeting'].includes(activity.toLowerCase())
      )
    ).length;
    aspects['Social Activity'] = (socialActivities / data.length) * 5;

    // Calculate productivity based on work-related activities
    const productiveActivities = data.filter(entry => 
      entry.activities && entry.activities.some(activity => 
        ['work', 'study', 'exercise', 'reading', 'project'].includes(activity.toLowerCase())
      )
    ).length;
    aspects['Productivity'] = (productiveActivities / data.length) * 5;

    // Convert to radar format
    return Object.entries(aspects).map(([subject, value]) => ({
      subject,
      value: Math.min(5, Math.max(0, value)), // Clamp between 0-5
      fullMark: 5
    }));
  };

  const radarData = generateRadarData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
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
            Score: {data.value.toFixed(1)}/5
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Mood Radar</h3>
        <p>Mood dimensions and emotional patterns</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 5]} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar 
              name="Mood Profile" 
              dataKey="value" 
              stroke="#667eea" 
              fill="#667eea" 
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodRadarChart; 