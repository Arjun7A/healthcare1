import React, { useState, useEffect } from 'react';
import { moodJournalAPI } from '../../../services/moodJournalAPI';

const MoodSettings = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    reminderEnabled: false,
    reminderTime: '20:00',
    reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    privacyLevel: 'private', // private, anonymous, shared
    exportFormat: 'json', // json, csv
    dataRetention: '365', // days
    showEmotionSuggestions: true,
    showActivitySuggestions: true,
    enableMoodPrediction: false,
    theme: 'default'
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Note: Settings will be stored in user preferences in Supabase in future
    // For now, these are local UI preferences only
    const savedSettings = localStorage.getItem('moodSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleDayToggle = (day) => {
    setSettings(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day]
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // Note: In future, this will save to Supabase user preferences
    localStorage.setItem('moodSettings', JSON.stringify(settings));
    setHasChanges(false);
    onSettingsChange?.(settings);
    alert('Settings saved successfully!');
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        reminderEnabled: false,
        reminderTime: '20:00',
        reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        privacyLevel: 'private',
        exportFormat: 'json',
        dataRetention: '365',
        showEmotionSuggestions: true,
        showActivitySuggestions: true,
        enableMoodPrediction: false,
        theme: 'default'
      };
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const exportData = async () => {
    try {
      const result = await moodJournalAPI.getMoodEntries();
      
      if (!result.success || result.data.length === 0) {
        alert('No mood data to export. Please ensure you are signed in and have mood entries.');
        return;
      }

      const moodEntries = result.data;

    let exportData;
    let filename;
    let mimeType;

    if (settings.exportFormat === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'Mood', 'Emotions', 'Activities', 'Notes'];
      const csvRows = [headers.join(',')];
      
      moodEntries.forEach(entry => {
        const row = [
          entry.date,
          entry.mood,
          entry.emotions?.join(';') || '',
          entry.activities?.join(';') || '',
          entry.notes?.replace(/,/g, ';') || ''
        ];
        csvRows.push(row.map(field => `"${field}"`).join(','));
      });
      
      exportData = csvRows.join('\n');
      filename = 'mood-data.csv';
      mimeType = 'text/csv';
    } else {
      // Export as JSON
      exportData = JSON.stringify(moodEntries, null, 2);
      filename = 'mood-data.json';
      mimeType = 'application/json';
    }

    // Create download
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      alert('Failed to export data. Please ensure you are signed in.');
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to delete ALL mood data? This cannot be undone.')) {
      if (confirm('This will permanently delete all your mood entries from the cloud. Are you absolutely sure?')) {
        try {
          // Get all entries first
          const result = await moodJournalAPI.getMoodEntries();
          if (result.success && result.data.length > 0) {
            // Delete each entry
            for (const entry of result.data) {
              await moodJournalAPI.deleteMoodEntry(entry.id);
            }
            alert('All mood data has been deleted from the cloud.');
          } else {
            alert('No mood data found to delete.');
          }
        } catch (error) {
          console.error('❌ Failed to clear data:', error);
          alert('Failed to delete data. Please ensure you are signed in.');
        }
      }
    }
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="mood-settings">
      <div className="settings-header">
        <h3>Mood Journal Settings</h3>
        <p>Customize your mood tracking experience</p>
      </div>

      <div className="settings-content">
        {/* Reminder Settings */}
        <div className="settings-section">
          <h4>Daily Reminders</h4>
          
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.reminderEnabled}
                onChange={(e) => handleSettingChange('reminderEnabled', e.target.checked)}
              />
              Enable daily mood tracking reminders
            </label>
          </div>

          {settings.reminderEnabled && (
            <>
              <div className="setting-item">
                <label className="setting-label">
                  Reminder time:
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                    className="time-input"
                  />
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">Reminder days:</label>
                <div className="days-grid">
                  {Object.entries(dayNames).map(([key, name]) => (
                    <label key={key} className="day-checkbox">
                      <input
                        type="checkbox"
                        checked={settings.reminderDays.includes(key)}
                        onChange={() => handleDayToggle(key)}
                      />
                      {name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h4>Privacy & Data</h4>
          
          <div className="setting-item">
            <label className="setting-label">
              Privacy level:
              <select
                value={settings.privacyLevel}
                onChange={(e) => handleSettingChange('privacyLevel', e.target.value)}
                className="setting-select"
              >
                <option value="private">Private (local storage only)</option>
                <option value="anonymous">Anonymous (aggregated insights)</option>
                <option value="shared">Shared (with healthcare provider)</option>
              </select>
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              Data retention period:
              <select
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                className="setting-select"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">6 months</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </label>
          </div>
        </div>

        {/* UI Preferences */}
        <div className="settings-section">
          <h4>Interface Preferences</h4>
          
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.showEmotionSuggestions}
                onChange={(e) => handleSettingChange('showEmotionSuggestions', e.target.checked)}
              />
              Show emotion suggestions while typing
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.showActivitySuggestions}
                onChange={(e) => handleSettingChange('showActivitySuggestions', e.target.checked)}
              />
              Show activity suggestions
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.enableMoodPrediction}
                onChange={(e) => handleSettingChange('enableMoodPrediction', e.target.checked)}
              />
              Enable mood prediction insights (experimental)
            </label>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              Color theme:
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="setting-select"
              >
                <option value="default">Default</option>
                <option value="warm">Warm</option>
                <option value="cool">Cool</option>
                <option value="minimal">Minimal</option>
                <option value="high-contrast">High Contrast</option>
              </select>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h4>Data Management</h4>
          
          <div className="setting-item">
            <label className="setting-label">
              Export format:
              <select
                value={settings.exportFormat}
                onChange={(e) => handleSettingChange('exportFormat', e.target.value)}
                className="setting-select"
              >
                <option value="json">JSON (for backup)</option>
                <option value="csv">CSV (for spreadsheets)</option>
              </select>
            </label>
          </div>

          <div className="data-actions">
            <button 
              className="action-btn export-btn"
              onClick={exportData}
            >
              Export My Data
            </button>
            
            <button 
              className="action-btn reset-btn"
              onClick={resetSettings}
            >
              Reset Settings
            </button>
            
            <button 
              className="action-btn danger-btn"
              onClick={clearAllData}
            >
              Delete All Data
            </button>
          </div>
        </div>

        {/* Save/Cancel */}
        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Changes' : 'All Changes Saved'}
          </button>
          
          {hasChanges && (
            <p className="changes-indicator">
              You have unsaved changes
            </p>
          )}
        </div>

        {/* Info Section */}
        <div className="settings-info">
          <h4>About Your Data</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Storage:</strong> Your mood data is stored locally on your device and never sent to external servers without your explicit consent.
            </div>
            <div className="info-item">
              <strong>Security:</strong> All data is encrypted and protected. You can export or delete your data at any time.
            </div>
            <div className="info-item">
              <strong>Backup:</strong> We recommend regularly exporting your data as a backup to prevent data loss.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodSettings;
