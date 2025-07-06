import React, { useMemo, useState, useEffect } from 'react';
import { generateMoodRecommendations, analyzeBestAndChallengingDay } from '../../../lib/aiService';

const MoodInsights = ({ entries }) => {
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAIInsights, setLoadingAIInsights] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState('');

  const insights = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        averageMood: 0,
        totalEntries: 0,
        moodTrend: 'neutral',
        commonEmotions: [],
        commonActivities: [],
        weeklyData: [],
        monthlyData: []
      };
    }

    // Calculate average mood
    const averageMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
    
    // Get mood trend (last 7 days vs previous 7 days)
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last7Days = sortedEntries.slice(0, 7);
    const previous7Days = sortedEntries.slice(7, 14);
    
    const recent7Average = last7Days.length > 0 ? 
      last7Days.reduce((sum, entry) => sum + entry.mood, 0) / last7Days.length : 0;
    const previous7Average = previous7Days.length > 0 ? 
      previous7Days.reduce((sum, entry) => sum + entry.mood, 0) / previous7Days.length : recent7Average;
    
    let moodTrend = 'neutral';
    if (recent7Average > previous7Average + 0.2) moodTrend = 'improving';
    else if (recent7Average < previous7Average - 0.2) moodTrend = 'declining';
    
    // Count emotions and activities
    const emotionCounts = {};
    const activityCounts = {};
    
    entries.forEach(entry => {
      entry.emotions?.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      entry.activities?.forEach(activity => {
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
    });
    
    const commonEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
      
    const commonActivities = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));

    // Weekly data for the last 4 weeks
    const weeklyData = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      const weekAverage = weekEntries.length > 0 ? 
        weekEntries.reduce((sum, entry) => sum + entry.mood, 0) / weekEntries.length : 0;
      
      weeklyData.push({
        week: `Week ${4 - i}`,
        average: Math.round(weekAverage * 10) / 10,
        entries: weekEntries.length
      });
    }

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      totalEntries: entries.length,
      moodTrend,
      commonEmotions,
      commonActivities,
      weeklyData,
      recent7Average: Math.round(recent7Average * 10) / 10,
      previous7Average: Math.round(previous7Average * 10) / 10,
      recentEntries: sortedEntries.slice(0, 10), // Include recent entries for AI analysis
      allEntries: entries // Include all entries for comprehensive analysis
    };
  }, [entries]);

  const getMoodColor = (moodValue) => {
    if (moodValue >= 4.5) return '#16a34a';
    if (moodValue >= 3.5) return '#22c55e';
    if (moodValue >= 2.5) return '#eab308';
    if (moodValue >= 1.5) return '#f97316';
    return '#ef4444';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'improving': return 'Your mood has been improving';
      case 'declining': return 'Your mood has been declining';
      default: return 'Your mood has been stable';
    }
  };

  // Generate AI recommendations when insights change
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!entries || entries.length === 0) {
        setAiRecommendations([]);
        return;
      }

      setLoadingRecommendations(true);
      setRecommendationError('');

      try {
        console.log('🧠 Generating AI mood recommendations...');
        const recommendations = await generateMoodRecommendations(insights);
        setAiRecommendations(recommendations);
        console.log(`✅ Generated ${recommendations.length} mood recommendations`);
      } catch (error) {
        console.error('❌ Failed to generate mood recommendations:', error);
        setRecommendationError(error.message);
        
        // Don't use fallback recommendations - show error instead
        setAiRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    generateRecommendations();
  }, [insights]);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!entries || entries.length === 0) {
        setAiInsights(null);
        return;
      }
      setLoadingAIInsights(true);
      setAiInsightsError('');
      try {
        // Prepare entries for Groq (date, mood, emoji, notes)
        const aiEntries = entries.map(e => ({
          date: e.date || e.timestamp || '',
          mood: e.mood,
          emoji: e.emoji || '',
          notes: e.notes || ''
        }));
        const result = await analyzeBestAndChallengingDay(aiEntries);
        setAiInsights(result);
      } catch (err) {
        setAiInsightsError(err.message);
        setAiInsights(null);
      } finally {
        setLoadingAIInsights(false);
      }
    };
    fetchAIInsights();
  }, [entries]);

  if (insights.totalEntries === 0) {
    return (
      <div className="mood-insights">
        <div className="no-data-message">
          <h3>No Mood Data Yet</h3>
          <p>Start tracking your mood daily to see personalized insights and patterns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mood-insights">
      <h3 className="insights-title">Your Mood Insights</h3>
      {loadingAIInsights ? (
        <div className="ai-loading">Analyzing your mood with AI...</div>
      ) : aiInsightsError ? (
        <div className="ai-error">AI Analysis Error: {aiInsightsError}</div>
      ) : aiInsights ? (
        <div className="ai-insights">
          <div className="insight-card">
            <div className="insight-header">
              <h4>Best Day</h4>
              <span className="insight-icon">{aiInsights.bestDay.emoji}</span>
            </div>
            <div className="insight-value">{aiInsights.bestDay.date}</div>
            <div className="insight-detail">{aiInsights.bestDay.reason}</div>
          </div>
          <div className="insight-card">
            <div className="insight-header">
              <h4>Challenging Day</h4>
              <span className="insight-icon">{aiInsights.challengingDay.emoji}</span>
            </div>
            <div className="insight-value">{aiInsights.challengingDay.date}</div>
            <div className="insight-detail">{aiInsights.challengingDay.reason}</div>
          </div>
        </div>
      ) : null}
      
      {/* Overview Stats */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-header">
            <h4>Average Mood</h4>
            <span className="insight-icon">📊</span>
          </div>
          <div className="insight-value" style={{ color: getMoodColor(insights.averageMood) }}>
            {insights.averageMood}/5
          </div>
          <div className="insight-detail">
            Based on {insights.totalEntries} entries
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <h4>Recent Trend</h4>
            <span className="insight-icon">{getTrendIcon(insights.moodTrend)}</span>
          </div>
          <div className="insight-value">
            {insights.recent7Average}/5
          </div>
          <div className="insight-detail">
            {getTrendText(insights.moodTrend)} over the last week
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-header">
            <h4>Total Entries</h4>
            <span className="insight-icon">📅</span>
          </div>
          <div className="insight-value">
            {insights.totalEntries}
          </div>
          <div className="insight-detail">
            Keep up the great tracking!
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="weekly-trend-section">
        <h4>Weekly Mood Trend</h4>
        <div className="weekly-chart">
          {insights.weeklyData.map((week, index) => (
            <div key={index} className="week-bar">
              <div className="week-label">{week.week}</div>
              <div className="bar-container">
                <div 
                  className="mood-bar"
                  style={{ 
                    height: `${(week.average / 5) * 100}%`,
                    backgroundColor: getMoodColor(week.average)
                  }}
                ></div>
              </div>
              <div className="week-value">{week.average}</div>
              <div className="week-entries">{week.entries} entries</div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Emotions */}
      {insights.commonEmotions.length > 0 && (
        <div className="emotions-section">
          <h4>Most Common Emotions</h4>
          <div className="emotion-list">
            {insights.commonEmotions.map(({ emotion, count }, index) => (
              <div key={emotion} className="emotion-item">
                <span className="emotion-rank">#{index + 1}</span>
                <span className="emotion-name">{emotion}</span>
                <span className="emotion-count">{count} times</span>
                <div className="emotion-bar">
                  <div 
                    className="emotion-progress"
                    style={{ 
                      width: `${(count / insights.commonEmotions[0].count) * 100}%`,
                      backgroundColor: '#667eea'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Activities */}
      {insights.commonActivities.length > 0 && (
        <div className="activities-section">
          <h4>Activities That Influence Your Mood</h4>
          <div className="activity-list">
            {insights.commonActivities.map(({ activity, count }, index) => (
              <div key={activity} className="activity-item">
                <span className="activity-rank">#{index + 1}</span>
                <span className="activity-name">{activity}</span>
                <span className="activity-count">{count} times</span>
                <div className="activity-bar">
                  <div 
                    className="activity-progress"
                    style={{ 
                      width: `${(count / insights.commonActivities[0].count) * 100}%`,
                      backgroundColor: '#10b981'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI-Powered Recommendations */}
      <div className="recommendations-section">
        <div className="recommendations-header">
          <h4>🤖 AI-Powered Personalized Recommendations</h4>
          <div className="powered-by-groq">
            <span className="groq-badge">⚡ Powered by Groq</span>
          </div>
          {loadingRecommendations && (
            <div className="loading-indicator">
              <span className="spinner">⏳</span>
              <span>Generating personalized recommendations...</span>
            </div>
          )}
          {recommendationError && (
            <div className="error-indicator">
              <span className="error-icon">⚠️</span>
              <span>API Configuration Required: {recommendationError.split('\n')[0]}</span>
            </div>
          )}
        </div>
        
        <div className="recommendations">
          {aiRecommendations.length > 0 ? (
            aiRecommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.priority}-priority`}>
                <div className="rec-header">
                  <span className="rec-icon">{rec.icon}</span>
                  <h5 className="rec-title">{rec.title}</h5>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                </div>
                <p className="rec-description">{rec.description}</p>
                <div className="rec-footer">
                  <span className="rec-category">{rec.category}</span>
                  {rec.relevantConcerns && rec.relevantConcerns.length > 0 && (
                    <div className="relevant-concerns">
                      <span className="concerns-label">Addresses:</span>
                      {rec.relevantConcerns.map((concern, idx) => (
                        <span key={idx} className="concern-tag">{concern}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : !loadingRecommendations && (
            <div className="no-recommendations">
              {recommendationError ? (
                <>
                  <span className="info-icon">🔧</span>
                  <p>
                    <strong>API Configuration Required</strong><br/>
                    Please configure your Groq API key to get personalized AI recommendations.<br/>
                    <small>Get your free API key at: <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer">Groq Console</a></small>
                  </p>
                </>
              ) : (
                <>
                  <span className="info-icon">📝</span>
                  <p>Track more mood entries to get personalized AI recommendations!</p>
                </>
              )}
            </div>
          )}
        </div>
        
        {aiRecommendations.length > 0 && (
          <div className="ai-disclaimer">
            <span className="disclaimer-icon">ℹ️</span>
            <p>
              <strong>🤖 AI-Generated Recommendations powered by Groq:</strong> These suggestions are generated by Groq's advanced AI based on your mood patterns. 
              They are for informational purposes only and don't replace professional mental health advice. 
              Always consult with a healthcare provider for serious concerns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodInsights;
