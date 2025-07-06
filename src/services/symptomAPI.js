import { supabase } from '../lib/supabaseClient';

// Save a symptom report to Supabase
export const saveSymptomReport = async (userId, symptoms, symptomDetails, userProfile, followUpAnswers) => {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .insert({
        user_id: userId,
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
        symptom_details: symptomDetails || {},
        user_profile: userProfile || {},
        follow_up_answers: followUpAnswers || {},
        severity_level: 'moderate' // default
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving symptom report:', error);
    throw error;
  }
};

// Save diagnosis log to Supabase
export const saveDiagnosisLog = async (userId, symptomReportId, analysisResult) => {
  try {
    const { data, error } = await supabase
      .from('diagnosis_logs')
      .insert({
        user_id: userId,
        symptom_report_id: symptomReportId,
        analysis_result: analysisResult,
        possible_conditions: analysisResult.conditions || [],
        recommendations: analysisResult.recommendations || [],
        urgency_level: analysisResult.urgency || 'low',
        follow_up_questions: analysisResult.followUpQuestions || {},
        ai_confidence: analysisResult.confidence || 0.5
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving diagnosis log:', error);
    throw error;
  }
};

// Get user's symptom reports
export const getSymptomReports = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .select(`
        *,
        diagnosis_logs (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching symptom reports:', error);
    throw error;
  }
};

// Get diagnosis logs for a user
export const getDiagnosisLogs = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('diagnosis_logs')
      .select(`
        *,
        symptom_reports (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching diagnosis logs:', error);
    throw error;
  }
};

// Delete a symptom report
export const deleteSymptomReport = async (reportId, userId) => {
  try {
    const { error } = await supabase
      .from('symptom_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting symptom report:', error);
    throw error;
  }
};

// Search symptom reports by symptoms or conditions
export const searchSymptomReports = async (userId, searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('symptom_reports')
      .select(`
        *,
        diagnosis_logs (*)
      `)
      .eq('user_id', userId)
      .textSearch('symptoms', searchTerm)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching symptom reports:', error);
    throw error;
  }
};
