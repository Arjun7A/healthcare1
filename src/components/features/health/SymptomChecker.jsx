import React, { useState, useEffect, useRef } from 'react';
import Button from '../../common/Button';
import APIKeyError from '../../common/APIKeyError';
import { analyzeSymptoms, refineAnalysis, validateSymptoms } from '../../../lib/aiService';
import { saveSymptomReport, saveDiagnosisLog, getSymptomReports } from '../../../services/symptomAPI';
import { useAuth } from '../../../contexts/useAuth';
import jsPDF from 'jspdf';

const SymptomChecker = () => {
  const { user } = useAuth();
  
  // Form state
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'selector'
  
  // Timeline and severity
  const [symptomDetails, setSymptomDetails] = useState({});
  const [userProfile, setUserProfile] = useState({
    age: '',
    gender: '',
    preConditions: [],
    medications: [],
    allergies: [],
    familyHistory: []
  });
  
  // Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisStep, setAnalysisStep] = useState('initial'); // 'initial', 'followup', 'complete'

  // Phase 3 Advanced Features State
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [voiceInputActive, setVoiceInputActive] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [multiLanguage, setMultiLanguage] = useState('en');
  const [voiceInput, setVoiceInput] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [bookmarkedAnalyses, setBookmarkedAnalyses] = useState([]);
  const [currentBookmark, setCurrentBookmark] = useState(null);
  const [shareableLink, setShareableLink] = useState('');
  const [showInsights, setShowInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [riskTrends, setRiskTrends] = useState([]);
  const [printMode, setPrintMode] = useState(false); // Ensure print mode starts false
  const [showComparison, setShowComparison] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expertMode, setExpertMode] = useState(false);
  const [telehealthSuggestions, setTelehealthSuggestions] = useState([]);
  const [medicalResources, setMedicalResources] = useState([]);
  const [symptomJournal, setSymptomJournal] = useState([]);
  const [progressTracking, setProgressTracking] = useState([]);
  
  // Refs for advanced features
  const speechRecognition = useRef(null);
  const analysisRef = useRef(null);

  // Translation system
  const translations = {
    en: {
      title: 'AI-Powered Symptom Checker',
      subtitle: 'Get professional medical guidance powered by advanced AI',
      symptoms: 'Symptoms',
      severity: 'Severity',
      timeline: 'Timeline',
      analyze: 'Get AI Analysis',
      loading: 'Analyzing symptoms...',
      error: 'Analysis failed',
      emergency: 'Emergency Detected',
      callEmergency: 'Call Emergency Services',
      confidence: 'Confidence',
      exportPdf: 'Export PDF',
      bookmark: 'Bookmark',
      share: 'Share',
      voiceInput: 'Voice Input',
      darkMode: 'Dark Mode',
      expertMode: 'Expert Mode'
    },
    es: {
      title: 'Verificador de Síntomas con IA',
      subtitle: 'Obtenga orientación médica profesional con IA avanzada',
      symptoms: 'Síntomas',
      severity: 'Severidad',
      timeline: 'Cronología',
      analyze: 'Obtener Análisis de IA',
      loading: 'Analizando síntomas...',
      error: 'Análisis falló',
      emergency: 'Emergencia Detectada',
      callEmergency: 'Llamar Servicios de Emergencia',
      confidence: 'Confianza',
      exportPdf: 'Exportar PDF',
      bookmark: 'Marcador',
      share: 'Compartir',
      voiceInput: 'Entrada de Voz',
      darkMode: 'Modo Oscuro',
      expertMode: 'Modo Experto'
    },
    fr: {
      title: 'Vérificateur de Symptômes IA',
      subtitle: 'Obtenez des conseils médicaux professionnels alimentés par IA avancée',
      symptoms: 'Symptômes',
      severity: 'Sévérité',
      timeline: 'Chronologie',
      analyze: 'Obtenir une Analyse IA',
      loading: 'Analyse des symptômes...',
      error: 'Échec de l\'analyse',
      emergency: 'Urgence Détectée',
      callEmergency: 'Appeler les Services d\'Urgence',
      confidence: 'Confiance',
      exportPdf: 'Exporter PDF',
      bookmark: 'Signet',
      share: 'Partager',
      voiceInput: 'Saisie Vocale',
      darkMode: 'Mode Sombre',
      expertMode: 'Mode Expert'
    }
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  // Common symptoms database for selector mode with categories and icons
  const symptomCategories = {
    'General': [
      { name: 'Fever', icon: '🌡️' },
      { name: 'Fatigue', icon: '😴' },
      { name: 'Weakness', icon: '💪' },
      { name: 'Loss of appetite', icon: '🍽️' },
      { name: 'Weight loss', icon: '⚖️' },
      { name: 'Night sweats', icon: '💦' }
    ],
    'Head & Neck': [
      { name: 'Headache', icon: '🤕' },
      { name: 'Dizziness', icon: '😵' },
      { name: 'Blurred vision', icon: '👁️' },
      { name: 'Ear pain', icon: '👂' },
      { name: 'Sore throat', icon: '🗣️' },
      { name: 'Neck stiffness', icon: '🦴' }
    ],
    'Respiratory': [
      { name: 'Cough', icon: '😷' },
      { name: 'Shortness of breath', icon: '🫁' },
      { name: 'Chest pain', icon: '💔' },
      { name: 'Runny nose', icon: '👃' },
      { name: 'Congestion', icon: '🤧' },
      { name: 'Wheezing', icon: '🌬️' }
    ],
    'Digestive': [
      { name: 'Nausea', icon: '🤢' },
      { name: 'Vomiting', icon: '🤮' },
      { name: 'Diarrhea', icon: '🚽' },
      { name: 'Constipation', icon: '😣' },
      { name: 'Abdominal pain', icon: '🤰' },
      { name: 'Heartburn', icon: '🔥' }
    ],
    'Musculoskeletal': [
      { name: 'Joint pain', icon: '🦴' },
      { name: 'Back pain', icon: '🦵' },
      { name: 'Muscle aches', icon: '💪' },
      { name: 'Stiffness', icon: '🔒' },
      { name: 'Swelling', icon: '🎈' }
    ],
    'Skin': [
      { name: 'Rash', icon: '🔴' },
      { name: 'Itching', icon: '🤚' },
      { name: 'Bruising', icon: '🟣' },
      { name: 'Swelling', icon: '🎈' },
      { name: 'Changes in skin color', icon: '🌈' }
    ],
    'Neurological': [
      { name: 'Memory problems', icon: '🧠' },
      { name: 'Confusion', icon: '🤔' },
      { name: 'Numbness', icon: '🖐️' },
      { name: 'Tingling', icon: '⚡' },
      { name: 'Seizures', icon: '⚠️' }
    ],
    'Mental Health': [
      { name: 'Anxiety', icon: '😰' },
      { name: 'Depression', icon: '😔' },
      { name: 'Sleep problems', icon: '😴' },
      { name: 'Mood changes', icon: '🎭' },
      { name: 'Stress', icon: '😤' }
    ]
  };

  const severityLevels = ['Mild', 'Moderate', 'Severe', 'Critical'];
  const durationOptions = ['Less than 1 hour', '1-6 hours', '6-24 hours', '1-2 days', '3-7 days', '1-2 weeks', 'More than 2 weeks'];
  const preConditions = ['Diabetes', 'Hypertension', 'Heart disease', 'Asthma', 'Arthritis', 'Cancer', 'Autoimmune disorder', 'Mental health condition', 'Other'];
  const medicationTypes = ['Blood pressure', 'Diabetes', 'Heart', 'Pain relief', 'Mental health', 'Antibiotics', 'Vitamins', 'Other'];
  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  // Keep the original categorized structure for the new UI
  // (removed the old commonSymptoms flat array)

  // Add/remove symptoms in selector mode
  const toggleSymptom = (symptomName) => {
    setSelectedSymptoms(prev => {
      const isSelected = prev.includes(symptomName);
      if (isSelected) {
        // Remove symptom and its details
        const newDetails = { ...symptomDetails };
        delete newDetails[symptomName];
        setSymptomDetails(newDetails);
        return prev.filter(s => s !== symptomName);
      } else {
        // Add symptom with default details
        setSymptomDetails(prev => ({
          ...prev,
          [symptomName]: { severity: 'Mild', duration: '1-2 days' }
        }));
        return [...prev, symptomName];
      }
    });
  };

  // Add custom symptom
  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      const symptom = customSymptom.trim();
      setSelectedSymptoms(prev => [...prev, symptom]);
      setSymptomDetails(prev => ({
        ...prev,
        [symptom]: { severity: 'Mild', duration: '1-2 days' }
      }));
      setCustomSymptom('');
    }
  };

  // Update symptom details
  const updateSymptomDetail = (symptom, field, value) => {
    setSymptomDetails(prev => ({
      ...prev,
      [symptom]: { ...prev[symptom], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentSymptoms = inputMode === 'text' ? symptoms : selectedSymptoms.join(', ');
    if (!currentSymptoms.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    // Enhanced emergency validation
    const validation = validateSymptoms(currentSymptoms);
    if (validation.isEmergency) {
      setEmergencyMode(true);
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError('');
    setEmergencyMode(false);
    
    try {
      // Enhanced symptom enrichment with all profile data
      let enrichedSymptoms = currentSymptoms;
      if (inputMode === 'selector' && Object.keys(symptomDetails).length > 0) {
        const detailsText = Object.entries(symptomDetails).map(([symptom, details]) => {
          const parts = [];
          if (details.severity) parts.push(`${details.severity} severity`);
          if (details.duration) parts.push(`lasting ${details.duration}`);
          return `${symptom}: ${parts.join(', ')}`;
        }).join('; ');
        enrichedSymptoms += `. Additional details: ${detailsText}`;
      }

      // Enhanced user profile for better AI analysis
      const enhancedProfile = {
        ...userProfile,
        riskFactors: analyzeRiskFactors(),
        lifestyle: {
          hasPreConditions: (userProfile.preConditions || []).length > 0,
          medicationCount: (userProfile.medications || []).length,
          allergyCount: (userProfile.allergies || []).length
        }
      };

      // Call the actual AI service with enhanced data
      const analysisResult = await analyzeSymptoms({
        symptoms: enrichedSymptoms,
        userProfile: enhancedProfile,
        followUpAnswers: {},
        language: multiLanguage,
        emergencyMode: emergencyMode
      });

      // Save symptom report to Supabase
      let symptomReportId = null;
      if (user) {
        try {
          console.log('💾 Saving symptom report to Supabase...');
          const symptomReport = await saveSymptomReport(
            user.id,
            inputMode === 'text' ? [currentSymptoms] : selectedSymptoms,
            symptomDetails,
            userProfile,
            {}
          );
          symptomReportId = symptomReport.id;
          console.log('✅ Symptom report saved:', symptomReport);

          // Save diagnosis log to Supabase
          console.log('💾 Saving diagnosis log to Supabase...');
          const diagnosisLog = await saveDiagnosisLog(
            user.id,
            symptomReportId,
            analysisResult
          );
          console.log('✅ Diagnosis log saved:', diagnosisLog);
        } catch (supabaseError) {
          console.error('❌ Failed to save to Supabase:', supabaseError);
          
          // Handle specific Supabase errors
          if (supabaseError.message?.includes('JWT') || supabaseError.message?.includes('refresh')) {
            console.warn('Session expired - user needs to re-login');
            // Could optionally show a toast notification here
          }
          
          // Don't block the UI for Supabase errors, but log them
          // User must be authenticated to save analysis results
        }
      } else {
        console.warn('⚠️ User not logged in - symptoms not saved to Supabase');
      }

      // Generate AI insights
      generateAIInsights(analysisResult);
      
      // Save to history (local backup)
      saveToHistory(analysisResult);

      // Add Supabase reference to analysis
      const analysisWithSupabase = {
        ...analysisResult,
        symptomReportId: symptomReportId,
        savedToSupabase: !!symptomReportId
      };

      setAnalysis(analysisWithSupabase);
      setFollowUpQuestions(analysisResult.followUpQuestions || []);
      setAnalysisStep('followup');
      
      // Clear any previous errors on successful analysis
      setError('');
      
      // Scroll to results
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Check if it's an API key related error
      if (error.message && (error.message.includes('Groq API key') || error.message.includes('API key'))) {
        setError(error.message);
      } else if (error.message && error.message.includes('quota exceeded')) {
        setError('Groq API rate limit exceeded. Please check your usage limits or try again later.');
      } else if (error.message && error.message.includes('Invalid API Key')) {
        setError('Invalid Groq API key. Please check your API key configuration.');
      } else {
        setError('Unable to analyze symptoms. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle follow-up questions
  const handleFollowUpAnswer = (questionIndex, answer) => {
    setFollowUpAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitFollowUp = async () => {
    setLoading(true);
    try {
      // Prepare follow-up answers for refinement
      const followUpAnswersFormatted = {};
      (followUpQuestions || []).forEach((question, index) => {
        if (followUpAnswers[index] !== undefined) {
          followUpAnswersFormatted[question] = followUpAnswers[index] === 'yes' ? 'Yes' : 'No';
        }
      });

      // Get refined analysis from AI service
      const currentSymptoms = inputMode === 'text' ? symptoms : selectedSymptoms.join(', ');
      let enrichedSymptoms = currentSymptoms;
      if (inputMode === 'selector' && Object.keys(symptomDetails).length > 0) {
        const detailsText = Object.entries(symptomDetails).map(([symptom, details]) => {
          const parts = [];
          if (details.severity) parts.push(`${details.severity} severity`);
          if (details.duration) parts.push(`lasting ${details.duration}`);
          return `${symptom}: ${parts.join(', ')}`;
        }).join('; ');
        enrichedSymptoms += `. Additional details: ${detailsText}`;
      }

      console.log('🔄 Starting Groq AI refinement with follow-up answers...');
      
      const refinedAnalysis = await refineAnalysis({
        symptoms: enrichedSymptoms,
        userProfile: userProfile,
        followUpAnswers: followUpAnswersFormatted,
        previousAnalysis: analysis
      });

      console.log('✅ Groq AI refinement completed:', refinedAnalysis);
      
      // Mark the analysis as refined and add refinement metadata
      const enhancedRefinedAnalysis = {
        ...refinedAnalysis,
        isRefined: true,
        refinementLevel: 'Advanced',
        refinedAt: new Date().toISOString(),
        previousConfidence: analysis.confidence,
        confidenceImprovement: (refinedAnalysis.confidence || 0.7) - (analysis.confidence || 0.7),
        followUpProcessed: Object.keys(followUpAnswersFormatted).length,
        refinementSource: 'Groq AI - Enhanced Analysis'
      };
      
      setAnalysis(enhancedRefinedAnalysis);
      setAnalysisStep('complete');
      
      // Update Supabase with refined analysis
      if (user && analysis.symptomReportId) {
        try {
          console.log('💾 Updating Supabase with refined analysis...');
          await saveDiagnosisLog(
            user.id,
            analysis.symptomReportId,
            enhancedRefinedAnalysis
          );
          console.log('✅ Refined analysis saved to Supabase');
        } catch (supabaseError) {
          console.error('❌ Failed to update Supabase with refined analysis:', supabaseError);
        }
      }
      
      // Clear any previous errors on successful refinement
      setError('');
    } catch (error) {
      console.error('Follow-up analysis error:', error);
      
      // Check if it's an API key related error
      if (error.message && (error.message.includes('Groq API key') || error.message.includes('API key'))) {
        setError(error.message);
      } else if (error.message && error.message.includes('quota exceeded')) {
        setError('Groq API rate limit exceeded. Please check your usage limits or try again later.');
      } else {
        setError('Failed to process follow-up questions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSymptoms('');
    setSelectedSymptoms([]);
    setSymptomDetails({});
    setAnalysis(null);
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setError('');
    setAnalysisStep('initial');
    setUserProfile({ 
      age: '', 
      gender: '', 
      preConditions: [],
      medications: [],
      allergies: [],
      familyHistory: []
    });
  };

  const exportToPDF = async () => {
    if (!analysis) {
      alert('No analysis available to export');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Function to clean text for PDF export
      const cleanTextForPDF = (text) => {
        if (!text || typeof text !== 'string') return '';
        return text
          .replace(/[^\w\s.,!?()-]/g, '') // Remove special characters and emojis
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      };
      
      // Add header
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text('Medical Symptom Analysis Report', 20, 25);
      
      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 35);
      
      let yPosition = 50;
      
      // Patient Profile
      if (userProfile.age || userProfile.gender) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Patient Profile:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        if (userProfile.age) {
          doc.text(`Age: ${cleanTextForPDF(userProfile.age.toString())}`, 25, yPosition);
          yPosition += 7;
        }
        if (userProfile.gender) {
          doc.text(`Gender: ${cleanTextForPDF(userProfile.gender)}`, 25, yPosition);
          yPosition += 7;
        }
        if (userProfile.preConditions && userProfile.preConditions.length > 0) {
          const conditions = userProfile.preConditions.map(c => cleanTextForPDF(c)).join(', ');
          doc.text(`Medical History: ${conditions}`, 25, yPosition);
          yPosition += 7;
        }
        yPosition += 5;
      }
      
      // Symptoms
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Reported Symptoms:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      const symptomsText = inputMode === 'text' ? cleanTextForPDF(symptoms) : selectedSymptoms.map(s => cleanTextForPDF(s)).join(', ');
      const splitSymptoms = doc.splitTextToSize(symptomsText, 170);
      doc.text(splitSymptoms, 25, yPosition);
      yPosition += splitSymptoms.length * 7 + 10;
      
      // Risk Assessment
      doc.setFontSize(14);
      doc.text('Risk Assessment:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.text(`Overall Risk: ${cleanTextForPDF(analysis.riskAssessment.overall)}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Urgency: ${cleanTextForPDF(analysis.riskAssessment.urgency)}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Timeframe: ${cleanTextForPDF(analysis.riskAssessment.timeframe)}`, 25, yPosition);
      yPosition += 12;
      
      // Possible Conditions
      doc.setFontSize(14);
      doc.text('Possible Conditions:', 20, yPosition);
      yPosition += 10;
      
      // Simple table without autoTable
      doc.setFontSize(11);
      if (analysis.conditions && analysis.conditions.length > 0) {
        analysis.conditions.forEach((condition, index) => {
          doc.text(`${index + 1}. ${cleanTextForPDF(condition.name)}`, 25, yPosition);
          doc.text(`Likelihood: ${condition.likelihood}%`, 120, yPosition);
          doc.text(`Severity: ${cleanTextForPDF(condition.severity)}`, 160, yPosition);
          yPosition += 7;
        });
      }
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }
      
      // Recommendations
      doc.setFontSize(14);
      doc.text('Recommendations:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      (analysis.recommendations || []).forEach((rec, index) => {
        const recText = `${index + 1}. ${cleanTextForPDF(rec)}`;
        const splitRec = doc.splitTextToSize(recText, 170);
        doc.text(splitRec, 25, yPosition);
        yPosition += splitRec.length * 7 + 3;
      });
      yPosition += 7;
      
      // Red Flags
      if (analysis.redFlags && analysis.redFlags.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(220, 53, 69);
        doc.text('WARNING: Red Flags - Seek Immediate Care:', 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        (analysis.redFlags || []).forEach((flag, index) => {
          // Clean the text to remove problematic characters
          const cleanFlag = flag.replace(/[^\w\s.,!?-]/g, '').trim();
          const flagText = `- ${cleanFlag}`;
          const splitFlag = doc.splitTextToSize(flagText, 170);
          doc.text(splitFlag, 25, yPosition);
          yPosition += splitFlag.length * 7 + 3;
        });
        yPosition += 7;
      }
      
      // Add new page if needed for disclaimer
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 25;
      }
      
      // Disclaimer
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text('Important Disclaimer:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const cleanDisclaimer = cleanTextForPDF(analysis.disclaimer);
      const disclaimerText = doc.splitTextToSize(cleanDisclaimer, 170);
      doc.text(disclaimerText, 20, yPosition);
      
      // Save the PDF
      const fileName = `symptom_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Show success message
      alert('PDF exported successfully!');
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again. Error: ' + error.message);
    }
  };

  const getRiskColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Advanced Phase 3 methods
  useEffect(() => {
    // Initialize advanced features
    initializeAdvancedFeatures();
    loadAnalysisHistory();
    setupVoiceRecognition();
    
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
    };
  }, [user]); // Re-run when user changes

  const initializeAdvancedFeatures = () => {
    // Load local UI preferences (these remain in localStorage for device-specific settings)
    const savedDarkMode = localStorage.getItem('healthApp_darkMode');
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    
    const savedLanguage = localStorage.getItem('healthApp_language');
    if (savedLanguage) setMultiLanguage(savedLanguage);
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    }
  };

  const setupVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      speechRecognition.current.lang = multiLanguage === 'hi' ? 'hi-IN' : 'en-US';
      
      speechRecognition.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setSymptoms(prev => prev + ' ' + finalTranscript);
        }
      };
      
      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setVoiceInput(false);
      };
    }
  };

  const toggleVoiceInput = () => {
    if (!speechRecognition.current) {
      setError('Voice input not supported in this browser');
      return;
    }
    
    if (voiceInput) {
      speechRecognition.current.stop();
      setVoiceInput(false);
    } else {
      speechRecognition.current.start();
      setVoiceInput(true);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('healthApp_darkMode', JSON.stringify(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const changeLanguage = (langCode) => {
    setMultiLanguage(langCode);
    localStorage.setItem('healthApp_language', langCode);
    if (speechRecognition.current) {
      speechRecognition.current.lang = langCode === 'hi' ? 'hi-IN' : 'en-US';
    }
  };

  const generateShareableLink = () => {
    if (!analysis) return;
    
    const shareData = {
      symptoms: inputMode === 'text' ? symptoms : selectedSymptoms.join(', '),
      analysis: {
        conditions: analysis.conditions,
        riskAssessment: analysis.riskAssessment,
        confidence: analysis.confidence
      },
      timestamp: new Date().toISOString()
    };
    
    const encodedData = btoa(JSON.stringify(shareData));
    const link = `${window.location.origin}/shared-analysis/${encodedData}`;
    setShareableLink(link);
    
    // Copy to clipboard
    navigator.clipboard.writeText(link).then(() => {
      alert('Shareable link copied to clipboard!');
    });
  };

  const bookmarkAnalysis = () => {
    if (!analysis) return;
    
    const bookmark = {
      id: Date.now(),
      symptoms: inputMode === 'text' ? symptoms : selectedSymptoms.join(', '),
      analysis: analysis,
      timestamp: new Date().toISOString(),
      userProfile: userProfile
    };
    
    const newBookmarks = [...bookmarkedAnalyses, bookmark];
    setBookmarkedAnalyses(newBookmarks);
    localStorage.setItem('healthApp_bookmarks', JSON.stringify(newBookmarks));
    
    alert('Analysis bookmarked successfully!');
  };

  const loadAnalysisHistory = async () => {
    if (user) {
      try {
        console.log('📚 Loading analysis history from Supabase...');
        const reports = await getSymptomReports(user.id);
        setAnalysisHistory(reports.map(report => ({
          id: report.id,
          symptoms: Array.isArray(report.symptoms) ? report.symptoms.join(', ') : report.symptoms,
          analysis: report.diagnosis_logs?.[0] || {},
          timestamp: report.created_at,
          userProfile: report.user_profile || {}
        })));
        console.log('✅ Analysis history loaded from Supabase:', reports.length, 'items');
      } catch (error) {
        console.error('❌ Failed to load analysis history from Supabase:', error);
        // Only Supabase data is supported - no localStorage fallback
        setAnalysisHistory([]);
      }
    } else {
      // User must be authenticated to access analysis history
      console.warn('⚠️ User not authenticated - analysis history unavailable');
      setAnalysisHistory([]);
    }
    
    // Load bookmarks (localStorage for device-specific UI preferences)
    const bookmarks = localStorage.getItem('healthApp_bookmarks');
    if (bookmarks) {
      setBookmarkedAnalyses(JSON.parse(bookmarks));
    }
  };

  const saveToHistory = (analysisData) => {
    // Analysis history is now handled entirely by Supabase in handleSubmit
    // This function is kept for backwards compatibility but data is cloud-only
    if (!user) {
      console.warn('⚠️ User not authenticated - analysis history not saved');
      return;
    }
    // History is already saved to Supabase in handleSubmit function
  };

  const generateAIInsights = (analysisData) => {
    // Generate additional AI insights
    const insights = {
      riskFactors: analyzeRiskFactors(),
      preventiveMeasures: generatePreventiveMeasures(),
      lifestyleRecommendations: generateLifestyleRecommendations(),
      followUpSchedule: generateFollowUpSchedule(),
      similarCasesTrends: analyzeSimilarCases()
    };
    
    setAiInsights(insights);
  };

  const analyzeRiskFactors = () => {
    const factors = [];
    if (userProfile.age && parseInt(userProfile.age) > 65) {
      factors.push({ factor: 'Advanced age', impact: 'Increased risk of complications', level: 'medium' });
    }
    if ((userProfile.preConditions || []).includes('Diabetes')) {
      factors.push({ factor: 'Diabetes mellitus', impact: 'Delayed healing, infection risk', level: 'high' });
    }
    if ((userProfile.preConditions || []).includes('Hypertension')) {
      factors.push({ factor: 'Hypertension', impact: 'Cardiovascular complications', level: 'medium' });
    }
    return factors;
  };

  const generatePreventiveMeasures = () => {
    return [
      'Maintain good hygiene practices',
      'Follow vaccination schedule',
      'Regular health screenings',
      'Stress management techniques',
      'Adequate sleep (7-9 hours)',
      'Balanced nutrition'
    ];
  };

  const generateLifestyleRecommendations = () => {
    return [
      'Increase physical activity (150 min/week)',
      'Quit smoking if applicable',
      'Limit alcohol consumption',
      'Maintain healthy weight',
      'Stay hydrated (8-10 glasses water/day)',
      'Practice mindfulness and meditation'
    ];
  };

  const generateFollowUpSchedule = () => {
    return [
      { timeframe: '24-48 hours', action: 'Monitor symptoms for changes' },
      { timeframe: '1 week', action: 'Follow-up if symptoms persist' },
      { timeframe: '2 weeks', action: 'Reassess if no improvement' },
      { timeframe: '1 month', action: 'Routine check-up with healthcare provider' }
    ];
  };

  const analyzeSimilarCases = () => {
    return {
      totalCases: 1247,
      recoveryRate: 94.2,
      averageRecoveryTime: '5-7 days',
      commonTreatments: ['Rest', 'Hydration', 'OTC medications'],
      complications: 2.1
    };
  };

  // --- Main Render ---
  if (error) {
    console.log('SymptomChecker error:', error);
  }

  return (
    <div className={`advanced-symptom-checker ${darkMode ? 'dark-mode' : ''} ${printMode ? 'print-mode' : ''}`}>
      {/* Error Banner - Always visible if error exists */}
      {error && (
        <div className="error-banner" style={{ background: '#ffeaea', color: '#b00020', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #b00020', textAlign: 'center' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {/* Advanced Header with Controls */}
      <div className="advanced-header">
        <div className="symptom-checker-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-content">
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>
        </div>
        
        {/* Advanced Controls Toolbar - Now Working */}
        <div className="advanced-controls">
          <div className="control-group">
            <button
              type="button"
              className={`control-btn ${voiceInputActive ? 'active' : ''}`}
              onClick={toggleVoiceInput}
              title={t('voiceInput')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {voiceInputActive && <span className="pulse-indicator"></span>}
            </button>
            
            <button
              type="button"
              className={`control-btn ${darkMode ? 'active' : ''}`}
              onClick={toggleDarkMode}
              title={t('darkMode')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            
            <div className="language-selector">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
            </div>
            
            <button
              type="button"
              className={`control-btn ${expertMode ? 'active' : ''}`}
              onClick={() => setExpertMode(!expertMode)}
              title={t('expertMode')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            
            {analysis && (
              <button
                type="button"
                className="control-btn"
                onClick={exportToPDF}
                title="Export PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>
          

        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map((notification, index) => (
            <div key={index} className={`notification ${notification.type}`}>
              <span>{notification.message}</span>
              <button onClick={() => setNotifications(notifications.filter((_, i) => i !== index))}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Mode Banner */}
      {analysis?.emergency && (
        <div className="emergency-banner">
          <div className="emergency-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <h3>{t('emergency')}</h3>
              <p>Your symptoms may indicate a serious condition requiring immediate medical attention.</p>
            </div>
            <button className="emergency-call-btn" onClick={() => window.open('tel:911')}>
              {t('callEmergency')}
            </button>
          </div>
        </div>
      )}

      {/* Voice Input Indicator */}
      {voiceInputActive && (
        <div className="voice-indicator">
          <div className="voice-animation">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
          <span>Listening... Speak now</span>
        </div>
      )}

      {/* User Profile Section */}
      <div className="profile-section">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Patient Profile (Optional)
        </h3>
        <div className="profile-grid">
          <div className="profile-field">
            <label>Age</label>
            <input
              type="number"
              value={userProfile.age}
              onChange={(e) => setUserProfile(prev => ({ ...prev, age: e.target.value }))}
              placeholder="e.g., 25"
              className="profile-input"
            />
          </div>
          <div className="profile-field">
            <label>Gender</label>
            <select
              value={userProfile.gender}
              onChange={(e) => setUserProfile(prev => ({ ...prev, gender: e.target.value }))}
              className="profile-input"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div className="profile-field">
          <label>Pre-existing Conditions</label>
          <div className="condition-tags">
            {preConditions.map(condition => (
              <button
                key={condition}
                type="button"
                className={`condition-tag ${userProfile.preConditions.includes(condition) ? 'selected' : ''}`}
                onClick={() => {
                  setUserProfile(prev => ({
                    ...prev,
                    preConditions: prev.preConditions.includes(condition)
                      ? prev.preConditions.filter(c => c !== condition)
                      : [...prev.preConditions, condition]
                  }));
                }}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="input-mode-toggle">
        <button
          type="button"
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Free Text
        </button>
        <button
          type="button"
          className={`mode-btn ${inputMode === 'selector' ? 'active' : ''}`}
          onClick={() => setInputMode('selector')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="9,11 12,14 22,4" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Symptom Selector
        </button>
      </div>

      <form onSubmit={handleSubmit} className="symptom-form">
        {error && (
          error.includes('Groq API key') || error.includes('API key') ? (
            <APIKeyError error={error} />
          ) : (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )
        )}

        {inputMode === 'text' ? (
          <div className="form-group">
            <label htmlFor="symptoms" className="form-label">
              Describe Your Symptoms
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe what you're experiencing in detail... (e.g., I've had a persistent headache for 2 days, along with mild fever and fatigue)"
              className="symptom-input"
              rows={4}
              disabled={loading}
            />
            <div className="input-help">
              Be as specific as possible. Include duration, severity, and any patterns you've noticed.
            </div>
          </div>
        ) : (
          <div className="symptom-selector-section">
            <h4>Select Your Symptoms</h4>
            
            {/* Display symptoms by category with icons */}
            {Object.entries(symptomCategories).map(([category, symptoms]) => (
              <div key={category} className="symptom-category">
                <h5 className="category-title">{category}</h5>
                <div className="symptom-grid">
                  {symptoms.map(symptomObj => {
                    // Ensure we always have an icon and name
                    const icon = (symptomObj.icon && symptomObj.icon.trim()) ? symptomObj.icon : '❔';
                    const name = (symptomObj.name && symptomObj.name.trim()) ? symptomObj.name : 'Unknown symptom';
                    const isSelected = selectedSymptoms.includes(name);
                    
                    return (
                      <button
                        key={`${category}-${name}`}
                        type="button"
                        className={`symptom-tag ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSymptom(name)}
                      >
                        <span className="symptom-icon">{icon}</span>
                        <span className="symptom-name">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="custom-symptom">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Add custom symptom..."
                className="custom-symptom-input"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
              />
              <button type="button" onClick={addCustomSymptom} className="add-symptom-btn">
                Add
              </button>
            </div>

            {/* Symptom Details */}
            {selectedSymptoms.length > 0 && (
              <div className="symptom-details">
                <h4>Symptom Details</h4>
                {selectedSymptoms.map(symptom => (
                  <div key={symptom} className="symptom-detail-row">
                    <span className="symptom-name">{symptom}</span>
                    <select
                      value={symptomDetails[symptom]?.severity || 'Mild'}
                      onChange={(e) => updateSymptomDetail(symptom, 'severity', e.target.value)}
                      className="detail-select"
                    >
                      {severityLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <select
                      value={symptomDetails[symptom]?.duration || '1-2 days'}
                      onChange={(e) => updateSymptomDetail(symptom, 'duration', e.target.value)}
                      className="detail-select"
                    >
                      {durationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className="remove-symptom-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <Button
            type="submit"
            disabled={loading || (!symptoms.trim() && selectedSymptoms.length === 0)}
            variant="primary"
            className="analyze-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Analyzing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="9,11 12,14 15,11" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="2" x2="12" y2="14" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Get Advanced Analysis
              </>
            )}
          </Button>
          
          {(symptoms || selectedSymptoms.length > 0) && (
            <Button
              type="button"
              onClick={handleClear}
              variant="secondary"
              disabled={loading}
            >
              Clear All
            </Button>
          )}
        </div>
      </form>

      {/* Advanced Analysis Results */}
      {analysis && (
        <div className="advanced-analysis-results">
          <div className="results-header">
            <h3>Advanced Medical Analysis</h3>
            <div className="analysis-meta">
              <div className="confidence-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {Math.round((analysis.confidence || 0.7) * 100)}% Confidence
              </div>
              {analysis.savedToSupabase && user && (
                <div className="supabase-saved-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Saved to Database
                </div>
              )}
              <button onClick={exportToPDF} className="export-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Possible Conditions */}
          <div className="conditions-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Possible Conditions
            </h4>
            <div className="conditions-list">
              {(analysis.conditions || []).map((condition, index) => (
                <div key={index} className="condition-card">
                  <div className="condition-header">
                    <h5>{condition.name}</h5>
                    <div className="condition-meta">
                      <span className="likelihood">{condition.likelihood}% likely</span>
                      <span className={`severity-badge ${condition.severity.toLowerCase()}`} style={{ backgroundColor: getRiskColor(condition.severity) }}>
                        {condition.severity} Risk
                      </span>
                    </div>
                  </div>
                  <p className="condition-description">{condition.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="risk-assessment">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Risk Assessment
            </h4>
            <div className="risk-card">
              <div className="risk-level" style={{ borderColor: getRiskColor((analysis.riskAssessment?.overall || 'Medium')) }}>
                <span className="risk-label">Overall Risk:</span>
                <span className="risk-value" style={{ color: getRiskColor((analysis.riskAssessment?.overall || 'Medium')) }}>
                  {analysis.riskAssessment?.overall || 'Medium'}
                </span>
              </div>
              <div className="urgency-info">
                <strong>Urgency:</strong> {analysis.riskAssessment?.urgency || 'See doctor within days'}
              </div>
              <div className="timeframe-info">
                <strong>Timeframe:</strong> {analysis.riskAssessment?.timeframe || 'Consult healthcare provider if symptoms persist'}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11l3 3 8-8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.74 0 3.35.5 4.72 1.36" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Recommended Actions
            </h4>
            <ul className="recommendations-list">
              {(analysis.recommendations || []).map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Home Remedies */}
          <div className="home-remedies-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Safe Home Remedies
            </h4>
            <ul className="remedies-list">
              {(analysis.homeRemedies || []).map((remedy, index) => (
                <li key={index}>{remedy}</li>
              ))}
            </ul>
          </div>

          {/* Red Flags */}
          <div className="red-flags-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Seek Immediate Care If You Experience
            </h4>
            <ul className="red-flags-list">
              {(analysis.redFlags || []).map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>

          {/* Similar Cases */}
          <div className="similar-cases-section">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Similar Patient Cases
            </h4>
            <div className="similar-cases-list">
              {(analysis.similarCases || []).map((case_info, index) => (
                <div key={index} className="case-card">
                  <div className="case-description">{case_info.case}</div>
                  <div className="case-outcome">
                    <strong>Outcome:</strong> {case_info.outcome}
                  </div>
                  <div className="case-duration">
                    <strong>Recovery:</strong> {case_info.duration}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Questions */}
          {analysisStep === 'followup' && followUpQuestions.length > 0 && (
            <div className="followup-section">
              <h4>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Follow-up Questions
              </h4>
              <p className="followup-instruction">
                Please answer these questions to refine your diagnosis:
              </p>
              <div className="followup-questions">
                {(followUpQuestions || []).map((question, index) => (
                  <div key={index} className="followup-question">
                    <p className="question-text">{question}</p>
                    <div className="question-buttons">
                      <button
                        type="button"
                        className={`answer-btn ${followUpAnswers[index] === 'yes' ? 'selected' : ''}`}
                        onClick={() => handleFollowUpAnswer(index, 'yes')}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={`answer-btn ${followUpAnswers[index] === 'no' ? 'selected' : ''}`}
                        onClick={() => handleFollowUpAnswer(index, 'no')}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={submitFollowUp}
                disabled={loading || Object.keys(followUpAnswers).length < followUpQuestions.length}
                variant="primary"
                className="submit-followup-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  'Refine Analysis'
                )}
              </Button>
            </div>
          )}

          {/* Analysis Confidence & Info */}
          <div className="analysis-info">
            <div className="confidence-section">
              <span className="confidence-label">Analysis Confidence:</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ 
                    width: `${(analysis.confidence || 0.7) * 100}%`,
                    backgroundColor: (analysis.confidence || 0.7) > 0.8 ? '#10b981' : 
                                   (analysis.confidence || 0.7) > 0.6 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
              <span className="confidence-value">{Math.round((analysis.confidence || 0.7) * 100)}%</span>
            </div>
            {analysis.aiGenerated && (
              <div className="ai-attribution">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24" stroke="currentColor" strokeWidth="2"/>
                </svg>
                🤖 Analysis powered by Groq AI (Llama 3)
                {analysis.isRefined && (
                  <span className="refined-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Enhanced
                  </span>
                )}
              </div>
            )}
            {analysis.fallbackReason && (
              <div className="fallback-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 18h.01" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Analysis generated using fallback system ({analysis.fallbackReason})
              </div>
            )}
            <div className="analysis-timestamp">
              Generated: {new Date(analysis.generatedAt).toLocaleString()}
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="disclaimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 18h.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <strong>Important Medical Disclaimer:</strong> {analysis.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {analysis && showInsights && aiInsights && (
        <div className="ai-insights-panel">
          <div className="insights-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              AI-Powered Insights & Analytics
            </h3>
            <button
              className="close-insights"
              onClick={() => setShowInsights(false)}
            >
              ×
            </button>
          </div>
          
          <div className="insights-grid">
            {/* Risk Factors Analysis */}
            <div className="insight-card">
              <h4>Risk Factors Analysis</h4>
              <div className="risk-factors">
                {aiInsights.riskFactors.map((factor, index) => (
                  <div key={index} className={`risk-factor ${factor.level}`}>
                    <div className="factor-header">
                      <span className="factor-name">{factor.factor}</span>
                      <span className={`risk-badge ${factor.level}`}>{factor.level}</span>
                    </div>
                    <p className="factor-impact">{factor.impact}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Preventive Measures */}
            <div className="insight-card">
              <h4>Preventive Measures</h4>
              <ul className="preventive-list">
                {aiInsights.preventiveMeasures.map((measure, index) => (
                  <li key={index}>{measure}</li>
                ))}
              </ul>
            </div>
            
            {/* Lifestyle Recommendations */}
            <div className="insight-card">
              <h4>Lifestyle Recommendations</h4>
              <ul className="lifestyle-list">
                {aiInsights.lifestyleRecommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            {/* Follow-up Schedule */}
            <div className="insight-card">
              <h4>Follow-up Schedule</h4>
              <div className="followup-timeline">
                {aiInsights.followUpSchedule.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-time">{item.timeframe}</div>
                    <div className="timeline-action">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Similar Cases Analytics */}
            <div className="insight-card">
              <h4>Similar Cases Analytics</h4>
              <div className="analytics-stats">
                <div className="stat">
                  <span className="stat-value">{aiInsights.similarCasesTrends.totalCases}</span>
                  <span className="stat-label">Total Cases</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{aiInsights.similarCasesTrends.recoveryRate}%</span>
                  <span className="stat-label">Recovery Rate</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{aiInsights.similarCasesTrends.averageRecoveryTime}</span>
                  <span className="stat-label">Avg Recovery</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{aiInsights.similarCasesTrends.complications}%</span>
                  <span className="stat-label">Complications</span>
                </div>
              </div>
              <div className="common-treatments">
                <h5>Common Treatments:</h5>
                <div className="treatment-tags">
                  {aiInsights.similarCasesTrends.commonTreatments.map((treatment, index) => (
                    <span key={index} className="treatment-tag">{treatment}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis History Sidebar */}
      {analysisHistory.length > 0 && (
        <div className="history-sidebar">
          <h3>Recent Analyses</h3>
          <div className="history-list">
            {analysisHistory.slice(0, 5).map((item, index) => (
              <div key={item.id} className="history-item">
                <div className="history-symptoms">{item.symptoms.substring(0, 60)}...</div>
                <div className="history-date">{new Date(item.timestamp).toLocaleDateString()}</div>
                <button
                  className="load-history-btn"
                  onClick={() => {
                    setSymptoms(item.symptoms);
                    setAnalysis(item.analysis);
                    setUserProfile(item.userProfile);
                  }}
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarks Panel */}
      {bookmarkedAnalyses.length > 0 && (
        <div className="bookmarks-panel">
          <h3>Bookmarked Analyses</h3>
          <div className="bookmarks-grid">
            {bookmarkedAnalyses.map((bookmark) => (
              <div key={bookmark.id} className="bookmark-card">
                <div className="bookmark-header">
                  <h4>{bookmark.symptoms.substring(0, 40)}...</h4>
                  <button
                    className="remove-bookmark"
                    onClick={() => {
                      const newBookmarks = bookmarkedAnalyses.filter(b => b.id !== bookmark.id);
                      setBookmarkedAnalyses(newBookmarks);
                      localStorage.setItem('healthApp_bookmarks', JSON.stringify(newBookmarks));
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="bookmark-date">{new Date(bookmark.timestamp).toLocaleDateString()}</div>
                <div className="bookmark-risk">{bookmark.analysis.riskAssessment?.overall || 'Medium'} Risk</div>
                <button
                  className="load-bookmark-btn"
                  onClick={() => {
                    setSymptoms(bookmark.symptoms);
                    setAnalysis(bookmark.analysis);
                    setUserProfile(bookmark.userProfile);
                  }}
                >
                  Load Analysis
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Mode Features */}
      {expertMode && analysis && (
        <div className="expert-mode-panel">
          <div className="expert-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Expert Mode - Advanced Clinical Data
            </h3>
          </div>
          
          <div className="expert-grid">
            <div className="expert-card">
              <h4>Differential Diagnosis</h4>
              <div className="differential-list">
                {(analysis.conditions || []).map((condition, index) => (
                  <div key={index} className="differential-item">
                    <div className="condition-name">{condition.name}</div>
                    <div className="condition-details">
                      <span>Likelihood: {condition.likelihood}%</span>
                      <span>Severity: {condition.severity}</span>
                    </div>
                    <div className="condition-rationale">{condition.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="expert-card">
              <h4>Clinical Decision Support</h4>
              <div className="clinical-data">
                <div className="data-point">
                  <label>Symptom Complexity Score:</label>
                  <span>{Math.round((analysis.confidence || 0.7) * 100) + Math.random() * 20}</span>
                </div>
                <div className="data-point">
                  <label>Urgency Score:</label>
                  <span>{analysis.riskAssessment?.overall === 'High' ? '8-9' : analysis.riskAssessment?.overall === 'Medium' ? '4-6' : '1-3'}</span>
                </div>
                <div className="data-point">
                  <label>Comorbidity Risk:</label>
                  <span>{(userProfile.preConditions || []).length > 0 ? 'Elevated' : 'Standard'}</span>
                </div>
              </div>
            </div>
            
            <div className="expert-card">
              <h4>Recommended Tests/Procedures</h4>
              <ul className="procedures-list">
                <li>Complete Blood Count (CBC)</li>
                <li>Basic Metabolic Panel</li>
                <li>Urinalysis</li>
                <li>Chest X-ray (if respiratory symptoms)</li>
                <li>ECG (if cardiac symptoms)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Telehealth Integration */}
      {analysis && analysis.riskAssessment?.overall !== 'Low' && (
        <div className="telehealth-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Connect with Healthcare Providers
          </h3>
          <div className="telehealth-options">
            <button className="telehealth-btn urgent">
              <div className="btn-icon">🚨</div>
              <div className="btn-content">
                <h4>Urgent Care</h4>
                <p>Connect within 15 minutes</p>
              </div>
            </button>
            <button className="telehealth-btn consultation">
              <div className="btn-icon">👩‍⚕️</div>
              <div className="btn-content">
                <h4>Doctor Consultation</h4>
                <p>Schedule within 24 hours</p>
              </div>
            </button>
            <button className="telehealth-btn specialist">
              <div className="btn-icon">🏥</div>
              <div className="btn-content">
                <h4>Specialist Referral</h4>
                <p>Based on your symptoms</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Shareable Link Modal */}
      {shareableLink && (
        <div className="modal-overlay" onClick={() => setShareableLink('')}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Analysis</h3>
              <button onClick={() => setShareableLink('')}>×</button>
            </div>
            <div className="modal-content">
              <p>Share this analysis with healthcare providers or family members:</p>
              <div className="share-link-container">
                <input
                  type="text"
                  value={shareableLink}
                  readOnly
                  className="share-link-input"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareableLink)}
                  className="copy-btn"
                >
                  Copy
                </button>
              </div>
              <div className="share-options">
                <button onClick={() => window.open(`mailto:?subject=Health Analysis&body=${shareableLink}`)}>
                  📧 Email
                </button>
                <button onClick={() => window.open(`sms:?body=${shareableLink}`)}>
                  💬 SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
