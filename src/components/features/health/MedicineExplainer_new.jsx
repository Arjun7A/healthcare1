import React, { useState, useEffect } from 'react';
import { getMedicationInfo, analyzeDrugInteractions } from '../../../services/prescriptionAPI';
import Button from '../../common/Button';
import { useAuth } from '../../../contexts/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import './MedicineExplainer.css';

const MedicineExplainer = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [medicationData, setMedicationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('search');
  const [activeTab, setActiveTab] = useState('dosing');
  const [recentSearches, setRecentSearches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Popular medications for quick access
  const popularMeds = [
    { name: 'Ibuprofen', category: 'Pain Relief', icon: '💊' },
    { name: 'Acetaminophen', category: 'Pain Relief', icon: '💊' },
    { name: 'Aspirin', category: 'Blood Thinner', icon: '🩸' },
    { name: 'Metformin', category: 'Diabetes', icon: '🍯' },
    { name: 'Lisinopril', category: 'Blood Pressure', icon: '❤️' },
    { name: 'Atorvastatin', category: 'Cholesterol', icon: '🫀' },
    { name: 'Amoxicillin', category: 'Antibiotic', icon: '🦠' },
    { name: 'Omeprazole', category: 'Acid Reflux', icon: '🔥' },
  ];

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data: searches } = await supabase
        .from('medication_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentSearches(searches || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSearch = async (medicationName = searchQuery) => {
    if (!medicationName.trim()) {
      setError('Please enter a medication name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching for medication:', medicationName);
      const result = await getMedicationInfo(medicationName);
      
      if (result.success) {
        setMedicationData(result.info);
        setActiveView('results');
        setActiveTab('dosing'); // Reset to first tab when new medication is searched
        await saveMedicationSearch(medicationName, result.info);
      } else {
        setError('Failed to get medication information');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Failed to search medication');
    } finally {
      setLoading(false);
    }
  };

  const saveMedicationSearch = async (name, info) => {
    if (!user) return;

    try {
      await supabase
        .from('medication_searches')
        .insert([{
          user_id: user.id,
          medication_name: name,
          medication_info: info,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const addToComparison = (medication) => {
    if (comparisons.length >= 3) {
      setError('Maximum 3 medications can be compared');
      return;
    }
    
    if (!comparisons.find(med => med.medication.name === medication.name)) {
      setComparisons([...comparisons, { medication, timestamp: Date.now() }]);
    }
  };

  const removeFromComparison = (medicationName) => {
    setComparisons(comparisons.filter(med => med.medication.name !== medicationName));
  };

  const renderSearchView = () => (
    <div className="search-view">
      <div className="search-hero">
        <div className="search-icon">💊</div>
        <h2>Medicine Information Hub</h2>
        <p>Get comprehensive medication information, interactions, and comparisons</p>
      </div>

      <div className="search-container">
        <div className="search-box">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search for any medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="search-btn"
            >
              {loading ? (
                <div className="loading-spinner">⏳</div>
              ) : (
                '🔍 Search'
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="dismiss-btn">✕</button>
          </div>
        )}
      </div>

      <div className="quick-access">
        <h3>Popular Medications</h3>
        <div className="popular-grid">
          {popularMeds.map((med, index) => (
            <div
              key={index}
              className="popular-card"
              onClick={() => handleSearch(med.name)}
            >
              <div className="med-icon">{med.icon}</div>
              <div className="med-info">
                <div className="med-name">{med.name}</div>
                <div className="med-category">{med.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {recentSearches.length > 0 && (
        <div className="recent-searches">
          <h3>Recent Searches</h3>
          <div className="recent-grid">
            {recentSearches.map((search, index) => (
              <div
                key={index}
                className="recent-card"
                onClick={() => handleSearch(search.medication_name)}
              >
                <div className="recent-icon">🕐</div>
                <div className="recent-info">
                  <div className="recent-name">{search.medication_name}</div>
                  <div className="recent-date">
                    {new Date(search.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMedicationResults = () => {
    if (!medicationData) return null;

    const { medication, dosing, administration, sideEffects, monitoring, patientEducation } = medicationData;

    return (
      <div className="results-view">
        <div className="results-header">
          <Button
            onClick={() => setActiveView('search')}
            variant="outline"
            className="back-btn"
          >
            ← Back to Search
          </Button>
          <div className="medication-title">
            <h2>{medication.name}</h2>
            <span className="generic-name">{medication.genericName}</span>
          </div>
          <div className="action-buttons">
            <Button
              onClick={() => addToComparison(medication)}
              variant="outline"
              className="compare-btn"
            >
              ⚖️ Compare
            </Button>
          </div>
        </div>

        <div className="medication-overview">
          <div className="overview-cards">
            <div className="overview-card primary">
              <div className="card-header">
                <h3>📋 Basic Information</h3>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Classification:</span>
                  <span className="value">{medication.classification}</span>
                </div>
                <div className="info-item">
                  <span className="label">Brand Names:</span>
                  <span className="value">{medication.brandNames?.join(', ') || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Available Forms:</span>
                  <span className="value">{medication.dosageForm?.join(', ') || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Strengths:</span>
                  <span className="value">{medication.strengthsAvailable?.join(', ') || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="overview-card secondary">
              <div className="card-header">
                <h3>🎯 How It Works</h3>
              </div>
              <p className="mechanism-text">{medication.mechanism}</p>
            </div>
          </div>
        </div>

        <div className="detailed-sections">
          <div className="section-tabs">
            <button 
              className={`tab ${activeTab === 'dosing' ? 'active' : ''}`}
              onClick={() => setActiveTab('dosing')}
            >
              📊 Dosing
            </button>
            <button 
              className={`tab ${activeTab === 'administration' ? 'active' : ''}`}
              onClick={() => setActiveTab('administration')}
            >
              💊 Administration
            </button>
            <button 
              className={`tab ${activeTab === 'sideEffects' ? 'active' : ''}`}
              onClick={() => setActiveTab('sideEffects')}
            >
              ⚠️ Side Effects
            </button>
            <button 
              className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoring')}
            >
              🔬 Monitoring
            </button>
            <button 
              className={`tab ${activeTab === 'patientEducation' ? 'active' : ''}`}
              onClick={() => setActiveTab('patientEducation')}
            >
              📚 Patient Info
            </button>
          </div>

          <div className="section-content">
            {activeTab === 'dosing' && (
              <div className="dosing-section">
                <div className="dosing-grid">
                  <div className="dosing-card">
                    <h4>👨‍⚕️ Adult Dosing</h4>
                    <p>{dosing.adult}</p>
                  </div>
                  <div className="dosing-card">
                    <h4>👶 Pediatric Dosing</h4>
                    <p>{dosing.pediatric}</p>
                  </div>
                  <div className="dosing-card">
                    <h4>👴 Geriatric Dosing</h4>
                    <p>{dosing.geriatric}</p>
                  </div>
                  <div className="dosing-card">
                    <h4>🩺 Kidney Adjustment</h4>
                    <p>{dosing.renalAdjustment}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'administration' && (
              <div className="administration-section">
                <div className="admin-cards">
                  <div className="admin-card">
                    <h4>🚪 Route</h4>
                    <p>{administration.route}</p>
                  </div>
                  <div className="admin-card">
                    <h4>📋 Instructions</h4>
                    <p>{administration.instructions}</p>
                  </div>
                  <div className="admin-card">
                    <h4>🍽️ Food Interactions</h4>
                    <p>{administration.foodInteractions}</p>
                  </div>
                  <div className="admin-card">
                    <h4>⏰ Timing</h4>
                    <p>{administration.timingRecommendations}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sideEffects' && (
              <div className="side-effects-section">
                <div className="effects-grid">
                  <div className="effects-card common">
                    <h4>😊 Common Side Effects</h4>
                    <ul>
                      {sideEffects.common?.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="effects-card serious">
                    <h4>⚠️ Serious Side Effects</h4>
                    <ul>
                      {sideEffects.serious?.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="effects-card rare">
                    <h4>🚨 Rare Side Effects</h4>
                    <ul>
                      {sideEffects.rare?.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monitoring' && (
              <div className="monitoring-section">
                <div className="monitoring-grid">
                  <div className="monitoring-card">
                    <h4>🔬 Parameters to Monitor</h4>
                    <ul>
                      {monitoring.parameters?.map((param, index) => (
                        <li key={index}>{param}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="monitoring-card">
                    <h4>📅 Monitoring Frequency</h4>
                    <p>{monitoring.frequency}</p>
                  </div>
                  <div className="monitoring-card">
                    <h4>🧪 Lab Tests</h4>
                    <ul>
                      {monitoring.labTests?.map((test, index) => (
                        <li key={index}>{test}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patientEducation' && (
              <div className="patient-education-section">
                <div className="education-grid">
                  <div className="education-card">
                    <h4>💡 Key Points</h4>
                    <ul>
                      {patientEducation.keyPoints?.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="education-card">
                    <h4>🏃‍♂️ Lifestyle</h4>
                    <ul>
                      {patientEducation.lifestyle?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="education-card">
                    <h4>⚠️ Important Warnings</h4>
                    <ul>
                      {patientEducation.warnings?.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonView = () => (
    <div className="comparison-view">
      <div className="comparison-header">
        <h2>⚖️ Medication Comparison</h2>
        <p>Compare up to 3 medications side by side</p>
      </div>

      <div className="comparison-slots">
        {[0, 1, 2].map(index => (
          <div key={index} className="comparison-slot">
            {comparisons[index] ? (
              <div className="comparison-card filled">
                <div className="card-header">
                  <h3>{comparisons[index].medication.name}</h3>
                  <button
                    onClick={() => removeFromComparison(comparisons[index].medication.name)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
                <div className="card-content">
                  <div className="comparison-detail">
                    <span className="label">Classification:</span>
                    <span className="value">{comparisons[index].medication.classification}</span>
                  </div>
                  <div className="comparison-detail">
                    <span className="label">Mechanism:</span>
                    <span className="value">{comparisons[index].medication.mechanism}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="comparison-card empty">
                <div className="empty-state">
                  <div className="plus-icon">+</div>
                  <p>Add medication to compare</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {comparisons.length > 1 && (
        <div className="comparison-actions">
          <Button
            onClick={() => setShowComparison(true)}
            className="compare-btn"
          >
            📊 Generate Comparison Report
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="medicine-explainer">
      <div className="navigation-tabs">
        <button
          className={`nav-tab ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          🔍 Search
        </button>
        <button
          className={`nav-tab ${activeView === 'results' ? 'active' : ''}`}
          onClick={() => setActiveView('results')}
          disabled={!medicationData}
        >
          📊 Results
        </button>
        <button
          className={`nav-tab ${activeView === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveView('comparison')}
        >
          ⚖️ Compare ({comparisons.length})
        </button>
      </div>

      <div className="view-content">
        {activeView === 'search' && renderSearchView()}
        {activeView === 'results' && renderMedicationResults()}
        {activeView === 'comparison' && renderComparisonView()}
      </div>

      <div className="disclaimer">
        <p>
          <strong>⚠️ Medical Disclaimer:</strong> This information is for educational purposes only. 
          Always consult healthcare professionals before starting, stopping, or changing medications.
        </p>
      </div>
    </div>
  );
};

export default MedicineExplainer;
