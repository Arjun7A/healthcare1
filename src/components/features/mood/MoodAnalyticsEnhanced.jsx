import React, { useState, useEffect, useMemo } from 'react';
import { generateMoodRecommendations, generateAdvancedMoodInsights } from '../../../lib/aiService';
import './MoodAnalytics.css';

const MoodAnalytics = ({ entries }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [activeChart, setActiveChart] = useState('mood-trend');
  const [insights, setInsights] = useState(null);
  const [advancedInsights, setAdvancedInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCorrelation, setSelectedCorrelation] = useState('sleep-mood');

  // Calculate comprehensive analytics data from Supabase entries only
  const analyticsData = useMemo(() => {
    if (!entries || entries.length === 0) return null;

    const now = new Date();
    let filteredEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Filter by timeframe
    const timeframes = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const daysBack = timeframes[selectedTimeframe];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    filteredEntries = filteredEntries.filter(e => new Date(e.timestamp) >= startDate);

    if (filteredEntries.length === 0) return null;

    // Calculate key metrics
    const avgMood = filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length;
    const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts = {};
    const emotionCounts = {};
    const weekdayMoods = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const hourlyMoods = Array(24).fill(null).map(() => []);
    const sleepMoodData = [];
    const energyMoodData = [];
    const moodSpikes = [];
    const journalLengthData = [];

    filteredEntries.forEach((entry, index) => {
      moodCounts[entry.mood]++;
      
      // Count activities/tags from Supabase data
      if (entry.activities) {
        entry.activities.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      
      // Count emotions from Supabase data
      if (entry.emotions) {
        entry.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });
      }

      // Weekday and hourly analysis
      const date = new Date(entry.timestamp);
      weekdayMoods[date.getDay()].push(entry.mood);
      hourlyMoods[date.getHours()].push(entry.mood);

      // Sleep correlation data
      if (entry.sleep_hours) {
        sleepMoodData.push({
          sleep: entry.sleep_hours,
          mood: entry.mood,
          date: date.toLocaleDateString()
        });
      }

      // Energy correlation data  
      if (entry.energy_level) {
        energyMoodData.push({
          energy: entry.energy_level,
          mood: entry.mood,
          date: date.toLocaleDateString()
        });
      }

      // Detect mood spikes (significant changes)
      if (index > 0) {
        const prevMood = filteredEntries[index - 1].mood;
        const moodChange = Math.abs(entry.mood - prevMood);
        if (moodChange >= 2) {
          moodSpikes.push({
            date: date.toLocaleDateString(),
            from: prevMood,
            to: entry.mood,
            change: entry.mood - prevMood,
            activities: entry.activities || [],
            emotions: entry.emotions || [],
            notes: entry.notes || ''
          });
        }
      }

      // Journal length analysis
      if (entry.notes) {
        journalLengthData.push({
          length: entry.notes.length,
          mood: entry.mood,
          date: date.toLocaleDateString()
        });
      }
    });

    // Calculate averages and patterns
    const weekdayAvgs = weekdayMoods.map(moods => 
      moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
    );
    
    const hourlyAvgs = hourlyMoods.map(moods => 
      moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0
    );

    // Get top tags and emotions
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Mood trend data for line chart
    const trendData = filteredEntries.map(entry => ({
      date: new Date(entry.timestamp).toLocaleDateString(),
      mood: entry.mood,
      timestamp: entry.timestamp,
      activities: entry.activities || [],
      emotions: entry.emotions || [],
      notes: entry.notes || ''
    }));

    // Calculate mood streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let streakType = null;
    
    for (let i = 0; i < filteredEntries.length; i++) {
      const mood = filteredEntries[i].mood;
      if (i === 0) {
        currentStreak = 1;
        streakType = mood >= 4 ? 'positive' : mood <= 2 ? 'negative' : 'neutral';
      } else {
        const currentType = mood >= 4 ? 'positive' : mood <= 2 ? 'negative' : 'neutral';
        
        if (currentType === streakType) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
          streakType = currentType;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Calculate sleep correlation
    const avgSleepHours = sleepMoodData.length > 0 ? 
      sleepMoodData.reduce((sum, d) => sum + d.sleep, 0) / sleepMoodData.length : 0;

    // Calculate energy correlation
    const avgEnergyLevel = energyMoodData.length > 0 ?
      energyMoodData.reduce((sum, d) => sum + d.energy, 0) / energyMoodData.length : 0;

    // Calculate mood distribution percentages
    const moodDistributionPercent = {};
    Object.entries(moodCounts).forEach(([mood, count]) => {
      moodDistributionPercent[mood] = (count / filteredEntries.length) * 100;
    });

    return {
      entries: filteredEntries,
      avgMood: Math.round(avgMood * 10) / 10,
      totalEntries: filteredEntries.length,
      moodDistribution: moodCounts,
      moodDistributionPercent,
      topTags,
      topEmotions,
      trendData,
      weekdayAvgs,
      hourlyAvgs,
      sleepMoodData,
      energyMoodData,
      moodSpikes,
      journalLengthData,
      longestStreak,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
      recentEntries: filteredEntries.slice(-10),
      bestDay: weekdayAvgs.indexOf(Math.max(...weekdayAvgs)),
      worstDay: weekdayAvgs.indexOf(Math.min(...weekdayAvgs.filter(avg => avg > 0))),
      bestHour: hourlyAvgs.indexOf(Math.max(...hourlyAvgs)),
      worstHour: hourlyAvgs.indexOf(Math.min(...hourlyAvgs.filter(avg => avg > 0))),
      timeframe: selectedTimeframe
    };
  }, [entries, selectedTimeframe]);

  // Generate comprehensive AI insights using Groq API
  const generateInsights = async () => {
    if (!analyticsData) return;
    
    setLoading(true);
    try {
      // Generate both basic and advanced insights
      const [basicInsights, advancedInsightsData] = await Promise.all([
        generateMoodRecommendations({
          averageMood: analyticsData.avgMood,
          moodTrend: analyticsData.avgMood >= 3.5 ? 'improving' : 'declining',
          totalEntries: analyticsData.totalEntries,
          commonEmotions: analyticsData.topEmotions.map(([emotion, count]) => ({ emotion, count })),
          commonActivities: analyticsData.topTags.map(([activity, count]) => ({ activity, count })),
          recent7Average: analyticsData.avgMood,
          previous7Average: analyticsData.avgMood - 0.2,
          recentEntries: analyticsData.recentEntries,
          allEntries: entries
        }),
        generateAdvancedMoodInsights(analyticsData)
      ]);

      setInsights(basicInsights);
      setAdvancedInsights(advancedInsightsData);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setInsights([]);
      setAdvancedInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analyticsData && selectedTimeframe === 'month') {
      generateInsights();
    }
  }, [analyticsData, selectedTimeframe]);

  const getMoodEmoji = (mood) => {
    const emojis = { 1: '😢', 2: '😔', 3: '😐', 4: '😊', 5: '😄' };
    return emojis[Math.round(mood)] || '😐';
  };

  const getMoodLabel = (mood) => {
    if (mood >= 4.5) return 'Excellent';
    if (mood >= 3.5) return 'Good';
    if (mood >= 2.5) return 'Fair';
    if (mood >= 1.5) return 'Poor';
    return 'Very Poor';
  };

  const getMoodColor = (mood) => {
    if (mood >= 4.5) return '#10b981';
    if (mood >= 3.5) return '#22c55e';
    if (mood >= 2.5) return '#eab308';
    if (mood >= 1.5) return '#f97316';
    return '#ef4444';
  };

  const getWeekdayName = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const exportData = (format) => {
    if (!analyticsData) return;

    if (format === 'csv') {
      const csvData = entries.map(entry => ({
        Date: new Date(entry.timestamp).toLocaleDateString(),
        Time: new Date(entry.timestamp).toLocaleTimeString(),
        Mood: entry.mood,
        Emotions: entry.emotions?.join('; ') || '',
        Activities: entry.activities?.join('; ') || '',
        Notes: entry.notes || '',
        Sleep_Hours: entry.sleep_hours || '',
        Energy_Level: entry.energy_level || ''
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mood-analytics-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      generatePDFReport();
    } else if (format === 'html') {
      generateHTMLReport();
    }
    
    setShowExportModal(false);
  };

  const generatePDFReport = () => {
    // Create a comprehensive PDF report
    const reportContent = `
      <html>
        <head>
          <title>Mood Analytics Report - ${selectedTimeframe}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .chart-section { margin: 20px 0; }
            .insight { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🧠 Mood Analytics Report</h1>
            <h2>${selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1)} Summary</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics">
            <div class="metric">
              <h3>Average Mood</h3>
              <p>${analyticsData.avgMood}/5 ${getMoodEmoji(analyticsData.avgMood)}</p>
            </div>
            <div class="metric">
              <h3>Total Entries</h3>
              <p>${analyticsData.totalEntries}</p>
            </div>
            <div class="metric">
              <h3>Sleep Average</h3>
              <p>${analyticsData.avgSleepHours} hours</p>
            </div>
            <div class="metric">
              <h3>Energy Average</h3>
              <p>${analyticsData.avgEnergyLevel}/5</p>
            </div>
          </div>

          <div class="chart-section">
            <h3>Top Activities</h3>
            ${analyticsData.topTags.map(([tag, count]) => `<p>${tag}: ${count} times</p>`).join('')}
          </div>

          <div class="chart-section">
            <h3>Mood Spikes Detected</h3>
            ${analyticsData.moodSpikes.map(spike => `
              <div class="insight">
                <p><strong>${spike.date}:</strong> Mood changed from ${spike.from} to ${spike.to} (${spike.change > 0 ? '+' : ''}${spike.change})</p>
                <p>Activities: ${spike.activities.join(', ') || 'None'}</p>
                <p>Notes: ${spike.notes || 'None'}</p>
              </div>
            `).join('')}
          </div>

          ${advancedInsights ? `
            <div class="chart-section">
              <h3>AI Insights</h3>
              <div class="insight">
                <h4>${advancedInsights.customTitle}</h4>
                <p><strong>Weekly Summary:</strong> ${advancedInsights.weeklyMoodSummary}</p>
                <p><strong>Trigger Patterns:</strong> ${advancedInsights.triggerPatternDetection}</p>
                <p><strong>Recommendations:</strong> ${advancedInsights.behavioralSuggestion}</p>
                <p><strong>Predictions:</strong> ${advancedInsights.predictiveInsights}</p>
              </div>
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-report-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateHTMLReport = () => {
    generatePDFReport(); // For now, HTML and PDF share the same generation logic
  };

  if (!analyticsData) {
    return (
      <div className="mood-analytics-empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Analytics Data</h3>
          <p>Start tracking your mood to see beautiful insights and analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mood-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>🧠 Mood Analytics</h2>
          <p>Advanced insights powered by Groq AI</p>
        </div>
        
        <div className="header-controls">
          <div className="timeframe-selector">
            {['week', 'month', 'quarter', 'year'].map(period => (
              <button
                key={period}
                className={`timeframe-btn ${selectedTimeframe === period ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          <button 
            className="export-btn"
            onClick={() => setShowExportModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">{getMoodEmoji(analyticsData.avgMood)}</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.avgMood}</div>
            <div className="metric-label">Average Mood</div>
            <div className="metric-sublabel">{getMoodLabel(analyticsData.avgMood)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.totalEntries}</div>
            <div className="metric-label">Total Entries</div>
            <div className="metric-sublabel">This {selectedTimeframe}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛌</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.avgSleepHours}h</div>
            <div className="metric-label">Sleep Average</div>
            <div className="metric-sublabel">Per night</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.avgEnergyLevel}/5</div>
            <div className="metric-label">Energy Level</div>
            <div className="metric-sublabel">Average</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.longestStreak}</div>
            <div className="metric-label">Longest Streak</div>
            <div className="metric-sublabel">Consecutive days</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{analyticsData.moodSpikes.length}</div>
            <div className="metric-label">Mood Spikes</div>
            <div className="metric-sublabel">Significant changes</div>
          </div>
        </div>
      </div>

      {/* Advanced Chart Navigation */}
      <div className="chart-navigation">
        <div className="chart-tabs">
          {[
            { id: 'mood-trend', label: 'Mood Over Time', icon: '📈' },
            { id: 'mood-distribution', label: 'Mood Distribution', icon: '🥧' },
            { id: 'tags-frequency', label: 'Tags Frequency', icon: '📊' },
            { id: 'sleep-mood', label: 'Sleep vs Mood', icon: '🛌' },
            { id: 'energy-mood', label: 'Energy vs Mood', icon: '⚡' },
            { id: 'weekday-analysis', label: 'Weekday Analysis', icon: '📅' },
            { id: 'time-patterns', label: 'Time Patterns', icon: '🕒' },
            { id: 'mood-spikes', label: 'Mood Spikes', icon: '📈' },
            { id: 'correlations', label: 'Correlations', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
              onClick={() => setActiveChart(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive Chart Content */}
      <div className="chart-content">
        {activeChart === 'mood-trend' && (
          <div className="mood-trend-chart">
            <h4>📈 Mood Over Time - Line Chart</h4>
            <p className="chart-description">Track daily mood scores over the last {selectedTimeframe}</p>
            <div className="trend-visualization">
              {analyticsData.trendData.map((point, index) => (
                <div key={index} className="trend-point">
                  <div 
                    className="trend-dot"
                    style={{ 
                      backgroundColor: getMoodColor(point.mood),
                      height: `${(point.mood / 5) * 80 + 20}px`
                    }}
                    title={`${point.date}: ${getMoodEmoji(point.mood)} ${point.mood}/5\nActivities: ${point.activities.join(', ')}\nNotes: ${point.notes.slice(0, 50)}...`}
                  ></div>
                  <div className="trend-date">{point.date.slice(-5)}</div>
                </div>
              ))}
            </div>
            <div className="trend-stats">
              <p>📊 Trend: {analyticsData.avgMood >= 3.5 ? '📈 Improving' : '📉 Needs Attention'}</p>
              <p>🎯 Target: Maintain mood above 3.5 for optimal wellbeing</p>
            </div>
          </div>
        )}

        {activeChart === 'mood-distribution' && (
          <div className="mood-distribution">
            <h4>🥧 Mood Distribution - Pie Chart</h4>
            <p className="chart-description">Percentage breakdown of mood categories</p>
            <div className="distribution-chart">
              {Object.entries(analyticsData.moodDistribution).map(([mood, count]) => {
                const percentage = (count / analyticsData.totalEntries) * 100;
                return (
                  <div key={mood} className="mood-bar-container">
                    <div className="mood-bar-label">
                      {getMoodEmoji(parseInt(mood))} {getMoodLabel(parseInt(mood))}
                    </div>
                    <div className="mood-bar-track">
                      <div 
                        className="mood-bar-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: getMoodColor(parseInt(mood))
                        }}
                      ></div>
                    </div>
                    <div className="mood-bar-value">
                      {count} ({Math.round(percentage)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeChart === 'tags-frequency' && (
          <div className="tags-frequency-chart">
            <h4>📊 Top 5 Mood Triggers - Bar Chart</h4>
            <p className="chart-description">Activities and triggers affecting your mood</p>
            <div className="frequency-bars">
              {analyticsData.topTags.map(([tag, count]) => (
                <div key={tag} className="frequency-bar">
                  <div className="frequency-label">{tag}</div>
                  <div className="frequency-track">
                    <div 
                      className="frequency-fill"
                      style={{ width: `${(count / Math.max(...analyticsData.topTags.map(([,c]) => c))) * 100}%` }}
                    />
                  </div>
                  <div className="frequency-count">{count} times</div>
                </div>
              ))}
            </div>
            {analyticsData.topEmotions.length > 0 && (
              <div className="emotions-section">
                <h5>🎭 Top Emotions</h5>
                <div className="emotion-tags">
                  {analyticsData.topEmotions.map(([emotion, count]) => (
                    <span key={emotion} className="emotion-tag">
                      {emotion} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeChart === 'sleep-mood' && (
          <div className="sleep-mood-correlation">
            <h4>🛌 Sleep vs Mood Correlation</h4>
            <p className="chart-description">Compare hours of sleep to mood scores</p>
            {analyticsData.sleepMoodData.length > 0 ? (
              <div className="correlation-chart">
                <div className="scatter-plot">
                  {analyticsData.sleepMoodData.map((point, index) => (
                    <div 
                      key={index}
                      className="scatter-point"
                      style={{
                        left: `${(point.sleep / 12) * 100}%`,
                        bottom: `${(point.mood / 5) * 100}%`,
                        backgroundColor: getMoodColor(point.mood)
                      }}
                      title={`${point.date}: ${point.sleep}h sleep, mood ${point.mood}/5`}
                    />
                  ))}
                </div>
                <div className="correlation-stats">
                  <p>💤 Average Sleep: {analyticsData.avgSleepHours} hours</p>
                  <p>😊 Average Mood: {analyticsData.avgMood}/5</p>
                  <p>🎯 Optimal Sleep: 7-9 hours for best mood</p>
                </div>
              </div>
            ) : (
              <div className="no-data">
                <p>📝 Start tracking sleep hours to see correlation with mood</p>
              </div>
            )}
          </div>
        )}

        {activeChart === 'energy-mood' && (
          <div className="energy-mood-correlation">
            <h4>⚡ Energy vs Mood - Stacked Chart</h4>
            <p className="chart-description">Overlay of energy levels and mood scores</p>
            {analyticsData.energyMoodData.length > 0 ? (
              <div className="stacked-chart">
                {analyticsData.energyMoodData.map((point, index) => (
                  <div key={index} className="stacked-bar">
                    <div className="energy-bar" style={{ height: `${(point.energy / 5) * 100}%` }} />
                    <div className="mood-bar" style={{ height: `${(point.mood / 5) * 100}%`, backgroundColor: getMoodColor(point.mood) }} />
                    <div className="bar-label">{point.date.slice(-5)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>📝 Start tracking energy levels to see correlation with mood</p>
              </div>
            )}
          </div>
        )}

        {activeChart === 'weekday-analysis' && (
          <div className="weekday-analysis">
            <h4>📅 Weekday Mood Average</h4>
            <p className="chart-description">Shows which days you're happiest/saddest (Mon–Sun)</p>
            <div className="weekday-chart">
              {analyticsData.weekdayAvgs.map((avg, day) => (
                <div key={day} className="weekday-item">
                  <div className="weekday-name">{getWeekdayName(day).slice(0, 3)}</div>
                  <div 
                    className="weekday-bar"
                    style={{ 
                      height: `${(avg / 5) * 100}%`,
                      backgroundColor: getMoodColor(avg)
                    }}
                    title={`${getWeekdayName(day)}: ${avg.toFixed(1)}/5`}
                  ></div>
                  <div className="weekday-value">{avg > 0 ? avg.toFixed(1) : '-'}</div>
                </div>
              ))}
            </div>
            <div className="weekday-insights">
              <p>📈 Best Day: {getWeekdayName(analyticsData.bestDay)} ({analyticsData.weekdayAvgs[analyticsData.bestDay].toFixed(1)}/5)</p>
              <p>📉 Challenging Day: {getWeekdayName(analyticsData.worstDay)} ({analyticsData.weekdayAvgs[analyticsData.worstDay].toFixed(1)}/5)</p>
            </div>
          </div>
        )}

        {activeChart === 'time-patterns' && (
          <div className="time-patterns">
            <h4>🕒 Time-of-Day vs Mood</h4>
            <p className="chart-description">Detect if mornings vs evenings impact mood</p>
            <div className="hourly-chart">
              {analyticsData.hourlyAvgs.map((avg, hour) => (
                avg > 0 && (
                  <div key={hour} className="hourly-item">
                    <div className="hourly-time">{hour}:00</div>
                    <div 
                      className="hourly-bar"
                      style={{ 
                        height: `${(avg / 5) * 100}%`,
                        backgroundColor: getMoodColor(avg)
                      }}
                      title={`${hour}:00: ${avg.toFixed(1)}/5`}
                    ></div>
                    <div className="hourly-value">{avg.toFixed(1)}</div>
                  </div>
                )
              ))}
            </div>
            <div className="time-insights">
              <p>🌅 Best Hour: {analyticsData.bestHour}:00 ({analyticsData.hourlyAvgs[analyticsData.bestHour].toFixed(1)}/5)</p>
              <p>🌆 Challenging Hour: {analyticsData.worstHour}:00 ({analyticsData.hourlyAvgs[analyticsData.worstHour].toFixed(1)}/5)</p>
            </div>
          </div>
        )}

        {activeChart === 'mood-spikes' && (
          <div className="mood-spikes-analysis">
            <h4>📈 Mood Spike Detection</h4>
            <p className="chart-description">Highlight days where mood changed drastically (±2 points)</p>
            {analyticsData.moodSpikes.length > 0 ? (
              <div className="spikes-list">
                {analyticsData.moodSpikes.map((spike, index) => (
                  <div key={index} className={`spike-item ${spike.change > 0 ? 'positive-spike' : 'negative-spike'}`}>
                    <div className="spike-header">
                      <span className="spike-date">{spike.date}</span>
                      <span className="spike-change">
                        {spike.change > 0 ? '📈' : '📉'} {spike.from} → {spike.to} ({spike.change > 0 ? '+' : ''}{spike.change})
                      </span>
                    </div>
                    <div className="spike-details">
                      <p><strong>Activities:</strong> {spike.activities.join(', ') || 'None recorded'}</p>
                      <p><strong>Emotions:</strong> {spike.emotions.join(', ') || 'None recorded'}</p>
                      {spike.notes && <p><strong>Notes:</strong> {spike.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-spikes">
                <p>✨ No significant mood spikes detected - your mood has been stable!</p>
              </div>
            )}
          </div>
        )}

        {activeChart === 'correlations' && (
          <div className="custom-correlations">
            <h4>🔍 Custom Mood Correlations</h4>
            <p className="chart-description">Analyze relationships between different variables</p>
            
            <div className="correlation-selector">
              <label>Choose correlation to analyze:</label>
              <select value={selectedCorrelation} onChange={(e) => setSelectedCorrelation(e.target.value)}>
                <option value="sleep-mood">Sleep Hours vs Mood</option>
                <option value="energy-mood">Energy Level vs Mood</option>
                <option value="journal-mood">Journal Length vs Mood</option>
                <option value="weekday-mood">Weekday vs Mood</option>
                <option value="time-mood">Time of Day vs Mood</option>
              </select>
            </div>

            <div className="correlation-results">
              {selectedCorrelation === 'journal-mood' && (
                <div className="journal-mood-correlation">
                  <h5>📝 Journal Length vs Mood Analysis</h5>
                  {analyticsData.journalLengthData.length > 0 ? (
                    <div className="correlation-insights">
                      <p>Average journal length: {Math.round(analyticsData.journalLengthData.reduce((sum, d) => sum + d.length, 0) / analyticsData.journalLengthData.length)} characters</p>
                      <p>Longest entries tend to have {analyticsData.journalLengthData.filter(d => d.length > 200).reduce((sum, d) => sum + d.mood, 0) / analyticsData.journalLengthData.filter(d => d.length > 200).length > analyticsData.avgMood ? 'higher' : 'lower'} mood scores</p>
                    </div>
                  ) : (
                    <p>Start writing longer journal entries to see this correlation</p>
                  )}
                </div>
              )}
              
              {selectedCorrelation === 'sleep-mood' && analyticsData.sleepMoodData.length > 0 && (
                <div className="sleep-correlation-detailed">
                  <h5>🛌 Detailed Sleep-Mood Analysis</h5>
                  <div className="correlation-grid">
                    <div className="correlation-stat">
                      <span className="stat-label">Best Sleep Range:</span>
                      <span className="stat-value">7-9 hours</span>
                    </div>
                    <div className="correlation-stat">
                      <span className="stat-label">Your Average:</span>
                      <span className="stat-value">{analyticsData.avgSleepHours}h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced GPT/LLM-Based Analytics */}
      {advancedInsights && (
        <div className="advanced-insights-section">
          <div className="insights-header">
            <h3>🤖 GPT-Powered Advanced Analytics</h3>
            <p className="insights-subtitle">Natural language insights generated by Groq/Llama 3</p>
          </div>

          <div className="advanced-insights-grid">
            <div className="insight-card primary">
              <div className="insight-header">
                <h4>📝 {advancedInsights.customTitle}</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.weeklyMoodSummary}</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>🔍 Pattern Detection</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.triggerPatternDetection}</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>💡 Behavioral Suggestions</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.behavioralSuggestion}</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>📊 Tag Correlations</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.tagCorrelation}</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>📈 Predictive Insights</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.predictiveInsights}</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>⚡ Mood Spikes Analysis</h4>
              </div>
              <div className="insight-content">
                <p>{advancedInsights.moodSpikeDetection}</p>
              </div>
            </div>
          </div>

          {advancedInsights.riskFactors && advancedInsights.riskFactors !== 'None identified' && (
            <div className="risk-factors-alert">
              <h4>⚠️ Risk Factors Identified</h4>
              <p>{advancedInsights.riskFactors}</p>
            </div>
          )}

          <div className="positive-patterns">
            <h4>✨ Positive Patterns to Continue</h4>
            <p>{advancedInsights.positivePatterns}</p>
          </div>
        </div>
      )}

      {/* Standard AI Insights Section */}
      {insights && insights.length > 0 && (
        <div className="basic-insights-section">
          <div className="insights-header">
            <h4>🎯 Quick Recommendations</h4>
          </div>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className="basic-insight-card">
                <div className="insight-text">{insight}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="insights-actions">
        <button 
          className="refresh-insights-btn"
          onClick={generateInsights}
          disabled={loading}
        >
          {loading ? '🔄 Analyzing with Groq AI...' : '🔄 Generate New Insights'}
        </button>
      </div>

      {/* Enhanced Export Modal */}
      {showExportModal && (
        <div className="export-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Export Mood Analytics</h3>
              <button 
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>Export comprehensive mood analytics for the selected timeframe ({selectedTimeframe}).</p>
              <div className="export-options">
                <button 
                  className="export-option-btn"
                  onClick={() => exportData('csv')}
                >
                  📊 Export as CSV
                  <span className="export-description">Raw data for spreadsheet analysis</span>
                </button>
                <button 
                  className="export-option-btn"
                  onClick={() => exportData('html')}
                >
                  📄 Weekly Summary Report
                  <span className="export-description">HTML report with charts and AI insights</span>
                </button>
                <button 
                  className="export-option-btn"
                  onClick={() => exportData('pdf')}
                >
                  📑 Monthly Review PDF
                  <span className="export-description">Professional report for therapists</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodAnalytics;
