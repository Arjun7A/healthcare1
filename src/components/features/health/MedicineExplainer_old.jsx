import React, { useState, useEffect } from 'react';
import { getMedicationInfo, analyzeDrugInteractions } from '../../../services/prescriptionAPI';
import Button from '../../common/Button';
import { useAuth } from '../../../contexts/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import './MedicineExplainer.css';

const MedicineExplainer = () => {
  const { user } = useAuth();
  const [medicationName, setMedicationName] = useState('');
  const [medicationInfo, setMedicationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [popularMedications, setPopularMedications] = useState([
    'Ibuprofen', 'Acetaminophen', 'Aspirin', 'Metformin', 'Lisinopril',
    'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Levothyroxine', 'Amoxicillin'
  ]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  useEffect(() => {
    if (user) {
      loadMedicationHistory();
    }
  }, [user]);

  useEffect(() => {
    if (medicationName.length > 2) {
      generateSearchSuggestions();
    } else {
      setSearchSuggestions([]);
    }
  }, [medicationName]);

  const generateSearchSuggestions = () => {
    const suggestions = popularMedications.filter(med =>
      med.toLowerCase().includes(medicationName.toLowerCase())
    );
    setSearchSuggestions(suggestions);
  };

  const loadMedicationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMedicationHistory(data || []);
    } catch (error) {
      console.error('Error loading medication history:', error);
    }
  };

  const handleSearch = async (medName = medicationName) => {
    if (!medName.trim()) {
      setError('Please enter a medication name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getMedicationInfo(medName);
      setMedicationInfo(result);
      setActiveTab('results');

      // Save to history
      if (user) {
        await saveMedicationSearch(medName, result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMedicationSearch = async (medName, result) => {
    try {
      const { error } = await supabase
        .from('medication_searches')
        .insert([{
          user_id: user.id,
          medication_name: medName,
          search_result: result.info,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      loadMedicationHistory();
    } catch (error) {
      console.error('Error saving medication search:', error);
    }
  };

  const addToCompare = (medication) => {
    if (compareList.length >= 5) {
      setError('Maximum 5 medications can be compared at once');
      return;
    }
    
    if (!compareList.includes(medication)) {
      setCompareList([...compareList, medication]);
    }
  };

  const removeFromCompare = (medication) => {
    setCompareList(compareList.filter(med => med !== medication));
  };

  const compareMedications = async () => {
    if (compareList.length < 2) {
      setError('Please select at least 2 medications to compare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const interactions = await analyzeDrugInteractions(compareList);
      const medicationDetails = await Promise.all(
        compareList.map(med => getMedicationInfo(med))
      );

      setComparisonResult({
        interactions,
        medications: medicationDetails
      });

      setActiveTab('comparison');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchTab = () => (
    <div className="search-section">
      <div className="search-header">
        <h3>🔍 Search Medication Information</h3>
        <p>Get comprehensive information about any medication</p>
      </div>

      <div className="search-container">
        <div className="search-input-container">
          <input
            type="text"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="Enter medication name (e.g., Ibuprofen, Metformin)"
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={() => handleSearch()}
            disabled={loading || !medicationName.trim()}
            className="search-btn"
          >
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </Button>
        </div>

        {searchSuggestions.length > 0 && (
          <div className="search-suggestions">
            <h4>Suggestions:</h4>
            <div className="suggestions-grid">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setMedicationName(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="popular-medications">
        <h4>🏆 Popular Medications</h4>
        <div className="popular-grid">
          {popularMedications.map((med, index) => (
            <div key={index} className="popular-item">
              <span className="med-name">{med}</span>
              <div className="med-actions">
                <Button
                  onClick={() => handleSearch(med)}
                  size="small"
                  variant="outline"
                  className="action-btn"
                >
                  📖 Info
                </Button>
                <Button
                  onClick={() => addToCompare(med)}
                  size="small"
                  variant="outline"
                  className="action-btn"
                >
                  ⚖️ Compare
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {medicationHistory.length > 0 && (
        <div className="medication-history">
          <h4>📚 Recent Searches</h4>
          <div className="history-grid">
            {medicationHistory.map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-med-name">{item.medication_name}</span>
                <span className="history-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <Button
                  onClick={() => handleSearch(item.medication_name)}
                  size="small"
                  variant="outline"
                  className="history-action"
                >
                  🔍 Search Again
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {compareList.length > 0 && (
        <div className="compare-section">
          <h4>⚖️ Medication Comparison List</h4>
          <div className="compare-list">
            {compareList.map((med, index) => (
              <div key={index} className="compare-item">
                <span>{med}</span>
                <button
                  onClick={() => removeFromCompare(med)}
                  className="remove-btn"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
          <Button
            onClick={compareMedications}
            disabled={compareList.length < 2}
            className="compare-btn"
          >
            ⚖️ Compare Medications ({compareList.length})
          </Button>
        </div>
      )}
    </div>
  );

  const renderMedicationDetails = (info) => (
    <div className="medication-details">
      <div className="med-header">
        <h3>{info.medication.name}</h3>
        <div className="med-meta">
          <span className="generic-name">{info.medication.genericName}</span>
          <span className="classification">{info.medication.classification}</span>
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-section">
          <h4>💊 Basic Information</h4>
          <div className="info-cards">
            <div className="info-card">
              <h5>Brand Names</h5>
              <ul>
                {info.medication.brandNames.map((brand, index) => (
                  <li key={index}>{brand}</li>
                ))}
              </ul>
            </div>
            <div className="info-card">
              <h5>Mechanism of Action</h5>
              <p>{info.medication.mechanism}</p>
            </div>
            <div className="info-card">
              <h5>Available Forms</h5>
              <ul>
                {info.medication.dosageForm.map((form, index) => (
                  <li key={index}>{form}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>📋 Indications</h4>
          <div className="indications-list">
            {info.medication.indications.map((indication, index) => (
              <div key={index} className="indication-item">
                <span className="indication-icon">✓</span>
                <span>{indication}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h4>💉 Dosing Information</h4>
          <div className="dosing-grid">
            <div className="dosing-card">
              <h5>Adult Dosing</h5>
              <p>{info.dosing.adult}</p>
            </div>
            <div className="dosing-card">
              <h5>Pediatric Dosing</h5>
              <p>{info.dosing.pediatric}</p>
            </div>
            <div className="dosing-card">
              <h5>Geriatric Considerations</h5>
              <p>{info.dosing.geriatric}</p>
            </div>
            <div className="dosing-card">
              <h5>Renal Adjustment</h5>
              <p>{info.dosing.renalAdjustment}</p>
            </div>
            <div className="dosing-card">
              <h5>Hepatic Adjustment</h5>
              <p>{info.dosing.hepaticAdjustment}</p>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>📝 Administration</h4>
          <div className="admin-info">
            <div className="admin-item">
              <span className="label">Route:</span>
              <span className="value">{info.administration.route}</span>
            </div>
            <div className="admin-item">
              <span className="label">Instructions:</span>
              <span className="value">{info.administration.instructions}</span>
            </div>
            <div className="admin-item">
              <span className="label">Food Interactions:</span>
              <span className="value">{info.administration.foodInteractions}</span>
            </div>
            <div className="admin-item">
              <span className="label">Timing:</span>
              <span className="value">{info.administration.timingRecommendations}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>⚠️ Side Effects</h4>
          <div className="side-effects-container">
            <div className="side-effects-category">
              <h5>Common Side Effects</h5>
              <ul>
                {info.sideEffects.common.map((effect, index) => (
                  <li key={index} className="common-effect">{effect}</li>
                ))}
              </ul>
            </div>
            <div className="side-effects-category">
              <h5>Serious Side Effects</h5>
              <ul>
                {info.sideEffects.serious.map((effect, index) => (
                  <li key={index} className="serious-effect">{effect}</li>
                ))}
              </ul>
            </div>
            <div className="side-effects-category">
              <h5>Rare Side Effects</h5>
              <ul>
                {info.sideEffects.rare.map((effect, index) => (
                  <li key={index} className="rare-effect">{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>🔬 Monitoring</h4>
          <div className="monitoring-info">
            <div className="monitoring-item">
              <span className="label">Parameters:</span>
              <span className="value">{info.monitoring.parameters.join(', ')}</span>
            </div>
            <div className="monitoring-item">
              <span className="label">Frequency:</span>
              <span className="value">{info.monitoring.frequency}</span>
            </div>
            <div className="monitoring-item">
              <span className="label">Lab Tests:</span>
              <span className="value">{info.monitoring.labTests.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>🚫 Contraindications</h4>
          <div className="contraindications-list">
            {info.medication.contraindications.map((contraindication, index) => (
              <div key={index} className="contraindication-item">
                <span className="contraindication-icon">⚠️</span>
                <span>{contraindication}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h4>📚 Patient Education</h4>
          <div className="education-sections">
            <div className="education-section">
              <h5>Key Points</h5>
              <ul>
                {info.patientEducation.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="education-section">
              <h5>Lifestyle Considerations</h5>
              <ul>
                {info.patientEducation.lifestyle.map((lifestyle, index) => (
                  <li key={index}>{lifestyle}</li>
                ))}
              </ul>
            </div>
            <div className="education-section">
              <h5>Important Warnings</h5>
              <ul>
                {info.patientEducation.warnings.map((warning, index) => (
                  <li key={index} className="warning-item">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>💰 Cost & Storage</h4>
          <div className="cost-storage-grid">
            <div className="cost-info">
              <h5>Cost Information</h5>
              <p>{info.costInformation}</p>
            </div>
            <div className="storage-info">
              <h5>Storage Requirements</h5>
              <p>{info.storage}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="med-actions">
        <Button
          onClick={() => addToCompare(info.medication.name)}
          className="add-compare-btn"
        >
          ⚖️ Add to Compare
        </Button>
        <Button
          onClick={() => setActiveTab('search')}
          variant="outline"
          className="new-search-btn"
        >
          🔍 New Search
        </Button>
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="results-section">
      {medicationInfo && renderMedicationDetails(medicationInfo.info)}
    </div>
  );

  const renderComparisonTab = () => (
    <div className="comparison-section">
      <div className="comparison-header">
        <h3>⚖️ Medication Comparison Results</h3>
        <Button
          onClick={() => setActiveTab('search')}
          variant="outline"
          className="back-btn"
        >
          🔍 Back to Search
        </Button>
      </div>

      {comparisonResult && (
        <div className="comparison-content">
          <div className="comparison-summary">
            <h4>🚨 Drug Interactions Analysis</h4>
            <div className="interaction-summary">
              <div className="risk-level">
                <span className="label">Overall Risk Level:</span>
                <span className={`value risk-${comparisonResult.interactions.analysis.riskLevel.toLowerCase()}`}>
                  {comparisonResult.interactions.analysis.riskLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="interactions-detailed">
            <h4>⚠️ Detailed Interactions</h4>
            {comparisonResult.interactions.analysis.interactions.map((interaction, index) => (
              <div key={index} className="interaction-detailed">
                <div className="interaction-header">
                  <span className="medications">{interaction.medications.join(' + ')}</span>
                  <span className={`severity severity-${interaction.severity.toLowerCase()}`}>
                    {interaction.severity}
                  </span>
                </div>
                <div className="interaction-details">
                  <div className="detail-item">
                    <span className="label">Mechanism:</span>
                    <span className="value">{interaction.mechanism}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Clinical Effects:</span>
                    <span className="value">{interaction.clinicalEffects}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Management:</span>
                    <span className="value">{interaction.management}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Monitoring Required:</span>
                    <span className="value">{interaction.monitoringRequired}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="comparison-recommendations">
            <h4>💡 Recommendations</h4>
            <ul>
              {comparisonResult.interactions.analysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          {comparisonResult.interactions.analysis.alternativeOptions && (
            <div className="alternative-options">
              <h4>🔄 Alternative Options</h4>
              <ul>
                {comparisonResult.interactions.analysis.alternativeOptions.map((alt, index) => (
                  <li key={index}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="medicine-explainer">
      <div className="component-header">
        <h2>💊 Medicine Explainer</h2>
        <p>Comprehensive medication information, interactions, and safety guidance</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search Medicine
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={!medicationInfo}
        >
          📋 Medicine Details
        </button>
        <button
          className={`tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
          disabled={!comparisonResult}
        >
          ⚖️ Comparison Results
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>❌</button>
        </div>
      )}

      <div className="tab-content">
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading medication information...</p>
          </div>
        </div>
      )}

      <div className="disclaimer">
        <p>
          <strong>⚠️ Medical Disclaimer:</strong> This information is for educational purposes only. 
          Always consult with healthcare professionals for medical advice. 
          This tool does not replace professional medical judgment.
        </p>
      </div>
    </div>
  );
};

export default MedicineExplainer;
