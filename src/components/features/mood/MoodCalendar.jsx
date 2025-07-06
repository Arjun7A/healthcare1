import React, { useState, useMemo } from 'react';

const MoodCalendar = ({ entries, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calculate monthEntries and summary stats at the top
  const monthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate.getFullYear() === currentDate.getFullYear() &&
           entryDate.getMonth() === currentDate.getMonth();
  });

  let averageMood = 0, bestDay = null, worstDay = null;
  if (monthEntries.length > 0) {
    averageMood = monthEntries.reduce((sum, entry) => sum + entry.mood, 0) / monthEntries.length;
    bestDay = monthEntries.reduce((best, entry) => entry.mood > best.mood ? entry : best, monthEntries[0]);
    worstDay = monthEntries.reduce((worst, entry) => entry.mood < worst.mood ? entry : worst, monthEntries[0]);
  }

  const { monthData, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Create array of days with mood data
    const monthData = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      monthData.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString();
      const entry = entries.find(e => e.date === dateString);
      
      monthData.push({
        day,
        date: dateString,
        entry: entry || null,
        isToday: dateString === new Date().toDateString()
      });
    }
    
    return { monthData, monthName, year };
  }, [currentDate, entries]);

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 1: return '#ef4444'; // Very Low - Red
      case 2: return '#f97316'; // Low - Orange
      case 3: return '#eab308'; // Okay - Yellow
      case 4: return '#22c55e'; // Good - Light Green
      case 5: return '#16a34a'; // Very Good - Green
      default: return '#e5e7eb'; // No data - Gray
    }
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😊';
      default: return '';
    }
  };

  const getMoodLabel = (mood) => {
    switch (mood) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Okay';
      case 4: return 'Good';
      case 5: return 'Very Good';
      default: return 'No entry';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button 
          className="nav-btn prev-btn"
          onClick={() => navigateMonth(-1)}
          aria-label="Previous month"
        >
          ←
        </button>
        
        <h3 className="calendar-title">
          {monthName} {year}
        </h3>
        
        <button 
          className="nav-btn next-btn"
          onClick={() => navigateMonth(1)}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="calendar-grid">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {monthData.map((dayData, index) => (
          <div 
            key={index} 
            className={`calendar-day ${dayData ? 'has-day' : 'empty-day'} ${dayData?.isToday ? 'today' : ''} ${dayData?.entry ? 'has-entry' : ''}`}
            onClick={() => dayData?.entry && onDateSelect(dayData.entry)}
            style={{
              backgroundColor: dayData?.entry ? `${getMoodColor(dayData.entry.mood)}20` : 'transparent',
              borderColor: dayData?.entry ? getMoodColor(dayData.entry.mood) : '#e5e7eb'
            }}
          >
            {dayData && (
              <>
                <span className="day-number">{dayData.day}</span>
                {dayData.entry && (
                  <div className="mood-indicator">
                    <span className="mood-emoji">{getMoodEmoji(dayData.entry.mood)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Dashboard Cards Row: Mood Scale + Monthly Summary */}
      <div className="mood-dashboard-cards">
        <div className="mood-scale-card">
          <div className="mood-scale-title">Mood Scale</div>
          <div className="mood-scale-list">
            <div className="mood-scale-row very-low" tabIndex="0">
              <div className="mood-scale-accent"></div>
              <span className="mood-scale-emoji" role="img" aria-label="Very Low">😞</span>
              <span className="mood-scale-label">Very Low</span>
            </div>
            <div className="mood-scale-row low" tabIndex="0">
              <div className="mood-scale-accent"></div>
              <span className="mood-scale-emoji" role="img" aria-label="Low">😕</span>
              <span className="mood-scale-label">Low</span>
            </div>
            <div className="mood-scale-row okay" tabIndex="0">
              <div className="mood-scale-accent"></div>
              <span className="mood-scale-emoji" role="img" aria-label="Okay">😐</span>
              <span className="mood-scale-label">Okay</span>
            </div>
            <div className="mood-scale-row good" tabIndex="0">
              <div className="mood-scale-accent"></div>
              <span className="mood-scale-emoji" role="img" aria-label="Good">🙂</span>
              <span className="mood-scale-label">Good</span>
            </div>
            <div className="mood-scale-row very-good" tabIndex="0">
              <div className="mood-scale-accent"></div>
              <span className="mood-scale-emoji" role="img" aria-label="Very Good">😊</span>
              <span className="mood-scale-label">Very Good</span>
            </div>
          </div>
        </div>
        <div className="monthly-summary premium-summary-wrapper">
          <div className="mood-summary-card" aria-label="Monthly Mood Summary">
            <div className="mood-summary-title">This Month's Mood Summary</div>
            {monthEntries.length === 0 ? (
              <div className="mood-summary-stats">
                <div className="mood-summary-stat-label">No mood entries this month yet.</div>
              </div>
            ) : (
              <div className="mood-summary-stats">
                <div className="mood-summary-stat-label">Entries:</div>
                <div className="mood-summary-stat-value">
                  <span className="mood-summary-badge" tabIndex="0">{monthEntries.length} days</span>
                </div>
                <div className="mood-summary-stat-label">Average Mood:</div>
                <div className="mood-summary-stat-value">
                  <span className="mood-summary-badge" tabIndex="0">{Math.round(averageMood * 10) / 10}/5</span>
                </div>
                <div className="mood-summary-stat-label">Best Day:</div>
                <div className="mood-summary-stat-value">
                  <span className="mood-summary-emoji" role="img" aria-label="Best Mood Emoji">{getMoodEmoji(bestDay.mood)}</span>
                  <span className="mood-summary-badge" tabIndex="0">{new Date(bestDay.timestamp).getDate()}</span>
                </div>
                <div className="mood-summary-stat-label">Challenging Day:</div>
                <div className="mood-summary-stat-value">
                  <span className="mood-summary-emoji" role="img" aria-label="Challenging Mood Emoji">{getMoodEmoji(worstDay.mood)}</span>
                  <span className="mood-summary-badge challenging" tabIndex="0">{new Date(worstDay.timestamp).getDate()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodCalendar;
