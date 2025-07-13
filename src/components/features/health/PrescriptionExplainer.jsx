import React, { useState, useRef } from 'react';
import { analyzePrescription, analyzeDrugInteractions, getMedicationInfo } from '../../../services/prescriptionAPI';
import Button from '../../common/Button';
import { useAuth } from '../../../contexts/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import Tesseract from 'tesseract.js';
import './PrescriptionExplainer.css';

const PrescriptionExplainer = () => {
  const { user } = useAuth();
  const [prescriptionText, setPrescriptionText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [userProfile, setUserProfile] = useState({
    age: '',
    gender: '',
    weight: '',
    allergies: '',
    conditions: '',
    currentMedications: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medicationDetails, setMedicationDetails] = useState(null);
  const [interactionAnalysis, setInteractionAnalysis] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setIsProcessingImage(true);
      setOcrProgress(0);
      setError(null);

      try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or BMP)');
        }

        // Validate file size (max 5MB)
        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          throw new Error('Image size should be less than 5MB');
        }

        // Perform OCR using Tesseract.js with optimized settings
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            },
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:-()[]/',
            preserve_interword_spaces: '1'
          }
        );

        const extractedText = result.data.text.trim();
        
        if (extractedText.length < 5) {
          throw new Error('Could not extract readable text from the image. For handwritten prescriptions, try:\n• Taking a clearer photo with good lighting\n• Using block letters if rewriting\n• Typing the prescription manually for best results');
        }

        setPrescriptionText(extractedText);
        setError(null);
        
        // Show success message with confidence score
        const confidence = result.data.confidence;
        console.log('OCR successful! Extracted text:', extractedText);
        console.log('OCR confidence:', confidence + '%');
        
        // Show warning if confidence is low
        if (confidence < 70) {
          setError(`⚠️ OCR confidence is ${Math.round(confidence)}%. Please review and edit the extracted text before analysis.`);
        }

      } catch (error) {
        console.error('OCR Error:', error);
        setError(error.message || 'Failed to process image. Please try again or enter text manually.');
        setPrescriptionText('');
      } finally {
        setIsProcessingImage(false);
        setOcrProgress(0);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!prescriptionText.trim()) {
      setError('Please provide prescription information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzePrescription({
        prescriptionText,
        userProfile,
        analysisType: 'full'
      });

      setAnalysis(result);
      setActiveTab('results');

      // Save to database
      if (user && result.success) {
        await savePrescriptionAnalysis(result);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePrescriptionAnalysis = async (analysisResult) => {
    try {
      const { error } = await supabase
        .from('prescription_analyses')
        .insert([{
          user_id: user.id,
          prescription_text: prescriptionText,
          analysis_result: analysisResult.analysis,
          user_profile: userProfile,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving prescription analysis:', error);
    }
  };

  const analyzeDrugInteractionsHandler = async () => {
    if (!analysis?.analysis?.medications) return;

    const medications = analysis.analysis.medications.map(med => med.name);
    
    try {
      setLoading(true);
      const result = await analyzeDrugInteractions(medications);
      setInteractionAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedicationDetailsHandler = async (medicationName) => {
    try {
      setLoading(true);
      const result = await getMedicationInfo(medicationName);
      setMedicationDetails(result);
      setSelectedMedication(medicationName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPrescriptionInput = () => (
    <div className="prescription-input-section">
      <div className="input-methods">
        <div className="input-method">
          <h3>📝 Type or Paste Prescription</h3>
          <textarea
            value={prescriptionText}
            onChange={(e) => setPrescriptionText(e.target.value)}
            placeholder="Enter your prescription details here...

Example format:
Dr. John Smith, MD
Patient: Jane Doe
Date: 2024-01-15

Rx:
1. Amoxicillin 500mg - Take 1 capsule every 8 hours for 10 days
2. Ibuprofen 400mg - Take 1 tablet every 6 hours as needed for pain
3. Omeprazole 20mg - Take 1 capsule daily before breakfast

Refills: 2
Signature: Dr. John Smith"
            rows={15}
            className="prescription-textarea"
          />
        </div>

        <div className="input-method">
          <h3>📸 Upload Prescription Image</h3>
          <div className="image-upload-area">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden-input"
            />
            <div 
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📷</div>
              <p>Click to upload prescription image</p>
              <p className="upload-hint">Supports JPG, PNG, GIF, BMP formats</p>
              <div className="handwriting-tips">
                <details>
                  <summary>📝 Tips for handwritten prescriptions</summary>
                  <ul>
                    <li>✅ <strong>Good lighting</strong> - avoid shadows</li>
                    <li>✅ <strong>Clear photo</strong> - hold camera steady</li>
                    <li>✅ <strong>Block letters</strong> work better than cursive</li>
                    <li>✅ <strong>Review extracted text</strong> - edit any errors</li>
                    <li>⚠️ <strong>Doctor handwriting</strong> may need manual typing</li>
                  </ul>
                </details>
              </div>
            </div>
            
            {isProcessingImage && (
              <div className="ocr-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
                <p>Processing image... {ocrProgress}%</p>
              </div>
            )}
            
            {imageFile && !isProcessingImage && (
              <div className="uploaded-file">
                <span>📄 {imageFile.name}</span>
                <button onClick={() => {
                  setImageFile(null);
                  setPrescriptionText('');
                }}>❌</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="patient-profile">
        <h3>👤 Patient Profile (Optional)</h3>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Age</label>
            <input
              type="number"
              value={userProfile.age}
              onChange={(e) => setUserProfile({...userProfile, age: e.target.value})}
              placeholder="e.g., 35"
            />
          </div>
          <div className="profile-field">
            <label>Gender</label>
            <select
              value={userProfile.gender}
              onChange={(e) => setUserProfile({...userProfile, gender: e.target.value})}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="profile-field">
            <label>Weight (kg)</label>
            <input
              type="number"
              value={userProfile.weight}
              onChange={(e) => setUserProfile({...userProfile, weight: e.target.value})}
              placeholder="e.g., 70"
            />
          </div>
          <div className="profile-field full-width">
            <label>Known Allergies</label>
            <input
              type="text"
              value={userProfile.allergies}
              onChange={(e) => setUserProfile({...userProfile, allergies: e.target.value})}
              placeholder="e.g., Penicillin, Sulfa drugs"
            />
          </div>
          <div className="profile-field full-width">
            <label>Medical Conditions</label>
            <input
              type="text"
              value={userProfile.conditions}
              onChange={(e) => setUserProfile({...userProfile, conditions: e.target.value})}
              placeholder="e.g., Diabetes, Hypertension"
            />
          </div>
          <div className="profile-field full-width">
            <label>Current Medications</label>
            <input
              type="text"
              value={userProfile.currentMedications}
              onChange={(e) => setUserProfile({...userProfile, currentMedications: e.target.value})}
              placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
            />
          </div>
        </div>
      </div>

      <div className="analysis-controls">
        <Button
          onClick={handleAnalyze}
          disabled={loading || isProcessingImage || !prescriptionText.trim()}
          className="analyze-btn"
        >
          {loading ? '🔍 Analyzing...' : 
           isProcessingImage ? '📷 Processing Image...' : 
           '🔍 Analyze Prescription'}
        </Button>
      </div>
    </div>
  );

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ff4444';
      case 'major': return '#ff6b35';
      case 'high': return '#ff8c00';
      case 'moderate': return '#ffa500';
      case 'minor': return '#32cd32';
      case 'low': return '#90ee90';
      default: return '#666';
    }
  };

  const renderAnalysisResults = () => (
    <div className="analysis-results">
      <div className="results-header">
        <h3>📋 Prescription Analysis Results</h3>
        <div className="results-actions">
          <Button
            onClick={analyzeDrugInteractionsHandler}
            variant="outline"
            className="action-btn"
          >
            🔍 Check Drug Interactions
          </Button>
          <Button
            onClick={() => setActiveTab('input')}
            variant="outline"
            className="action-btn"
          >
            📝 New Analysis
          </Button>
        </div>
      </div>

      {analysis && (
        <div className="analysis-content">
          {/* Prescription Summary */}
          <div className="analysis-section">
            <h4>📊 Prescription Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">Total Medications:</span>
                <span className="value">{analysis.analysis.prescriptionSummary.totalMedications}</span>
              </div>
              <div className="summary-item">
                <span className="label">Complexity Level:</span>
                <span className={`value complexity-${analysis.analysis.prescriptionSummary.complexityLevel?.toLowerCase()}`}>
                  {analysis.analysis.prescriptionSummary.complexityLevel}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Estimated Duration:</span>
                <span className="value">{analysis.analysis.prescriptionSummary.treatmentDuration}</span>
              </div>
              <div className="summary-item">
                <span className="label">Estimated Cost:</span>
                <span className="value">{analysis.analysis.prescriptionSummary.estimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Medications List */}
          <div className="analysis-section">
            <h4>💊 Medications Details</h4>
            <div className="medications-grid">
              {analysis.analysis.medications.map((med) => (
                <div className="medication-card" key={med.name}>
                  <div className="medication-header">
                    <div>
                      <div className="medication-title">{med.name}</div>
                      {med.composition && (
                        <div className="medication-composition">{med.composition}</div>
                      )}
                    </div>
                  </div>
                  <div className="medication-info">
                    <div className="info-row">
                      <span className="info-label">Dosage:</span>
                      <span className="info-value">{med.dosage}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Frequency:</span>
                      <span className="info-value">{med.frequency}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">{med.duration}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Purpose:</span>
                      <span className="info-value">{med.purpose}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Instructions:</span>
                      <span className="info-value instructions">{med.instructions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drug Interactions */}
          {analysis.analysis.drugInteractions && analysis.analysis.drugInteractions.length > 0 && (
            <div className="analysis-section">
              <h4>⚠️ Drug Interactions</h4>
              <div className="interactions-list">
                {analysis.analysis.drugInteractions.map((interaction, index) => (
                  <div key={index} className="interaction-item">
                    <div className="interaction-header">
                      <span className="medications">{interaction.medications.join(' + ')}</span>
                      <span 
                        className="severity"
                        style={{ backgroundColor: getSeverityColor(interaction.interactionType) }}
                      >
                        {interaction.interactionType}
                      </span>
                    </div>
                    <p className="interaction-description">{interaction.description}</p>
                    <div className="interaction-recommendations">
                      <strong>Recommendations:</strong> {interaction.recommendations}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side Effects */}
          <div className="analysis-section">
            <h4>🚨 Side Effects Information</h4>
            <div className="side-effects-grid">
              <div className="side-effects-category common">
                <h5>Common Side Effects</h5>
                <ul>
                  {analysis.analysis.sideEffects.common.map((effect, index) => (
                    <li key={index}>{effect}</li>
                  ))}
                </ul>
              </div>
              <div className="side-effects-category serious">
                <h5>Serious Side Effects</h5>
                <ul>
                  {analysis.analysis.sideEffects.serious.map((effect, index) => (
                    <li key={index} className="serious-effect">{effect}</li>
                  ))}
                </ul>
              </div>
              <div className="side-effects-category seek-help">
                <h5>When to Seek Help</h5>
                <ul>
                  {analysis.analysis.sideEffects.whenToSeekHelp.map((situation, index) => (
                    <li key={index} className="seek-help">{situation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Patient Instructions */}
          <div className="analysis-section">
            <h4>📋 Patient Instructions</h4>
            <div className="instructions-list">
              {analysis.analysis.patientInstructions.map((instruction, index) => (
                <div key={index} className={`instruction-item ${instruction.importance?.toLowerCase()}`}>
                  <div className="instruction-header">
                    <span className="category">{instruction.category}</span>
                    <span className="importance">{instruction.importance}</span>
                  </div>
                  <p className="instruction-text">{instruction.instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings and Precautions */}
          {analysis.analysis.warningsAndPrecautions && (
            <div className="analysis-section">
              <h4>⚠️ Warnings and Precautions</h4>
              <div className="warnings-list">
                {analysis.analysis.warningsAndPrecautions.map((warning, index) => (
                  <div key={index} className={`warning-item ${warning.severity?.toLowerCase()}`}>
                    <div className="warning-header">
                      <span className="warning-text">{warning.warning}</span>
                      <span className="severity">{warning.severity}</span>
                    </div>
                    <p className="warning-explanation">{warning.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Parameters */}
          {analysis.analysis.monitoringParameters && (
            <div className="analysis-section">
              <h4>📊 Monitoring Requirements</h4>
              <div className="monitoring-grid">
                {analysis.analysis.monitoringParameters.map((param) => (
                  <div className="monitoring-card" key={param.parameter}>
                    <div className="monitoring-header">
                      <div className="monitoring-title">{param.parameter}</div>
                    </div>
                    <div className="monitoring-info">
                      <div className="info-row">
                        <span className="info-label">Frequency:</span>
                        <span className="info-value">{param.frequency}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Normal Range:</span>
                        <span className="info-value">{param.normalRange}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Reason:</span>
                        <span className="info-value">{param.reason}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle Recommendations */}
          {analysis.analysis.lifestyle && (
            <div className="analysis-section">
              <h4>🌱 Lifestyle Recommendations</h4>
              <div className="lifestyle-grid">
                {analysis.analysis.lifestyle.dietary && analysis.analysis.lifestyle.dietary.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>🍽️ Dietary</h5>
                    <ul>
                      {analysis.analysis.lifestyle.dietary.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.activity && analysis.analysis.lifestyle.activity.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>🏃 Activity</h5>
                    <ul>
                      {analysis.analysis.lifestyle.activity.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.sleep && analysis.analysis.lifestyle.sleep.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>😴 Sleep</h5>
                    <ul>
                      {analysis.analysis.lifestyle.sleep.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.hydration && analysis.analysis.lifestyle.hydration.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>💧 Hydration</h5>
                    <ul>
                      {analysis.analysis.lifestyle.hydration.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.stressManagement && analysis.analysis.lifestyle.stressManagement.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>🧘 Stress Management</h5>
                    <ul>
                      {analysis.analysis.lifestyle.stressManagement.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.avoidance && analysis.analysis.lifestyle.avoidance.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>🚫 Avoidance</h5>
                    <ul>
                      {analysis.analysis.lifestyle.avoidance.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.analysis.lifestyle.other && analysis.analysis.lifestyle.other.length > 0 && (
                  <div className="lifestyle-category">
                    <h5>✨ Other</h5>
                    <ul>
                      {analysis.analysis.lifestyle.other.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medication Details Modal */}
      {medicationDetails && selectedMedication && (
        <div className="modal-overlay">
          <div className="medication-modal">
            <div className="modal-header">
              <h3>💊 {selectedMedication} - Detailed Information</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setMedicationDetails(null);
                  setSelectedMedication(null);
                }}
              >
                ❌
              </button>
            </div>
            <div className="modal-content">
              {/* Medication details content would go here */}
              <pre>{JSON.stringify(medicationDetails.info, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Analysis Modal */}
      {interactionAnalysis && (
        <div className="modal-overlay">
          <div className="interaction-modal">
            <div className="modal-header">
              <h3>⚠️ Drug Interaction Analysis</h3>
              <button 
                className="close-btn"
                onClick={() => setInteractionAnalysis(null)}
              >
                ❌
              </button>
            </div>
            <div className="modal-content">
              <pre>{JSON.stringify(interactionAnalysis.analysis, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="prescription-explainer">
      <div className="component-header">
        <h2>💊 Prescription Explainer</h2>
        <p>Professional prescription analysis and medication guidance powered by AI</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          📝 Input Prescription
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
          disabled={!analysis}
        >
          📊 Analysis Results
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
        {activeTab === 'input' ? renderPrescriptionInput() : renderAnalysisResults()}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing prescription...</p>
          </div>
        </div>
      )}

      <div className="disclaimer">
        <p>
          <strong>⚠️ Medical Disclaimer:</strong> This tool is for educational purposes only. 
          Always consult with healthcare professionals before making medication decisions. 
          Never stop or change medications without medical supervision.
        </p>
      </div>
    </div>
  );
};

export default PrescriptionExplainer;
