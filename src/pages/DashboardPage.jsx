import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import Button from '../components/common/Button';
import SymptomChecker from '../components/features/health/SymptomChecker';
import MoodJournal from '../components/features/mood/MoodJournal';
import MoodInsights from '../components/features/mood/MoodInsights';
import MoodAnalytics from '../components/features/mood/MoodAnalytics';
import { moodJournalAPI } from '../services/moodJournalAPI';
import '../styles/pages/DashboardPage.css';

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [moodEntries, setMoodEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  // Fetch mood entries when component mounts or when user changes
  useEffect(() => {
    const fetchMoodEntries = async () => {
      if (!user) return;
      
      try {
        setLoadingEntries(true);
        setEntriesError(null);
        console.log('📊 Dashboard: Fetching mood entries for analytics...');
        
        const entries = await moodJournalAPI.getMoodEntries({
          limit: 1000, // Get enough entries for analytics
          orderBy: 'date'
        });
        
        console.log('📊 Dashboard: Fetched', entries?.length || 0, 'mood entries');
        setMoodEntries(entries || []);
      } catch (error) {
        console.error('❌ Dashboard: Failed to fetch mood entries:', error);
        let userFriendlyError = 'Failed to load mood data.';
        
        // Provide helpful error messages based on error type
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          userFriendlyError = 'Database tables not found. Please run the database setup script in Supabase.';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          userFriendlyError = 'Database not properly configured. Please check your Supabase setup.';
        } else if (error.message.includes('authentication')) {
          userFriendlyError = 'Authentication error. Please sign out and sign in again.';
        }
        
        setEntriesError(userFriendlyError);
        setMoodEntries([]);
      } finally {
        setLoadingEntries(false);
      }
    };

    fetchMoodEntries();
  }, [user]);

  // Refresh entries when switching to mood analytics
  const handleSectionChange = async (section) => {
    setActiveSection(section);
    
    // Refresh mood entries when accessing analytics
    if (section === 'mood-analytics' && user) {
      try {
        console.log('📊 Dashboard: Refreshing mood entries for analytics...');
        const entries = await moodJournalAPI.getMoodEntries({
          limit: 1000,
          orderBy: 'date'
        });
        setMoodEntries(entries || []);
      } catch (error) {
        console.error('❌ Dashboard: Failed to refresh mood entries:', error);
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="logo-text">
                  <h1>AI Healthcare</h1>
                  <span>Advanced Medical Intelligence</span>
                </div>
              </div>
            </div>
            
            <div className="header-right">
              {user && (
                <div className="user-section">
                  <div className="user-info">
                    <span className="greeting">Welcome back,</span>
                    <span className="username">{user.user_metadata?.full_name || user.email.split('@')[0]}</span>
                  </div>
                  <Button onClick={signOut} variant="outline" className="sign-out-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          {activeSection === 'overview' && (
            <>
              <div className="dashboard-hero">
                <div className="hero-content">
                  <h2>🏥 AI Healthcare Dashboard</h2>
                  <p>Advanced medical AI with professional analysis and comprehensive reporting</p>
                </div>
              </div>
              
              <div className="features-grid">
                <div 
                  className="feature-card primary"
                  onClick={() => handleSectionChange('symptom-checker')}
                >
                  <div className="feature-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>🩺 AI Symptom Checker</h3>
                    <p>Advanced symptom analysis with Groq AI integration</p>
                    <div className="feature-badges">
                      <span className="badge">🧠 Groq AI</span>
                      <span className="badge">🌍 Multi-Language</span>
                      <span className="badge">📄 PDF Reports</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="feature-card secondary"
                  onClick={() => handleSectionChange('mood-journal')}
                >
                  <div className="feature-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>� Mood Journal</h3>
                    <p>Track your daily mood and emotions with insights</p>
                    <div className="feature-badges">
                      <span className="badge">📝 Daily Tracking</span>
                      <span className="badge">📊 Analytics</span>
                      <span className="badge">🎯 Insights</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="feature-card tertiary"
                  onClick={() => handleSectionChange('mood-analytics')}
                >
                  <div className="feature-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>📊 Mood Analytics</h3>
                    <p>Comprehensive mood pattern analysis and trends</p>
                    <div className="feature-badges">
                      <span className="badge">📈 Trends</span>
                      <span className="badge">🎨 Charts</span>
                      <span className="badge">🔍 Patterns</span>
                    </div>
                  </div>
                </div>

                <div className="feature-card accent">
                  <div className="feature-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="9,11 12,14 15,11" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="2" x2="12" y2="14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="feature-content">
                    <h3>� Health Reports</h3>
                    <p>Professional health reports and summaries</p>
                    <div className="coming-soon">Coming Soon</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'symptom-checker' && (
            <div className="section-content">
              <div className="section-header">
                <Button 
                  onClick={() => handleSectionChange('overview')} 
                  variant="outline"
                  className="back-btn"
                >
                  ← Back to Dashboard
                </Button>
                <h2>🩺 AI Symptom Checker</h2>
              </div>
              <div className="symptom-checker-container">
                <SymptomChecker />
              </div>
            </div>
          )}

          {activeSection === 'mood-journal' && (
            <div className="section-content">
              <div className="section-header">
                <Button 
                  onClick={() => handleSectionChange('overview')} 
                  variant="outline"
                  className="back-btn"
                >
                  ← Back to Dashboard
                </Button>
                <h2>😊 Mood Journal</h2>
              </div>
              <div className="mood-journal-container">
                <MoodJournal />
              </div>
            </div>
          )}

          {activeSection === 'mood-analytics' && (
            <div className="section-content">
              <div className="section-header">
                <Button 
                  onClick={() => handleSectionChange('overview')} 
                  variant="outline"
                  className="back-btn"
                >
                  ← Back to Dashboard
                </Button>
                <h2>📊 Mood Analytics</h2>
                {loadingEntries && (
                  <div className="loading-indicator">
                    <span>Loading mood data...</span>
                  </div>
                )}
                {entriesError && (
                  <div className="error-indicator">
                    <span>Error loading mood data: {entriesError}</span>
                  </div>
                )}
              </div>
              <div className="mood-analytics-container">
                <MoodAnalytics entries={moodEntries} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
