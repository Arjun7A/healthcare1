import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/useAuth';
import MoodEntryForm from './MoodEntryForm';
import MoodInsights from './MoodInsights';
import MoodCalendar from './MoodCalendar';
import EntryRecommendations from './EntryRecommendations';
import './MoodJournal.css';

const MoodJournal = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentView, setCurrentView] = useState('today'); // today, insights, calendar, recommendations, entry-recommendations, edit
  const [todaysEntry, setTodaysEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMoodEntries();
    }
  }, [user]);

  const loadMoodEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading mood entries:', error);
        return;
      }

      // Transform Supabase data to match frontend format
      const transformedEntries = data.map(entry => ({
        id: entry.id,
        mood: entry.mood,
        emotions: entry.emotions || [],
        activities: entry.activities || [],
        notes: entry.notes || '',
        tags: entry.tags || [],
        sleep_hours: entry.sleep_hours ?? null,
        energy_level: entry.energy_level ?? null,
        date: new Date(entry.date).toDateString(),
        timestamp: entry.created_at
      }));
      
      setMoodEntries(transformedEntries);
      
      // Check if there's an entry for today
      const today = new Date().toDateString();
      const todayEntry = transformedEntries.find(entry => entry.date === today);
      setTodaysEntry(todayEntry || null);
      
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMoodEntry = async (moodEntry) => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Prepare data for Supabase
      const supabaseEntry = {
        user_id: user.id,
        date: today,
        mood: moodEntry.mood,
        emotions: moodEntry.emotions,
        activities: moodEntry.activities,
        notes: moodEntry.notes,
        tags: moodEntry.tags,
        sleep_hours: moodEntry.sleep_hours,
        energy_level: moodEntry.energy_level
      };

      // Check if updating existing entry for today
      const existingEntry = moodEntries.find(entry => entry.date === new Date().toDateString());
      
      let result;
      if (existingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('mood_entries')
          .update(supabaseEntry)
          .eq('id', existingEntry.id)
          .eq('user_id', user.id)
          .select();
        result = { data, error };
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from('mood_entries')
          .insert([supabaseEntry])
          .select();
        result = { data, error };
      }

      if (result.error) {
        console.error('Error saving mood entry:', result.error);
        alert('Failed to save mood entry. Please try again.');
        return;
      }

      // Reload entries to get the latest data
      await loadMoodEntries();
      
      alert(existingEntry ? 'Mood entry updated!' : 'Mood entry saved!');
      
    } catch (error) {
      console.error('Error saving mood entry:', error);
      alert('Failed to save mood entry. Please try again.');
    }
  };

  const deleteMoodEntry = async (entryId) => {
    if (!user || !confirm('Are you sure you want to delete this mood entry?')) return;
    
    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting mood entry:', error);
        alert('Failed to delete mood entry. Please try again.');
        return;
      }

      // Reload entries to get the latest data
      await loadMoodEntries();
      alert('Mood entry deleted.');
      
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      alert('Failed to delete mood entry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="mood-journal-loading">
        <div className="loading-spinner"></div>
        <p>Loading your mood journal...</p>
      </div>
    );
  }

  return (
    <div className="mood-journal">
      <div className="mood-journal-header">
        <h2 className="page-title">Mood Journal</h2>
        <p className="page-description">
          Track your daily mood and emotions to better understand your mental health patterns.
        </p>
        
        <div className="view-tabs">
          <button 
            className={`tab-btn ${currentView === 'today' ? 'active' : ''}`}
            onClick={() => setCurrentView('today')}
          >
            Today's Entry
          </button>
          <button 
            className={`tab-btn ${currentView === 'insights' ? 'active' : ''}`}
            onClick={() => setCurrentView('insights')}
          >
            Insights
          </button>
          <button 
            className={`tab-btn ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="mood-journal-content">
        {currentView === 'today' && (
          <div className="today-view">
            {todaysEntry ? (
              <div className="existing-entry-section">
                <div className="entry-summary">
                  <h3>Today's Mood Entry</h3>
                  <div className="mood-summary">
                    <span className="mood-emoji">
                      {todaysEntry.mood === 1 ? '😞' : 
                       todaysEntry.mood === 2 ? '😕' : 
                       todaysEntry.mood === 3 ? '😐' : 
                       todaysEntry.mood === 4 ? '🙂' : '😊'}
                    </span>
                    <span className="mood-text">
                      Feeling {
                        todaysEntry.mood === 1 ? 'Very Low' : 
                        todaysEntry.mood === 2 ? 'Low' : 
                        todaysEntry.mood === 3 ? 'Okay' : 
                        todaysEntry.mood === 4 ? 'Good' : 'Very Good'
                      }
                    </span>
                  </div>
                  
                  {todaysEntry.emotions.length > 0 && (
                    <div className="emotions-summary">
                      <strong>Emotions:</strong> {todaysEntry.emotions.join(', ')}
                    </div>
                  )}
                  
                  {todaysEntry.activities.length > 0 && (
                    <div className="activities-summary">
                      <strong>Activities:</strong> {todaysEntry.activities.join(', ')}
                    </div>
                  )}
                  
                  {todaysEntry.notes && todaysEntry.notes.trim() && (
                    <div className="notes-summary">
                      <strong>Notes:</strong> 
                      <div className="notes-text">{todaysEntry.notes}</div>
                    </div>
                  )}
                  
                  {todaysEntry.tags && todaysEntry.tags.length > 0 && (
                    <div className="tags-summary">
                      <strong>Tags:</strong> {todaysEntry.tags.join(', ')}
                    </div>
                  )}
                  {typeof todaysEntry.sleep_hours === 'number' && (
                    <div className="sleep-summary">
                      <strong>Sleep:</strong> {todaysEntry.sleep_hours} hours
                    </div>
                  )}
                  {typeof todaysEntry.energy_level === 'number' && (
                    <div className="energy-summary">
                      <strong>Energy Level:</strong> <span style={{ color: '#fbbf24', fontWeight: 600 }}>{todaysEntry.energy_level}/10</span>
                    </div>
                  )}
                  
                  <div className="entry-timestamp">
                    <small>Recorded at {new Date(todaysEntry.timestamp).toLocaleTimeString()}</small>
                  </div>
                  
                  <div className="entry-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => setCurrentView('edit')}
                      title="Edit today's mood entry"
                    >
                      ✏️ Edit Entry
                    </button>
                    <button 
                      className="recommendations-btn"
                      onClick={() => setCurrentView('recommendations')}
                      title="Get AI-powered recommendations for today's mood"
                    >
                      🧠 Get Recommendations
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete today\'s mood entry? This action cannot be undone.')) {
                          deleteMoodEntry(todaysEntry.id);
                        }
                      }}
                      title="Delete today's mood entry"
                    >
                      🗑️ Delete Entry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <MoodEntryForm onSubmit={saveMoodEntry} />
            )}
            
            {/* Recent Mood History */}
            {moodEntries.length > 1 && (
              <div className="recent-history">
                <h3>Recent Mood History</h3>
                <div className="history-entries">
                  {moodEntries
                    .filter(entry => entry.date !== new Date().toDateString()) // Exclude today's entry
                    .slice(0, 5) // Show last 5 entries
                    .map((entry) => (
                      <div key={entry.id} className="history-entry">
                        <div className="entry-header">
                          <div className="entry-date">
                            {new Date(entry.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="entry-mood">
                            <span className="mood-emoji">
                              {entry.mood === 1 ? '😞' : 
                               entry.mood === 2 ? '😕' : 
                               entry.mood === 3 ? '😐' : 
                               entry.mood === 4 ? '🙂' : '😊'}
                            </span>
                            <span className="mood-label">
                              {entry.mood === 1 ? 'Very Low' : 
                               entry.mood === 2 ? 'Low' : 
                               entry.mood === 3 ? 'Okay' : 
                               entry.mood === 4 ? 'Good' : 'Very Good'}
                            </span>
                          </div>
                        </div>
                        
                        {entry.emotions.length > 0 && (
                          <div className="entry-emotions">
                            <strong>Emotions:</strong> {entry.emotions.join(', ')}
                          </div>
                        )}
                        
                        {entry.activities.length > 0 && (
                          <div className="entry-activities">
                            <strong>Activities:</strong> {entry.activities.join(', ')}
                          </div>
                        )}
                        
                        {entry.notes && entry.notes.trim() && (
                          <div className="entry-notes">
                            <strong>Notes:</strong>
                            <div className="notes-text">{entry.notes}</div>
                          </div>
                        )}
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="entry-tags">
                            <strong>Tags:</strong> {entry.tags.join(', ')}
                          </div>
                        )}
                        {typeof entry.sleep_hours === 'number' && (
                          <div className="entry-sleep">
                            <strong>Sleep:</strong> {entry.sleep_hours} hours
                          </div>
                        )}
                        {typeof entry.energy_level === 'number' && (
                          <div className="entry-energy">
                            <strong>Energy Level:</strong> <span style={{ color: '#fbbf24', fontWeight: 600 }}>{entry.energy_level}/10</span>
                          </div>
                        )}
                        
                        <div className="entry-actions">
                          <button 
                            className="recommendations-btn small"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setCurrentView('entry-recommendations');
                            }}
                            title="Get AI-powered recommendations for this mood entry"
                          >
                            🧠 Get Recommendations
                          </button>
                          <button 
                            className="delete-btn small"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the mood entry from ${new Date(entry.date).toLocaleDateString()}? This action cannot be undone.`)) {
                                deleteMoodEntry(entry.id);
                              }
                            }}
                            title="Delete this mood entry"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        
                        <div className="entry-timestamp">
                          <small>Recorded at {new Date(entry.timestamp).toLocaleTimeString()}</small>
                        </div>
                      </div>
                    ))}
                </div>
                
                {moodEntries.filter(entry => entry.date !== new Date().toDateString()).length > 5 && (
                  <div className="view-more">
                    <button 
                      className="view-more-btn"
                      onClick={() => setCurrentView('calendar')}
                    >
                      View All Entries in Calendar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'recommendations' && todaysEntry && (
          <EntryRecommendations 
            entry={todaysEntry}
            onBack={() => setCurrentView('today')}
          />
        )}

        {currentView === 'entry-recommendations' && selectedEntry && (
          <EntryRecommendations 
            entry={selectedEntry}
            onBack={() => {
              setSelectedEntry(null);
              setCurrentView('today');
            }}
          />
        )}

        {currentView === 'edit' && todaysEntry && (
          <div className="edit-view">
            <MoodEntryForm 
              onSubmit={(updatedEntry) => {
                saveMoodEntry(updatedEntry);
                setCurrentView('today');
              }} 
              initialData={todaysEntry}
            />
            <button 
              className="cancel-edit-btn"
              onClick={() => setCurrentView('today')}
            >
              Cancel Edit
            </button>
          </div>
        )}

        {currentView === 'insights' && (
          <MoodInsights entries={moodEntries} />
        )}

        {currentView === 'calendar' && (
          <MoodCalendar 
            entries={moodEntries} 
            onDateSelect={(entry) => {
              // Could implement viewing specific day's entry
              console.log('Selected entry:', entry);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MoodJournal;
