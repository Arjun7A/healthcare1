import React, { useState } from 'react';
import './MoodJournal.css';

const MoodEntryForm = ({ onSubmit, initialData = null }) => {
  const [mood, setMood] = useState(initialData?.mood || 5);
  const [emotions, setEmotions] = useState(initialData?.emotions || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [activities, setActivities] = useState(initialData?.activities || []);
  const [tags, setTags] = useState(initialData?.tags || []);
  const [sleepHours, setSleepHours] = useState(initialData?.sleep_hours || 8);
  const [energyLevel, setEnergyLevel] = useState(initialData?.energy_level || 5);
  const [loading, setLoading] = useState(false);

  const moodOptions = [
    { value: 1, label: 'Very Low', emoji: '😞', color: '#ef4444' },
    { value: 2, label: 'Low', emoji: '😕', color: '#f97316' },
    { value: 3, label: 'Okay', emoji: '😐', color: '#eab308' },
    { value: 4, label: 'Good', emoji: '🙂', color: '#22c55e' },
    { value: 5, label: 'Very Good', emoji: '😊', color: '#16a34a' },
  ];

  const emotionOptions = [
    'Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Tired', 
    'Stressed', 'Grateful', 'Frustrated', 'Content', 'Lonely', 'Confident'
  ];

  const activityOptions = [
    'Exercise', 'Work', 'Social', 'Rest', 'Hobbies', 'Study',
    'Family Time', 'Meditation', 'Reading', 'Outdoor', 'Creative', 'Self-care'
  ];

  const tagOptions = [
    'Work', 'Family', 'Friends', 'Exercise', 'Diet', 'Sleep', 'Stress', 'Relaxation', 'Travel', 'Learning', 'Health', 'Finance', 'Fun', 'Other'
  ];

  const handleEmotionToggle = (emotion) => {
    setEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleActivityToggle = (activity) => {
    setActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleTagToggle = (tag) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const moodEntry = {
      mood,
      emotions,
      notes: notes.trim(),
      activities,
      tags,
      sleep_hours: sleepHours,
      energy_level: energyLevel,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };

    try {
      await onSubmit(moodEntry);
      // Reset form if not editing
      if (!initialData) {
        setMood(5);
        setEmotions([]);
        setNotes('');
        setActivities([]);
        setTags([]);
        setSleepHours(8);
        setEnergyLevel(5);
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedMoodOption = moodOptions.find(option => option.value === mood);

  return (
    <div className="mood-entry-form">
      <h3 className="form-title">
        {initialData ? 'Edit Mood Entry' : 'How are you feeling today?'}
      </h3>

      <form onSubmit={handleSubmit} className="mood-form">
        {/* Mood Scale */}
        <div className="form-group">
          <label className="form-label">Overall Mood</label>
          <div className="mood-scale">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`mood-option ${mood === option.value ? 'selected' : ''}`}
                onClick={() => setMood(option.value)}
                style={{
                  borderColor: mood === option.value ? option.color : '#e5e7eb',
                  backgroundColor: mood === option.value ? `${option.color}20` : 'transparent'
                }}
              >
                <span className="mood-emoji">{option.emoji}</span>
                <span className="mood-label">{option.label}</span>
              </button>
            ))}
          </div>
          
          {selectedMoodOption && (
            <div className="selected-mood-display">
              <span className="selected-emoji">{selectedMoodOption.emoji}</span>
              <span className="selected-text">
                You're feeling <strong>{selectedMoodOption.label.toLowerCase()}</strong> today
              </span>
            </div>
          )}
        </div>

        {/* Emotions */}
        <div className="form-group">
          <label className="form-label">
            What emotions are you experiencing? 
            <span className="optional">(Select all that apply)</span>
          </label>
          <div className="emotion-grid">
            {emotionOptions.map((emotion) => (
              <button
                key={emotion}
                type="button"
                className={`emotion-tag ${emotions.includes(emotion) ? 'selected' : ''}`}
                onClick={() => handleEmotionToggle(emotion)}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="form-group">
          <label className="form-label">
            What activities influenced your mood today?
            <span className="optional">(Optional)</span>
          </label>
          <div className="activity-grid">
            {activityOptions.map((activity) => (
              <button
                key={activity}
                type="button"
                className={`activity-tag ${activities.includes(activity) ? 'selected' : ''}`}
                onClick={() => handleActivityToggle(activity)}
              >
                {activity}
              </button>
            ))}
          </div>
        </div>

        {/* Tags (Triggers) */}
        <div className="form-group">
          <label className="form-label">Tags / Triggers <span className="optional">(optional)</span></label>
          <div className="tags-grid">
            {tagOptions.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-btn${tags.includes(tag) ? ' selected' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                <span className="tag-icon">🏷️</span> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep Hours */}
        <div className="form-group">
          <label className="form-label">Sleep Hours <span className="optional">(last night)</span></label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={e => setSleepHours(Number(e.target.value))}
            className="sleep-input"
            style={{ maxWidth: 120 }}
          />
        </div>

        {/* Energy Level */}
        <div className="form-group">
          <label className="form-label">Energy Level</label>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={e => setEnergyLevel(Number(e.target.value))}
            className="energy-slider"
          />
          <div className="energy-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Additional Notes
            <span className="optional">(Optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you'd like to note about your mood today? Thoughts, events, or reflections..."
            className="mood-notes"
            rows={4}
            maxLength={500}
          />
          <div className="character-count">
            {notes.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="submit-mood-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              {initialData ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            initialData ? 'Update Entry' : 'Save Mood Entry'
          )}
        </button>
      </form>
    </div>
  );
};

export default MoodEntryForm;
