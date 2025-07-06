import React, { useState, useMemo, useEffect } from 'react';
import { generateMoodRecommendations, generateAdvancedMoodInsights } from '../../../lib/aiService';
import { generatePDFReport, generateHTMLReport } from '../../../services/exportService';
import './MoodAnalytics.css';
import MoodLineChart from './MoodLineChart';
import MoodPieChart from './MoodPieChart';
import TagsBarChart from './TagsBarChart';
import StackedEnergyMoodChart from './StackedEnergyMoodChart';
import SleepVsMoodChart from './SleepVsMoodChart';
import WeekdayMoodBarChart from './WeekdayMoodBarChart';
import TimeOfDayMoodChart from './TimeOfDayMoodChart';
import MoodSpikeDetectionChart from './MoodSpikeDetectionChart';
import MoodHeatmapChart from './MoodHeatmapChart';
import MoodRadarChart from './MoodRadarChart';
import MoodFilters from './MoodFilters';

const chartTabs = [
  { id: 'mood-trend', label: 'Mood Over Time', icon: '📈' },
  { id: 'mood-breakdown', label: 'Mood Breakdown', icon: '🥧' },
  { id: 'tags-frequency', label: 'Tags Frequency', icon: '🏷️' },
  { id: 'energy-vs-mood', label: 'Energy vs Mood', icon: '⚡' },
  { id: 'sleep-vs-mood', label: 'Sleep vs Mood', icon: '😴' },
  { id: 'weekday-mood', label: 'Weekday Mood', icon: '📅' },
  { id: 'timeofday-mood', label: 'Time of Day', icon: '⏰' },
  { id: 'mood-spikes', label: 'Mood Spikes', icon: '🚨' },
  { id: 'mood-heatmap', label: 'Mood Heatmap', icon: '🔥' },
  { id: 'mood-radar', label: 'Mood Radar', icon: '🎯' },
];

const MoodAnalytics = ({ entries }) => {
  const [activeChart, setActiveChart] = useState('mood-trend');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [insights, setInsights] = useState(null);
  const [advancedInsights, setAdvancedInsights] = useState(null);
  const [advancedInsightsError, setAdvancedInsightsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    moodRange: { min: 1, max: 5 },
    selectedTags: [],
    selectedEmotions: [],
    dateRange: { start: null, end: null },
    hasNotes: 'all'
  });

  // Apply filters to entries
  const applyFilters = (entries, filters) => {
    if (!entries || entries.length === 0) return entries;

    return entries.filter(entry => {
      // Mood range filter
      if (entry.mood < filters.moodRange.min || entry.mood > filters.moodRange.max) {
        return false;
      }

      // Tags filter
      if (filters.selectedTags.length > 0) {
        const hasSelectedTag = entry.activities && 
          entry.activities.some(tag => filters.selectedTags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      // Emotions filter
      if (filters.selectedEmotions.length > 0) {
        const hasSelectedEmotion = entry.emotions && 
          entry.emotions.some(emotion => filters.selectedEmotions.includes(emotion));
        if (!hasSelectedEmotion) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const entryDate = new Date(entry.date);
        if (filters.dateRange.start && entryDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && entryDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Notes filter
      if (filters.hasNotes === 'withNotes' && !entry.notes) {
        return false;
      }
      if (filters.hasNotes === 'withoutNotes' && entry.notes) {
        return false;
      }

      return true;
    });
  };

  // Compute metrics and chart data from filtered entries
  const {
    metrics,
    moodTrendData,
    moodPieData,
    tagsBarData,
    energyMoodData,
    sleepMoodData,
    weekdayMoodData,
    timeOfDayMoodData,
    moodSpikesData,
    filteredEntries,
    heatmapData,
    radarData
  } = useMemo(() => {
    // First apply filters
    const filteredByUser = applyFilters(entries, activeFilters);
    
    if (!filteredByUser || !Array.isArray(filteredByUser) || filteredByUser.length === 0) {
      return {
        metrics: [
          { title: 'Avg Mood This Period', value: '-', icon: '😐', subtitle: 'No data' },
          { title: 'Most Common Tag', value: '-', icon: '🏷️', subtitle: 'No data' },
          { title: 'Sleep Avg', value: '-', icon: '😴', subtitle: 'No data' },
          { title: 'Energy Avg', value: '-', icon: '⚡', subtitle: 'No data' },
          { title: 'Entries', value: '0', icon: '📝', subtitle: 'No data' },
        ],
        moodTrendData: [],
        moodPieData: [],
        tagsBarData: [],
        energyMoodData: [],
        sleepMoodData: [],
        weekdayMoodData: [],
        timeOfDayMoodData: [],
        moodSpikesData: [],
        filteredEntries: [],
        heatmapData: [],
        radarData: []
      };
    }

    // Filter by timeframe
    const now = new Date();
    const timeframes = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    
    const daysBack = timeframes[selectedTimeframe];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const filteredEntries = filteredByUser.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= startDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredEntries.length === 0) {
      return {
        metrics: [
          { title: 'Avg Mood This Period', value: '-', icon: '😐', subtitle: `Last ${daysBack} days` },
          { title: 'Most Common Tag', value: '-', icon: '🏷️', subtitle: 'No data' },
          { title: 'Sleep Avg', value: '-', icon: '😴', subtitle: `Last ${daysBack} days` },
          { title: 'Energy Avg', value: '-', icon: '⚡', subtitle: `Last ${daysBack} days` },
          { title: 'Entries', value: '0', icon: '📝', subtitle: 'No data' },
        ],
        moodTrendData: [],
        moodPieData: [],
        tagsBarData: [],
        energyMoodData: [],
        sleepMoodData: [],
        weekdayMoodData: [],
        timeOfDayMoodData: [],
        moodSpikesData: [],
        filteredEntries: [],
        heatmapData: [],
        radarData: []
      };
    }

    // Calculate metrics
    const avgMood = (filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length).toFixed(1);
    
    // Most common tag
    const tagCounts = {};
    filteredEntries.forEach(e => {
      (e.activities || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const mostCommonTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    
    // Sleep avg (real calculation)
    const sleepEntries = filteredEntries.filter(e => typeof e.sleep_hours === 'number');
    const sleepAvg = sleepEntries.length > 0 ? (sleepEntries.reduce((sum, e) => sum + e.sleep_hours, 0) / sleepEntries.length).toFixed(1) : '-';

    // Energy avg (real calculation)
    const energyEntries = filteredEntries.filter(e => typeof e.energy_level === 'number');
    const energyAvg = energyEntries.length > 0 ? (energyEntries.reduce((sum, e) => sum + e.energy_level, 0) / energyEntries.length).toFixed(1) : '-';

    // Entries count
    const entriesCount = filteredEntries.length;

    // Mood trend data (line chart)
    const moodTrendData = filteredEntries.map(e => ({
      date: e.date,
      mood: e.mood
    }));

    // Mood pie data
    const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredEntries.forEach(e => moodCounts[e.mood]++);
    const moodPieData = Object.entries(moodCounts).map(([mood, count]) => ({
      name: `Mood ${mood}`,
      value: count,
      total: filteredEntries.length
    }));

    // Tags bar data
    const tagsBarData = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Energy vs Mood (real data)
    const energyMoodData = energyEntries.map(e => ({
      date: e.date,
      energy: e.energy_level,
      mood: e.mood
    }));

    // Sleep vs Mood (real data)
    const sleepMoodData = sleepEntries.map(e => ({
      date: e.date,
      sleep: e.sleep_hours,
      mood: e.mood
    }));

    // Weekday mood avg
    const weekdayMoods = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    filteredEntries.forEach(e => {
      const day = new Date(e.date).getDay();
      weekdayMoods[day].push(e.mood);
    });
    
    const weekdayMoodData = Object.entries(weekdayMoods).map(([day, moods]) => ({
      weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
      avgMood: moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2) : 0
    }));

    // Time of day mood avg
    const hourlyMoods = Array(24).fill(null).map(() => []);
    filteredEntries.forEach(e => {
      if (e.created_at) {
        const hour = new Date(e.created_at).getHours();
        hourlyMoods[hour].push(e.mood);
      }
    });
    
    const timeOfDayMoodData = hourlyMoods.map((moods, hour) => ({
      hour,
      avgMood: moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2) : 0
    }));

    // Mood spikes (change >=2)
    const moodSpikesData = [];
    for (let i = 1; i < filteredEntries.length; i++) {
      const prevMood = filteredEntries[i - 1].mood;
      const currentMood = filteredEntries[i].mood;
      if (Math.abs(currentMood - prevMood) >= 2) {
        moodSpikesData.push({
          date: filteredEntries[i].date,
          from: prevMood,
          to: currentMood,
          change: currentMood - prevMood
        });
      }
    }

    // Heatmap data
    const heatmapData = filteredEntries.map(entry => {
      const date = new Date(entry.date);
      const hour = entry.created_at ? new Date(entry.created_at).getHours() : 12;
      const dayOfWeek = date.getDay();
      
      return {
        x: dayOfWeek,
        y: hour,
        z: entry.mood,
        date: entry.date,
        mood: entry.mood,
        activities: entry.activities || [],
        emotions: entry.emotions || []
      };
    });

    // Radar data
    const aspects = {
      'Average Mood': filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length,
      'Mood Stability': 0,
      'Positive Days': 0,
      'High Energy': 0,
      'Social Activity': 0,
      'Productivity': 0
    };

    // Calculate mood stability (inverse of variance)
    const avgMoodValue = aspects['Average Mood'];
    const variance = filteredEntries.reduce((sum, e) => sum + Math.pow(e.mood - avgMoodValue, 2), 0) / filteredEntries.length;
    aspects['Mood Stability'] = Math.max(0, 5 - Math.sqrt(variance));

    // Calculate positive days percentage
    const positiveDays = filteredEntries.filter(e => e.mood >= 4).length;
    aspects['Positive Days'] = (positiveDays / filteredEntries.length) * 5;

    // Calculate high energy days (placeholder)
    aspects['High Energy'] = aspects['Average Mood'] * 0.8;

    // Calculate social activity
    const socialActivities = filteredEntries.filter(e => 
      e.activities && e.activities.some(activity => 
        ['friends', 'family', 'social', 'party', 'meeting'].includes(activity.toLowerCase())
      )
    ).length;
    aspects['Social Activity'] = (socialActivities / filteredEntries.length) * 5;

    // Calculate productivity
    const productiveActivities = filteredEntries.filter(e => 
      e.activities && e.activities.some(activity => 
        ['work', 'study', 'exercise', 'reading', 'project'].includes(activity.toLowerCase())
      )
    ).length;
    aspects['Productivity'] = (productiveActivities / filteredEntries.length) * 5;

    const radarData = Object.entries(aspects).map(([subject, value]) => ({
      subject,
      value: Math.min(5, Math.max(0, value)),
      fullMark: 5
    }));

    return {
      metrics: [
        { title: 'Avg Mood This Period', value: avgMood, icon: '😐', subtitle: `Last ${daysBack} days` },
        { title: 'Most Common Tag', value: mostCommonTag, icon: '🏷️', subtitle: 'Top trigger' },
        { title: 'Sleep Avg', value: sleepAvg, icon: '😴', subtitle: `Last ${daysBack} days` },
        { title: 'Energy Avg', value: energyAvg, icon: '⚡', subtitle: `Last ${daysBack} days` },
        { title: 'Entries', value: entriesCount, icon: '📝', subtitle: 'This period' },
      ],
      moodTrendData,
      moodPieData,
      tagsBarData,
      energyMoodData,
      sleepMoodData,
      weekdayMoodData,
      timeOfDayMoodData,
      moodSpikesData,
      filteredEntries,
      heatmapData,
      radarData
    };
  }, [entries, selectedTimeframe, activeFilters]);

  // Generate AI insights
  const generateInsights = async () => {
    if (!filteredEntries || filteredEntries.length === 0) return;
    
    setLoading(true);
    try {
      // Generate basic insights
      const basicInsights = await generateMoodRecommendations(filteredEntries);
      setInsights(basicInsights);

      // Prepare comprehensive analytics data for advanced insights
      const analyticsData = {
        entries: filteredEntries,
        avgMood: parseFloat(metrics.find(m => m.title === 'Avg Mood This Period')?.value) || 0,
        totalEntries: filteredEntries.length,
        moodDistribution: moodPieData.reduce((acc, item) => {
          acc[item.name] = item.value;
          return acc;
        }, {}),
        topTags: tagsBarData.slice(0, 5).map(item => [item.tag, item.count]),
        topEmotions: [], // Will be populated if emotion data is available
        weekdayAvgs: weekdayMoodData.map(item => parseFloat(item.avgMood)),
        hourlyAvgs: timeOfDayMoodData.map(item => parseFloat(item.avgMood)),
        sleepData: sleepMoodData,
        energyData: energyMoodData,
        timeframe: selectedTimeframe
      };

      // Generate advanced insights
      const advancedInsights = await generateAdvancedMoodInsights(analyticsData);
      setAdvancedInsights(advancedInsights);
      setAdvancedInsightsError("");
    } catch (error) {
      console.error('Error generating insights:', error);
      setAdvancedInsightsError(error.message || 'Failed to generate advanced insights.');
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const exportData = async (format) => {
    if (!filteredEntries || filteredEntries.length === 0) return;
    
    const analyticsData = {
      metrics,
      moodTrendData,
      tagsBarData,
      advancedInsights
    };
    
    switch (format) {
      case 'csv':
        const csvContent = [
          'Date,Mood,Activities,Emotions,Notes',
          ...filteredEntries.map(e => 
            `${e.date},${e.mood},"${(e.activities || []).join(', ')}","${(e.emotions || []).join(', ')}","${e.notes || ''}"`
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mood-data-${selectedTimeframe}.csv`;
        a.click();
        break;
        
      case 'pdf':
        try {
          const doc = await generatePDFReport(analyticsData, selectedTimeframe);
          doc.save(`mood-report-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
          console.error('Error generating PDF:', error);
          alert('Error generating PDF report. Please try again.');
        }
        break;
        
      case 'html':
        try {
          const html = generateHTMLReport(analyticsData, selectedTimeframe);
          const blob = new Blob([html], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mood-report-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.html`;
          a.click();
        } catch (error) {
          console.error('Error generating HTML:', error);
          alert('Error generating HTML report. Please try again.');
        }
        break;
    }
    
    setShowExportModal(false);
  };

  const handleFiltersChange = (newFilters) => {
    setActiveFilters(newFilters);
  };

  return (
    <div className="mood-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>Mood Analytics Dashboard</h2>
          <div className="header-controls">
            <div className="timeframe-selector">
              {Object.entries({ week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year' }).map(([key, label]) => (
                <button
                  key={key}
                  className={`timeframe-btn ${selectedTimeframe === key ? 'active' : ''}`}
                  onClick={() => setSelectedTimeframe(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="export-controls">
              <button 
                className="export-btn"
                onClick={() => setShowExportModal(true)}
              >
                📊 Export Data
              </button>
              <button 
                className="insights-btn"
                onClick={generateInsights}
                disabled={loading || !filteredEntries || filteredEntries.length === 0}
              >
                {loading ? '🔄 Analyzing...' : '🤖 Generate Insights'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <MoodFilters
        entries={entries}
        onFiltersChange={handleFiltersChange}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Main Content */}
      <div className="analytics-content">
        {/* Top Metrics Cards */}
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <div className="metric-card" key={i}>
              <div className="metric-header">
                <span className="metric-icon">{m.icon}</span>
                <span className="metric-title">{m.title}</span>
              </div>
              <div className="metric-value">{m.value}</div>
              <div className="metric-subtitle">{m.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-navigation">
            {chartTabs.map(tab => (
              <button
                key={tab.id}
                className={`chart-nav-btn${activeChart === tab.id ? ' active' : ''}`}
                onClick={() => setActiveChart(tab.id)}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
          <div className="chart-container">
            {/* Show beautiful empty state if no data for the selected chart */}
            {activeChart === 'tags-frequency' && tagsBarData.length === 0 && (
              <div className="no-data">
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🏷️</span>
                <h3>No tag data available</h3>
                <p>Add tags to your mood entries to see tag frequency analytics here.</p>
              </div>
            )}
            {activeChart === 'energy-vs-mood' && energyMoodData.length === 0 && (
              <div className="no-data">
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>⚡</span>
                <h3>No energy data available</h3>
                <p>Add energy levels to your mood entries to see energy-mood analytics here.</p>
              </div>
            )}
            {activeChart === 'sleep-vs-mood' && sleepMoodData.length === 0 && (
              <div className="no-data">
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>😴</span>
                <h3>No sleep data available</h3>
                <p>Add sleep hours to your mood entries to see sleep-mood analytics here.</p>
              </div>
            )}
            {/* Fallback for all other charts */}
            {['mood-trend','mood-breakdown','weekday-mood','timeofday-mood','mood-spikes','mood-heatmap','mood-radar'].includes(activeChart) && filteredEntries.length === 0 && (
              <div className="no-data">
                <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📊</span>
                <h3>No mood data available</h3>
                <p>Add mood entries to see analytics and insights here.</p>
              </div>
            )}
            {/* Render charts only if data exists */}
            {activeChart === 'mood-trend' && moodTrendData.length > 0 && <MoodLineChart data={moodTrendData} />}
            {activeChart === 'mood-breakdown' && moodPieData.length > 0 && <MoodPieChart data={moodPieData} />}
            {activeChart === 'tags-frequency' && tagsBarData.length > 0 && <TagsBarChart data={tagsBarData} />}
            {activeChart === 'energy-vs-mood' && energyMoodData.length > 0 && <StackedEnergyMoodChart data={energyMoodData} />}
            {activeChart === 'sleep-vs-mood' && sleepMoodData.length > 0 && <SleepVsMoodChart data={sleepMoodData} />}
            {activeChart === 'weekday-mood' && weekdayMoodData.length > 0 && <WeekdayMoodBarChart data={weekdayMoodData} />}
            {activeChart === 'timeofday-mood' && timeOfDayMoodData.length > 0 && <TimeOfDayMoodChart data={timeOfDayMoodData} />}
            {activeChart === 'mood-spikes' && moodSpikesData.length > 0 && <MoodSpikeDetectionChart data={moodSpikesData} />}
            {activeChart === 'mood-heatmap' && heatmapData.length > 0 && <MoodHeatmapChart data={heatmapData} />}
            {activeChart === 'mood-radar' && radarData.length > 0 && <MoodRadarChart data={radarData} />}
          </div>
        </div>

        {/* AI-Powered Insights Section */}
        <div className="insights-section">
          <div className="insights-header">
            <h3 className="insights-title">AI-Powered Mood Insights</h3>
            <p className="insights-subtitle">Generated by AI based on your mood data</p>
          </div>
          <div className="insights-grid">
            {/* Show beautiful empty state if advancedInsights is missing or can't be parsed */}
            {!advancedInsights && (
              <div className="insight-card">
                <div className="insight-header">
                  <h4>Analysis Unavailable</h4>
                </div>
                <div className="insight-content">
                  {loading && (
                    <p>Analyzing your data with AI...</p>
                  )}
                  {!loading && advancedInsightsError && advancedInsightsError.includes('rate limit') ? (
                    <p style={{ color: '#ef4444', fontWeight: 600 }}>
                      🚫 Groq AI rate limit exceeded.<br />
                      Please wait a minute and try again.<br />
                      For higher usage, upgrade your Groq plan at <a href="https://console.groq.com/settings/billing" target="_blank" rel="noopener noreferrer">Groq Billing</a>.
                    </p>
                  ) : (
                    <p>
                      AI-powered insights are not available yet. Add more mood entries with tags, sleep, and energy data to unlock advanced analysis.
                    </p>
                  )}
                </div>
              </div>
            )}
            {advancedInsights && (
              <>
                <div className="insight-card primary">
                  <div className="insight-header">
                    <h4>📝 Weekly Mood Summary</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.weeklyMoodSummary || "Analyzing your mood patterns..."}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-header">
                    <h4>🔍 Trigger Pattern Detection</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.triggerPatternDetection || "Identifying mood triggers..."}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-header">
                    <h4>💡 Behavioral Suggestions</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.behavioralSuggestion || "Generating personalized recommendations..."}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-header">
                    <h4>📊 Tag Correlations</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.tagCorrelation || "Analyzing activity-mood relationships..."}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-header">
                    <h4>📈 Predictive Insights</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.predictiveInsights || "Forecasting mood trends..."}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-header">
                    <h4>⚡ Mood Spikes Analysis</h4>
                  </div>
                  <div className="insight-content">
                    <p>{advancedInsights.moodSpikeDetection || "Detecting significant mood changes..."}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Basic Insights */}
        {insights && insights.length > 0 && (
          <div className="basic-insights-section">
            <div className="insights-header">
              <h4>🎯 Quick Recommendations</h4>
            </div>
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div key={index} className="basic-insight-card">
                  <div className="insight-text">
                    {typeof insight === 'string' ? insight : 
                     insight.title ? `${insight.title}: ${insight.description}` : 
                     JSON.stringify(insight)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="export-modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="export-modal" onClick={e => e.stopPropagation()}>
              <div className="export-modal-header">
                <h3 className="export-modal-title">Export Mood Data</h3>
                <button 
                  className="export-modal-close"
                  onClick={() => setShowExportModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="export-options">
                <div className="export-option" onClick={() => exportData('csv')}>
                  <div className="export-option-info">
                    <div className="export-option-icon">📄</div>
                    <div className="export-option-details">
                      <h3>CSV Export</h3>
                      <p>Download raw mood data as CSV file</p>
                    </div>
                  </div>
                  <div className="export-option-arrow">→</div>
                </div>
                <div className="export-option" onClick={() => exportData('pdf')}>
                  <div className="export-option-info">
                    <div className="export-option-icon">📊</div>
                    <div className="export-option-details">
                      <h3>PDF Report</h3>
                      <p>Generate comprehensive PDF report with charts</p>
                    </div>
                  </div>
                  <div className="export-option-arrow">→</div>
                </div>
                <div className="export-option" onClick={() => exportData('html')}>
                  <div className="export-option-info">
                    <div className="export-option-icon">🌐</div>
                    <div className="export-option-details">
                      <h3>HTML Report</h3>
                      <p>Create shareable HTML report</p>
                    </div>
                  </div>
                  <div className="export-option-arrow">→</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodAnalytics;
