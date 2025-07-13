import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import { analyzeSymptoms } from '../../../lib/aiService';
import { analyzePrescription } from '../../../services/prescriptionAPI';
import Button from '../../common/Button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './HealthReports.css';

const HealthReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (user) {
      loadHealthReports();
      generateHealthSummary();
    }
  }, [user]);

  const loadHealthReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading health reports:', error);
      setError('Failed to load health reports');
    } finally {
      setLoading(false);
    }
  };

  const generateHealthSummary = async () => {
    try {
      setGeneratingReport(true);

      // Get symptom reports
      const { data: symptomReports, error: symptomError } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (symptomError) throw symptomError;

      // Get prescription analyses
      const { data: prescriptionAnalyses, error: prescriptionError } = await supabase
        .from('prescription_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (prescriptionError) throw prescriptionError;

      // Get mood entries for health correlation
      const { data: moodEntries, error: moodError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (moodError) throw moodError;

      // Process and summarize data
      const summary = {
        totalSymptomReports: symptomReports?.length || 0,
        totalPrescriptionAnalyses: prescriptionAnalyses?.length || 0,
        totalMoodEntries: moodEntries?.length || 0,
        commonConditions: extractCommonConditions(symptomReports || []),
        commonMedications: extractCommonMedications(prescriptionAnalyses || []),
        healthTrends: analyzeHealthTrends(symptomReports || [], moodEntries || []),
        recentActivity: combineRecentActivity(symptomReports || [], prescriptionAnalyses || []),
        riskFactors: identifyRiskFactors(symptomReports || [], prescriptionAnalyses || [])
      };

      setHealthSummary(summary);

      // Save summary to database
      await saveHealthSummary(summary);

    } catch (error) {
      console.error('Error generating health summary:', error);
      setError('Failed to generate health summary');
    } finally {
      setGeneratingReport(false);
    }
  };

  const extractCommonConditions = (symptomReports) => {
    const conditions = {};
    
    symptomReports.forEach(report => {
      if (report.analysis_result && report.analysis_result.possibleConditions) {
        report.analysis_result.possibleConditions.forEach(condition => {
          const conditionName = condition.condition || condition.name;
          if (conditionName) {
            conditions[conditionName] = (conditions[conditionName] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(conditions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([condition, count]) => ({ condition, count }));
  };

  const extractCommonMedications = (prescriptionAnalyses) => {
    const medications = {};
    
    prescriptionAnalyses.forEach(analysis => {
      if (analysis.analysis_result && analysis.analysis_result.medications) {
        analysis.analysis_result.medications.forEach(med => {
          const medName = med.name || med.genericName;
          if (medName) {
            medications[medName] = (medications[medName] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(medications)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([medication, count]) => ({ medication, count }));
  };

  const analyzeHealthTrends = (symptomReports, moodEntries) => {
    const trends = {
      symptomFrequency: calculateSymptomFrequency(symptomReports),
      moodHealthCorrelation: calculateMoodHealthCorrelation(moodEntries, symptomReports),
      urgencyTrends: calculateUrgencyTrends(symptomReports)
    };

    return trends;
  };

  const calculateSymptomFrequency = (symptomReports) => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentReports = symptomReports.filter(report => 
      new Date(report.created_at) >= last30Days
    );

    return {
      total: recentReports.length,
      avgPerWeek: (recentReports.length / 4.29).toFixed(1),
      trend: recentReports.length > 0 ? 'increasing' : 'stable'
    };
  };

  const calculateMoodHealthCorrelation = (moodEntries, symptomReports) => {
    // Simple correlation between mood and health reports
    const correlationData = moodEntries.map(entry => ({
      date: entry.date,
      mood: entry.mood,
      hasSymptoms: symptomReports.some(report => 
        new Date(report.created_at).toDateString() === new Date(entry.date).toDateString()
      )
    }));

    const avgMoodWithSymptoms = correlationData
      .filter(d => d.hasSymptoms)
      .reduce((sum, d) => sum + d.mood, 0) / correlationData.filter(d => d.hasSymptoms).length || 0;

    const avgMoodWithoutSymptoms = correlationData
      .filter(d => !d.hasSymptoms)
      .reduce((sum, d) => sum + d.mood, 0) / correlationData.filter(d => !d.hasSymptoms).length || 0;

    return {
      withSymptoms: avgMoodWithSymptoms.toFixed(1),
      withoutSymptoms: avgMoodWithoutSymptoms.toFixed(1),
      correlation: avgMoodWithSymptoms < avgMoodWithoutSymptoms ? 'negative' : 'positive'
    };
  };

  const calculateUrgencyTrends = (symptomReports) => {
    const urgencyLevels = { low: 0, medium: 0, high: 0, urgent: 0 };
    
    symptomReports.forEach(report => {
      const urgency = report.analysis_result?.urgencyLevel?.toLowerCase() || 'low';
      if (urgencyLevels.hasOwnProperty(urgency)) {
        urgencyLevels[urgency]++;
      }
    });

    return urgencyLevels;
  };

  const combineRecentActivity = (symptomReports, prescriptionAnalyses) => {
    const activities = [];

    symptomReports.slice(0, 5).forEach(report => {
      activities.push({
        type: 'symptom',
        date: report.created_at,
        title: `Symptom Analysis: ${report.symptoms.slice(0, 50)}...`,
        data: report
      });
    });

    prescriptionAnalyses.slice(0, 5).forEach(analysis => {
      activities.push({
        type: 'prescription',
        date: analysis.created_at,
        title: `Prescription Analysis: ${analysis.analysis_result.prescriptionSummary?.totalMedications || 0} medications`,
        data: analysis
      });
    });

    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };

  const identifyRiskFactors = (symptomReports, prescriptionAnalyses) => {
    const risks = [];

    // Check for recurring symptoms
    const symptomFrequency = {};
    symptomReports.forEach(report => {
      if (report.analysis_result?.possibleConditions) {
        report.analysis_result.possibleConditions.forEach(condition => {
          const conditionName = condition.condition || condition.name;
          if (conditionName) {
            symptomFrequency[conditionName] = (symptomFrequency[conditionName] || 0) + 1;
          }
        });
      }
    });

    Object.entries(symptomFrequency).forEach(([condition, count]) => {
      if (count >= 3) {
        risks.push({
          type: 'recurring_condition',
          description: `Recurring ${condition} (${count} times)`,
          severity: 'medium',
          recommendation: 'Consider consulting a healthcare provider for persistent symptoms'
        });
      }
    });

    // Check for drug interactions
    prescriptionAnalyses.forEach(analysis => {
      if (analysis.analysis_result?.drugInteractions) {
        analysis.analysis_result.drugInteractions.forEach(interaction => {
          if (interaction.interactionType === 'Major' || interaction.interactionType === 'Contraindicated') {
            risks.push({
              type: 'drug_interaction',
              description: `${interaction.interactionType} drug interaction: ${interaction.medications.join(' + ')}`,
              severity: 'high',
              recommendation: 'Consult healthcare provider immediately'
            });
          }
        });
      }
    });

    return risks;
  };

  const saveHealthSummary = async (summary) => {
    try {
      const { error } = await supabase
        .from('health_reports')
        .insert([{
          user_id: user.id,
          report_type: 'health_summary',
          report_data: summary,
          conditions_summary: summary.commonConditions.map(c => c.condition),
          medications_summary: summary.commonMedications.map(m => m.medication),
          generated_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving health summary:', error);
    }
  };

  const generatePDFReport = async () => {
    if (!healthSummary) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('Health Summary Report', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
    doc.text(`Patient: ${user.user_metadata?.full_name || user.email}`, pageWidth / 2, 50, { align: 'center' });

    let yPosition = 70;

    // Summary Statistics
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text('Summary Statistics', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Symptom Reports: ${healthSummary.totalSymptomReports}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Prescription Analyses: ${healthSummary.totalPrescriptionAnalyses}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Mood Entries: ${healthSummary.totalMoodEntries}`, 20, yPosition);
    yPosition += 15;

    // Common Conditions
    if (healthSummary.commonConditions.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.text('Common Conditions', 20, yPosition);
      yPosition += 10;

      const conditionsData = healthSummary.commonConditions.map(c => [c.condition, c.count.toString()]);
      doc.autoTable({
        head: [['Condition', 'Frequency']],
        body: conditionsData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 102, 204] }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 30;
    }

    // Common Medications
    if (healthSummary.commonMedications.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.text('Common Medications', 20, yPosition);
      yPosition += 10;

      const medicationsData = healthSummary.commonMedications.map(m => [m.medication, m.count.toString()]);
      doc.autoTable({
        head: [['Medication', 'Frequency']],
        body: medicationsData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 102, 204] }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Risk Factors
    if (healthSummary.riskFactors.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.setTextColor(0, 102, 204);
      doc.text('Risk Factors & Recommendations', 20, yPosition);
      yPosition += 10;

      const riskData = healthSummary.riskFactors.map(risk => [
        risk.description,
        risk.severity,
        risk.recommendation
      ]);

      doc.autoTable({
        head: [['Risk Factor', 'Severity', 'Recommendation']],
        body: riskData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 102, 204] },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 80 }
        }
      });
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Generated by AI Healthcare App', 20, pageHeight - 10);
    }

    // Save the PDF
    doc.save(`health-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderOverviewTab = () => (
    <div className="overview-section">
      {generatingReport ? (
        <div className="generating-report">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Generating health summary...</p>
          </div>
        </div>
      ) : healthSummary ? (
        <div className="health-summary">
          <div className="summary-header">
            <h3>📊 Health Summary Overview</h3>
            <div className="summary-actions">
              <Button onClick={generatePDFReport} className="pdf-btn">
                📄 Download PDF Report
              </Button>
              <Button onClick={generateHealthSummary} variant="outline" className="refresh-btn">
                🔄 Refresh Summary
              </Button>
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-card">
              <h4>📋 Total Reports</h4>
              <div className="stat-value">{healthSummary.totalSymptomReports}</div>
              <div className="stat-label">Symptom Analyses</div>
            </div>
            <div className="stat-card">
              <h4>💊 Prescriptions</h4>
              <div className="stat-value">{healthSummary.totalPrescriptionAnalyses}</div>
              <div className="stat-label">Analyzed</div>
            </div>
            <div className="stat-card">
              <h4>😊 Mood Entries</h4>
              <div className="stat-value">{healthSummary.totalMoodEntries}</div>
              <div className="stat-label">Recorded</div>
            </div>
            <div className="stat-card">
              <h4>📈 Health Trends</h4>
              <div className="stat-value">{healthSummary.healthTrends.symptomFrequency.avgPerWeek}</div>
              <div className="stat-label">Reports/Week</div>
            </div>
          </div>

          <div className="summary-sections">
            <div className="summary-section">
              <h4>🏥 Common Conditions</h4>
              <div className="conditions-grid">
                {healthSummary.commonConditions.map((condition, index) => (
                  <div key={index} className="condition-item">
                    <span className="condition-name">{condition.condition}</span>
                    <span className="condition-count">{condition.count}x</span>
                  </div>
                ))}
                {healthSummary.commonConditions.length === 0 && (
                  <p className="no-data">No conditions identified yet</p>
                )}
              </div>
            </div>

            <div className="summary-section">
              <h4>💊 Common Medications</h4>
              <div className="medications-grid">
                {healthSummary.commonMedications.map((medication, index) => (
                  <div key={index} className="medication-item">
                    <span className="medication-name">{medication.medication}</span>
                    <span className="medication-count">{medication.count}x</span>
                  </div>
                ))}
                {healthSummary.commonMedications.length === 0 && (
                  <p className="no-data">No medications analyzed yet</p>
                )}
              </div>
            </div>

            <div className="summary-section">
              <h4>⚠️ Risk Factors</h4>
              <div className="risk-factors">
                {healthSummary.riskFactors.map((risk, index) => (
                  <div key={index} className={`risk-item ${risk.severity}`}>
                    <div className="risk-header">
                      <span className="risk-type">{risk.type.replace('_', ' ')}</span>
                      <span className={`risk-severity ${risk.severity}`}>{risk.severity}</span>
                    </div>
                    <p className="risk-description">{risk.description}</p>
                    <p className="risk-recommendation">{risk.recommendation}</p>
                  </div>
                ))}
                {healthSummary.riskFactors.length === 0 && (
                  <p className="no-data">No risk factors identified</p>
                )}
              </div>
            </div>

            <div className="summary-section">
              <h4>📅 Recent Activity</h4>
              <div className="recent-activity">
                {healthSummary.recentActivity.map((activity, index) => (
                  <div key={index} className={`activity-item ${activity.type}`}>
                    <div className="activity-icon">
                      {activity.type === 'symptom' ? '🩺' : '💊'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-date">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {healthSummary.recentActivity.length === 0 && (
                  <p className="no-data">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-summary">
          <div className="no-summary-content">
            <h3>📊 Generate Health Summary</h3>
            <p>Create a comprehensive overview of your health data</p>
            <Button onClick={generateHealthSummary} className="generate-btn">
              📊 Generate Summary
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => (
    <div className="reports-section">
      <div className="reports-header">
        <h3>📋 Health Reports History</h3>
        <Button onClick={loadHealthReports} variant="outline" className="refresh-btn">
          🔄 Refresh
        </Button>
      </div>

      <div className="reports-grid">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-header">
              <h4>{report.report_type.replace('_', ' ')}</h4>
              <span className="report-date">
                {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="report-summary">
              {report.conditions_summary && (
                <div className="summary-item">
                  <span className="label">Conditions:</span>
                  <span className="value">{report.conditions_summary.join(', ')}</span>
                </div>
              )}
              {report.medications_summary && (
                <div className="summary-item">
                  <span className="label">Medications:</span>
                  <span className="value">{report.medications_summary.join(', ')}</span>
                </div>
              )}
            </div>
            <div className="report-actions">
              <Button
                onClick={() => setSelectedReport(report)}
                size="small"
                variant="outline"
                className="view-btn"
              >
                👁️ View Details
              </Button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="no-reports">
            <p>No health reports generated yet</p>
            <Button onClick={generateHealthSummary} className="generate-btn">
              📊 Generate First Report
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="health-reports">
      <div className="component-header">
        <h2>📊 Health Reports</h2>
        <p>Comprehensive health data analysis and insights</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports History
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
        {activeTab === 'overview' ? renderOverviewTab() : renderReportsTab()}
      </div>

      {selectedReport && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="modal-header">
              <h3>📋 {selectedReport.report_type.replace('_', ' ')}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedReport(null)}
              >
                ❌
              </button>
            </div>
            <div className="modal-content">
              <pre>{JSON.stringify(selectedReport.report_data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="disclaimer">
        <p>
          <strong>⚠️ Medical Disclaimer:</strong> These reports are for informational purposes only. 
          Always consult with healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
};

export default HealthReports;
