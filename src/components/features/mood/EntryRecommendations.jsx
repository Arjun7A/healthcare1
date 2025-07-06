import React, { useState, useEffect } from 'react';
import { generateMoodRecommendations } from '../../../lib/aiService';
import './MoodJournal.css';

const EntryRecommendations = ({ entry, onBack }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (entry) {
      generateRecommendations();
    }
  }, [entry]);

  const generateRecommendations = async () => {
    if (!entry) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert single entry to the format expected by generateMoodRecommendations
      const moodData = {
        averageMood: entry.mood,
        moodTrend: 'neutral', // Single entry, so no trend
        totalEntries: 1,
        commonEmotions: entry.emotions.map(emotion => ({ emotion, count: 1 })),
        commonActivities: entry.activities.map(activity => ({ activity, count: 1 })),
        recentEntries: [entry],
        recentTexts: entry.notes || 'No additional notes provided.',
        recent7Average: entry.mood,
        previous7Average: entry.mood
      };

      console.log('🧠 Generating recommendations for individual entry:', entry);
      const result = await generateMoodRecommendations(moodData);
      
      if (result && result.length > 0) {
        setRecommendations(result);
      } else {
        setError('No recommendations could be generated for this entry.');
      }
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      
      // Provide more specific error messages
      if (error.message.includes('API key') || error.message.includes('Invalid API Key')) {
        setError('Groq API key not configured properly. Please check your API key in the environment settings.');
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        setError('Groq API rate limit exceeded. Please wait a moment and try again. You have 14,400 free requests per day.');
      } else if (error.message.includes('Insufficient recommendations')) {
        setError('AI generated insufficient recommendations. This might be due to limited input data. Please try again or add more details to your mood entry.');
      } else {
        setError(error.message || 'Failed to generate recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const retryGeneration = () => {
    generateRecommendations();
  };

  if (loading) {
    return (
      <div className="entry-recommendations">
        <div className="recommendations-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Journal
          </button>
          <h3>AI Recommendations</h3>
        </div>
        
        <div className="entry-summary">
          <h4>Entry from {new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h4>
          <div className="mood-summary">
            <span className="mood-emoji">
              {entry.mood === 1 ? '😞' : 
               entry.mood === 2 ? '😕' : 
               entry.mood === 3 ? '😐' : 
               entry.mood === 4 ? '🙂' : '😊'}
            </span>
            <span className="mood-text">
              Feeling {
                entry.mood === 1 ? 'Very Low' : 
                entry.mood === 2 ? 'Low' : 
                entry.mood === 3 ? 'Okay' : 
                entry.mood === 4 ? 'Good' : 'Very Good'
              }
            </span>
          </div>
        </div>

        <div className="recommendations-loading">
          <div className="loading-spinner"></div>
          <p>🧠 AI is analyzing your mood entry and generating personalized recommendations...</p>
          <small>This may take a few moments</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-recommendations">
        <div className="recommendations-header">
          <button className="back-btn" onClick={onBack}>
            ← Back to Journal
          </button>
          <h3>AI Recommendations</h3>
        </div>
        
        <div className="entry-summary">
          <h4>Entry from {new Date(entry.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h4>
        </div>

        <div className="recommendations-error">
          <div className="error-icon">⚠️</div>
          <h4>Unable to Generate Recommendations</h4>
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-btn" onClick={retryGeneration}>
              🔄 Try Again
            </button>
            <button className="back-btn secondary" onClick={onBack}>
              Back to Journal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-recommendations">
      <div className="recommendations-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Journal
        </button>
        <h3>AI Recommendations</h3>
      </div>
      
      <div className="entry-summary">
        <h4>Recommendations for {new Date(entry.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h4>
        
        <div className="mood-summary">
          <span className="mood-emoji">
            {entry.mood === 1 ? '😞' : 
             entry.mood === 2 ? '😕' : 
             entry.mood === 3 ? '😐' : 
             entry.mood === 4 ? '🙂' : '😊'}
          </span>
          <span className="mood-text">
            You were feeling {
              entry.mood === 1 ? 'Very Low' : 
              entry.mood === 2 ? 'Low' : 
              entry.mood === 3 ? 'Okay' : 
              entry.mood === 4 ? 'Good' : 'Very Good'
            }
          </span>
        </div>

        {entry.emotions.length > 0 && (
          <div className="emotions-summary">
            <strong>Emotions:</strong> {entry.emotions.join(', ')}
          </div>
        )}
        
        {entry.activities.length > 0 && (
          <div className="activities-summary">
            <strong>Activities:</strong> {entry.activities.join(', ')}
          </div>
        )}
        
        {entry.notes && entry.notes.trim() && (
          <div className="notes-summary">
            <strong>Notes:</strong>
            <div className="notes-text">{entry.notes}</div>
          </div>
        )}
      </div>

      <div className="recommendations-content">
        <div className="recommendations-intro">
          <h4>🧠 Personalized AI Recommendations</h4>
          <p>Based on your mood, emotions, and activities from this entry, here are some personalized suggestions to support your wellbeing:</p>
        </div>

        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card priority-${rec.priority}`}>
              <div className="recommendation-header">
                <span className="recommendation-icon">{rec.icon}</span>
                <div className="recommendation-meta">
                  <h5 className="recommendation-title">{rec.title}</h5>
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority} priority
                  </span>
                </div>
              </div>
              
              <p className="recommendation-description">
                {rec.description}
              </p>
              
              <div className="recommendation-category">
                <span className="category-tag">{rec.category}</span>
              </div>

              {rec.relevantConcerns && rec.relevantConcerns.length > 0 && (
                <div className="relevant-concerns">
                  <small><strong>Addresses:</strong> {rec.relevantConcerns.join(', ')}</small>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="recommendations-footer">
          <div className="disclaimer">
            <p><strong>Note:</strong> These are AI-generated suggestions for general wellbeing. For persistent mental health concerns, please consult with a healthcare professional.</p>
          </div>
          
          <div className="footer-actions">
            <button className="retry-btn" onClick={retryGeneration}>
              🔄 Generate New Recommendations
            </button>
            <button className="back-btn secondary" onClick={onBack}>
              Back to Journal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryRecommendations;
