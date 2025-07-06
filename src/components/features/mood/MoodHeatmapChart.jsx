import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

const MoodHeatmapChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>Mood Heatmap</h3>
          <p>Mood intensity patterns over time and hours</p>
        </div>
        <div className="no-data">
          <p>No mood data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Generate heatmap data from mood entries
  const generateHeatmapData = () => {
    const heatmapData = [];
    
    data.forEach(entry => {
      const date = new Date(entry.date);
      // Convert UTC to local time for hour
      let hour = 12;
      if (entry.created_at) {
        const dt = new Date(entry.created_at);
        hour = dt.getHours(); // Local time hour
      }
      const dayOfWeek = date.getDay();
      
      heatmapData.push({
        x: dayOfWeek,
        y: hour,
        z: entry.mood,
        date: entry.date,
        mood: entry.mood,
        activities: entry.activities || [],
        emotions: entry.emotions || []
      });
    });
    
    return heatmapData;
  };

  const heatmapData = generateHeatmapData();

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeLabel = `${data.y}:00`;
      
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#374151' }}>
            {dayNames[data.x]} at {timeLabel}
          </p>
          <p style={{ margin: '0 0 2px 0', color: getMoodColor(data.mood) }}>
            Mood: {data.mood}/5
          </p>
          <p style={{ margin: '0 0 2px 0', color: '#6b7280', fontSize: '12px' }}>
            Date: {new Date(data.date).toLocaleDateString()}
          </p>
          {data.activities.length > 0 && (
            <p style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
              Activities: {data.activities.join(', ')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Mood Heatmap</h3>
        <p>Mood intensity patterns over time and hours</p>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Day of Week"
              domain={[0, 6]}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(value) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Hour"
              domain={[0, 23]}
              ticks={[0, 6, 12, 18, 23]}
              tickFormatter={(value) => `${value}:00`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <ZAxis type="number" dataKey="z" range={[60, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={heatmapData} fill="#667eea">
              {heatmapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoodHeatmapChart; 