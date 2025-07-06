import React, { useState, useEffect } from 'react';

const MoodFilters = ({ entries, onFiltersChange, isOpen, onToggle }) => {
  const [filters, setFilters] = useState({
    moodRange: { min: 1, max: 5 },
    selectedTags: [],
    selectedEmotions: [],
    dateRange: { start: null, end: null },
    hasNotes: 'all'
  });

  // Extract unique tags and emotions from entries
  const allTags = [...new Set(entries?.flatMap(entry => entry.activities || []) || [])];
  const allEmotions = [...new Set(entries?.flatMap(entry => entry.emotions || []) || [])];

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTagToggle = (tag) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    handleFilterChange('selectedTags', newTags);
  };

  const handleEmotionToggle = (emotion) => {
    const newEmotions = filters.selectedEmotions.includes(emotion)
      ? filters.selectedEmotions.filter(e => e !== emotion)
      : [...filters.selectedEmotions, emotion];
    handleFilterChange('selectedEmotions', newEmotions);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      moodRange: { min: 1, max: 5 },
      selectedTags: [],
      selectedEmotions: [],
      dateRange: { start: null, end: null },
      hasNotes: 'all'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.moodRange.min > 1 || filters.moodRange.max < 5) count++;
    if (filters.selectedTags.length > 0) count++;
    if (filters.selectedEmotions.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.hasNotes !== 'all') count++;
    return count;
  };

  return (
    <div className={`mood-filters ${isOpen ? 'open' : ''}`}>
      <div className="filters-header">
        <button className="filters-toggle" onClick={onToggle}>
          <span>🔍</span>
          <span>Advanced Filters</span>
          {getActiveFiltersCount() > 0 && (
            <span className="filter-badge">{getActiveFiltersCount()}</span>
          )}
        </button>
        {getActiveFiltersCount() > 0 && (
          <button className="clear-filters" onClick={clearAllFilters}>
            Clear All
          </button>
        )}
      </div>

      {isOpen && (
        <div className="filters-content">
          {/* Mood Range Filter */}
          <div className="filter-section">
            <h4>Mood Range</h4>
            <div className="mood-range-slider">
              <div className="range-labels">
                <span>1 (Very Low)</span>
                <span>5 (Excellent)</span>
              </div>
              <div className="range-inputs">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filters.moodRange.min}
                  onChange={(e) => handleFilterChange('moodRange', { 
                    ...filters.moodRange, 
                    min: parseInt(e.target.value) 
                  })}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={filters.moodRange.max}
                  onChange={(e) => handleFilterChange('moodRange', { 
                    ...filters.moodRange, 
                    max: parseInt(e.target.value) 
                  })}
                  className="range-slider"
                />
              </div>
              <div className="range-display">
                {filters.moodRange.min} - {filters.moodRange.max}
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="filter-section">
              <h4>Activities/Tags</h4>
              <div className="tags-filter">
                {allTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length > 10 && (
                  <span className="more-tags">+{allTags.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {/* Emotions Filter */}
          {allEmotions.length > 0 && (
            <div className="filter-section">
              <h4>Emotions</h4>
              <div className="emotions-filter">
                {allEmotions.slice(0, 8).map(emotion => (
                  <button
                    key={emotion}
                    className={`emotion-filter ${filters.selectedEmotions.includes(emotion) ? 'active' : ''}`}
                    onClick={() => handleEmotionToggle(emotion)}
                  >
                    {emotion}
                  </button>
                ))}
                {allEmotions.length > 8 && (
                  <span className="more-emotions">+{allEmotions.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="filter-section">
            <h4>Date Range</h4>
            <div className="date-range-filter">
              <div className="date-input">
                <label>From:</label>
                <input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    start: e.target.value 
                  })}
                />
              </div>
              <div className="date-input">
                <label>To:</label>
                <input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    end: e.target.value 
                  })}
                />
              </div>
            </div>
          </div>

          {/* Notes Filter */}
          <div className="filter-section">
            <h4>Journal Entries</h4>
            <div className="notes-filter">
              <label className="radio-option">
                <input
                  type="radio"
                  name="hasNotes"
                  value="all"
                  checked={filters.hasNotes === 'all'}
                  onChange={(e) => handleFilterChange('hasNotes', e.target.value)}
                />
                <span>All entries</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="hasNotes"
                  value="withNotes"
                  checked={filters.hasNotes === 'withNotes'}
                  onChange={(e) => handleFilterChange('hasNotes', e.target.value)}
                />
                <span>With notes only</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="hasNotes"
                  value="withoutNotes"
                  checked={filters.hasNotes === 'withoutNotes'}
                  onChange={(e) => handleFilterChange('hasNotes', e.target.value)}
                />
                <span>Without notes only</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodFilters; 