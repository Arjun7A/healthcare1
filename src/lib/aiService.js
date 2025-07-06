import Groq from 'groq-sdk';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!API_KEY || API_KEY === 'your_groq_api_key_here') {
  console.error('❌ Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  console.log('📝 Get your API key from: https://console.groq.com/');
}

const groq = API_KEY && API_KEY !== 'your_groq_api_key_here' ? new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

/**
 * Safety settings and configuration for medical AI responses
 */
const GROQ_MODEL = "llama3-70b-8192"; // Llama 3 70B - excellent for medical tasks
const TEMPERATURE = 0.3; // Lower temperature for more consistent medical responses
const MAX_TOKENS = 2048;

/**
 * Advanced symptom analysis using Groq AI
 * @param {Object} params - Analysis parameters
 * @param {string} params.symptoms - Patient symptoms description
 * @param {Object} params.userProfile - Patient profile information
 * @param {Object} params.followUpAnswers - Answers to follow-up questions
 * @returns {Promise<Object>} - Structured analysis result
 */
export const analyzeSymptoms = async ({ symptoms, userProfile = {}, followUpAnswers = {} }) => {
  // Validate inputs
  if (!symptoms || symptoms.trim().length === 0) {
    throw new Error('Please provide symptom information');
  }

  // Enhanced symptom validation with proper filtering
  const validation = validateSymptoms(symptoms);
  
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  if (validation.isEmergency) {
    throw new Error(validation.message);
  }

  // Comprehensive API key validation
  if (!API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.\n\nGet your free API key from: https://console.groq.com/');
  }

  if (API_KEY === 'your_groq_api_key_here' || API_KEY === 'your_api_key_here') {
    throw new Error('Please replace the placeholder API key with your actual Groq API key.\n\nGet your free API key from: https://console.groq.com/');
  }

  if (!groq) {
    throw new Error('Groq client not initialized. Please check your API key configuration.');
  }

  try {
    const prompt = generateMedicalPrompt(symptoms, userProfile, followUpAnswers);
    console.log('🤖 Making Groq API request...');
    console.log('📝 API Key configured:', API_KEY ? 'Yes' : 'No');
    console.log('🔧 Groq client initialized:', groq ? 'Yes' : 'No');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    const text = completion.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('No response received from Groq API');
    }
    
    console.log('✅ Groq AI response received successfully');
    console.log('📄 Response preview:', text.substring(0, 200) + '...');
    
    // Parse the structured response
    return parseAIResponse(text);
    
  } catch (error) {
    console.error('❌ Groq API Error:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      cause: error.cause
    });
    
    // Enhanced error handling with specific error types
    if (error.message && error.message.includes('Invalid API Key')) {
      throw new Error('Invalid Groq API key. Please verify your API key at https://console.groq.com/');
    }
    
    if (error.message && (error.message.includes('rate limit') || error.message.includes('quota') || error.status === 429)) {
      throw new Error('🚫 Groq API rate limit exceeded. Please wait a moment and try again. Groq provides 14,400 requests per day.');
    }
    
    if (error.status === 401) {
      throw new Error('Invalid or expired Groq API key. Please check your API key at https://console.groq.com/');
    }
    
    // Generic network or service errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      throw new Error('Network error connecting to Groq API. Please check your internet connection.');
    }
    
    // Fallback for unexpected errors
    throw new Error(`Groq API error: ${error.message || 'Unknown error occurred. Please try again.'}`);
  }
};

/**
 * Generate comprehensive medical prompt for AI analysis
 */
function generateMedicalPrompt(symptoms, userProfile, followUpAnswers) {
  const profileInfo = userProfile.age && userProfile.gender 
    ? `Patient profile: ${userProfile.age}-year-old ${userProfile.gender}${userProfile.preConditions && userProfile.preConditions.length > 0 ? ` with medical history of: ${userProfile.preConditions.join(', ')}` : ''}.`
    : 'Patient profile: Not provided.';

  const followUpInfo = Object.keys(followUpAnswers).length > 0
    ? `\n\nFollow-up information: ${Object.entries(followUpAnswers).map(([q, a]) => `Q: ${q} - A: ${a}`).join('; ')}`
    : '';

  return `You are a certified virtual medical assistant providing preliminary health assessment. You MUST ONLY analyze legitimate medical or psychological symptoms and health concerns. ${profileInfo}

STRICT CONTENT POLICY:
- ONLY respond to actual medical symptoms, physical conditions, or psychological health concerns
- REJECT any non-medical content, inappropriate language, or random text
- If input contains non-medical content, respond with error message about appropriate content

Patient reports these symptoms: ${symptoms}${followUpInfo}

IMPORTANT: Before providing any analysis, verify that the reported symptoms are legitimate medical or psychological concerns. If they are not, respond with:
{"error": "Please provide only legitimate medical symptoms or health concerns. Non-medical content cannot be analyzed."}

If the symptoms are legitimate medical concerns, provide a comprehensive analysis in the following JSON structure (respond ONLY with valid JSON):

{
  "conditions": [
    {
      "name": "Condition Name",
      "likelihood": 75,
      "description": "Brief description",
      "severity": "Low|Medium|High"
    }
  ],
  "riskAssessment": {
    "overall": "Low|Medium|High",
    "urgency": "Monitor at home|See doctor within days|Seek immediate care",
    "timeframe": "Specific guidance on when to seek care"
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "homeRemedies": [
    "Safe home remedy 1",
    "Safe home remedy 2"
  ],
  "redFlags": [
    "Warning sign that requires immediate attention",
    "Another warning sign"
  ],
  "similarCases": [
    {
      "case": "Brief case description",
      "outcome": "What happened",
      "duration": "Recovery time"
    }
  ],
  "followUpQuestions": [
    "Yes/no question to refine diagnosis 1?",
    "Yes/no question to refine diagnosis 2?",
    "Yes/no question to refine diagnosis 3?"
  ],
  "disclaimer": "This analysis is for informational purposes only and does not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.",
  "confidence": 0.85
}

CRITICAL GUIDELINES:
- Provide 2-3 most likely conditions with realistic likelihood percentages
- Always include appropriate medical disclaimers
- Focus on evidence-based recommendations
- Suggest seeking professional care when uncertain
- Include red flag symptoms that warrant immediate attention
- Keep responses professional and non-alarming
- Do not provide specific medication recommendations
- Encourage professional medical consultation for serious concerns

Respond with ONLY the JSON structure above, no additional text.`;
}

/**
 * Parse AI response and structure it properly
 */
function parseAIResponse(text) {
  try {
    console.log('🔍 Parsing AI response...');
    
    // Clean the response - remove any markdown formatting or extra text
    let cleanText = text.trim();
    
    // Remove code block markers if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any text before the first { and after the last }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('🧹 Cleaned response for parsing');
    
    const parsed = JSON.parse(cleanText);
    
    // Check if AI rejected the content
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    
    console.log('✅ Successfully parsed AI response');
    
    // Validate and structure the response
    const structuredResponse = {
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions.map(condition => ({
        name: condition.name || 'Unknown Condition',
        likelihood: typeof condition.likelihood === 'number' ? condition.likelihood : 50,
        description: condition.description || 'No description provided',
        severity: condition.severity || 'Medium'
      })) : [],
      
      riskAssessment: {
        overall: parsed.riskAssessment?.overall || 'Medium',
        urgency: parsed.riskAssessment?.urgency || 'Consult healthcare provider',
        timeframe: parsed.riskAssessment?.timeframe || 'Seek medical attention if symptoms persist'
      },
      
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
        'Monitor symptoms closely',
        'Stay hydrated and rest',
        'Consult healthcare provider if symptoms worsen'
      ],
      
      homeRemedies: Array.isArray(parsed.homeRemedies) ? parsed.homeRemedies : [
        'Rest and adequate sleep',
        'Stay hydrated',
        'Apply appropriate temperature therapy'
      ],
      
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [
        'Severe worsening of symptoms',
        'High fever over 101.3°F (38.5°C)',
        'Difficulty breathing'
      ],
      
      similarCases: Array.isArray(parsed.similarCases) ? parsed.similarCases : [],
      
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [
        'Have your symptoms worsened in the last 24 hours?',
        'Are you experiencing any fever?',
        'Have you taken any medications for these symptoms?'
      ],
      
      disclaimer: parsed.disclaimer || 'This analysis is for informational purposes only and does not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.',
      
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      generatedAt: new Date().toISOString(),
      aiGenerated: true,
      source: 'Groq AI'
    };
    
    console.log('📊 Response validation completed');
    return structuredResponse;
    
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    console.error('📄 Raw response:', text);
    throw new Error(`Failed to process Groq AI response: ${error.message}`);
  }
}

// Remove the mock response function - we want to force proper API usage

/**
 * Refine analysis based on follow-up answers using Groq AI
 */
export const refineAnalysis = async ({ symptoms, userProfile, followUpAnswers, previousAnalysis }) => {
  // Enhanced API key validation for refinement
  if (!API_KEY) {
    throw new Error('Groq API key not configured for refinement analysis. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  if (API_KEY === 'your_groq_api_key_here' || API_KEY === 'your_api_key_here') {
    throw new Error('Please replace the placeholder API key with your actual Groq API key for refinement analysis.');
  }

  if (!groq) {
    throw new Error('Groq client not initialized for refinement.');
  }

  try {
    console.log('🔄 Refining analysis with Groq...');
    console.log('📝 Refinement API Key configured:', API_KEY ? 'Yes' : 'No');
    
    const refinementPrompt = `You are a certified virtual medical assistant providing ADVANCED refined health assessment. The follow-up answers should significantly improve the analysis accuracy and specificity.

INITIAL ANALYSIS:
${JSON.stringify(previousAnalysis, null, 2)}

ORIGINAL SYMPTOMS: ${symptoms}

PATIENT PROFILE: ${JSON.stringify(userProfile)}

FOLLOW-UP ANSWERS: ${JSON.stringify(followUpAnswers)}

CRITICAL REFINEMENT REQUIREMENTS:
1. **SIGNIFICANT LIKELIHOOD CHANGES**: Based on follow-up answers, dramatically adjust condition probabilities (minimum 15-20% changes for relevant conditions)
2. **ENHANCED SPECIFICITY**: Add more specific sub-conditions or differential diagnoses based on new information
3. **TARGETED RECOMMENDATIONS**: Provide highly specific recommendations that directly address the follow-up answers
4. **ADVANCED INSIGHTS**: Include deeper medical insights and more sophisticated risk stratification
5. **IMPROVED CONFIDENCE**: Increase confidence level by 10-20% due to additional information

REFINEMENT ANALYSIS RULES:
- If follow-up answers confirm certain symptoms → Increase related condition likelihood by 20-40%
- If follow-up answers rule out symptoms → Decrease related condition likelihood by 30-50%
- Add NEW conditions if follow-up answers reveal additional symptoms
- Remove conditions if follow-up answers contradict them
- Provide more specific recommendations (e.g., "monitor temperature every 4 hours" instead of "monitor symptoms")
- Include advanced care timelines (e.g., "see doctor within 24-48 hours if X occurs")

ENHANCED OUTPUT REQUIREMENTS:
- At least 2-3 condition likelihood changes of 15%+ 
- More detailed recommendations (minimum 4-5 specific actions)
- Enhanced risk assessment with precise timeframes
- Additional red flags specific to the refined diagnosis
- More targeted home remedies for the refined conditions
- Advanced similar cases relevant to the refined diagnosis

Provide the refined analysis in the same JSON structure as the initial analysis, but with SIGNIFICANTLY enhanced detail and accuracy. This should be noticeably more advanced and tailored than the initial analysis.

Respond ONLY with valid JSON in the exact same format as the initial analysis, but with SIGNIFICANTLY enhanced detail and accuracy.`;

    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: refinementPrompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.2, // Lower temperature for more consistent refinement
      max_tokens: MAX_TOKENS,
    });

    const text = completion.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('No response received from Groq API for refinement');
    }
    
    console.log('✅ Refinement response received from Groq');
    
    const refinedAnalysis = parseAIResponse(text);
    
    // Add refinement metadata
    const finalRefinedAnalysis = {
      ...refinedAnalysis,
      confidence: Math.min((refinedAnalysis.confidence || 0.7) + 0.1, 0.95),
      refinedAt: new Date().toISOString(),
      followUpProcessed: true,
      followUpAnswers: followUpAnswers,
      source: 'Groq AI - Refined'
    };
    
    console.log('🎯 Analysis refinement completed successfully');
    return finalRefinedAnalysis;
    
  } catch (error) {
    console.error('❌ Failed to refine analysis with Groq AI:', error);
    console.error('🔍 Refinement error details:', {
      message: error.message,
      status: error.status,
      code: error.code
    });
    
    // Enhanced error handling for refinement with Groq
    if (error.message && error.message.includes('Invalid API Key')) {
      throw new Error('Invalid Groq API key for refinement. Please verify your API key.');
    }
    
    if (error.message && (error.message.includes('rate limit') || error.message.includes('quota'))) {
      throw new Error('Groq API rate limit exceeded during refinement. Please wait a moment and try again.');
    }
    
    if (error.status === 429) {
      throw new Error('Groq API rate limit exceeded during refinement. Please wait a moment and try again.');
    }
    
    if (error.status === 401) {
      throw new Error('Groq API authentication failed during refinement. Please verify your API key.');
    }
    
    if (error.status === 503) {
      throw new Error('Groq service temporarily unavailable during refinement. Please try again in a moment.');
    }
    
    throw new Error(`Refinement failed: ${error.message || 'Unknown error during analysis refinement'}`);
  }
};

/**
 * Comprehensive validation for medical symptoms and safety concerns
 */
export const validateSymptoms = (symptoms) => {
  if (!symptoms || typeof symptoms !== 'string') {
    return {
      isValid: false,
      message: 'Please provide valid symptom information.'
    };
  }

  const symptomsLower = symptoms.toLowerCase().trim();
  
  // Check for minimum length
  if (symptomsLower.length < 3) {
    return {
      isValid: false,
      message: 'Please provide a more detailed description of your symptoms.'
    };
  }

  // Check for maximum length to prevent abuse
  if (symptomsLower.length > 2000) {
    return {
      isValid: false,
      message: 'Please provide a shorter description (maximum 2000 characters).'
    };
  }

  // Emergency keyword detection first
  const emergencyKeywords = [
    'chest pain', 'difficulty breathing', 'can\'t breathe', 'heart attack',
    'stroke', 'seizure', 'unconscious', 'bleeding heavily', 'severe head injury',
    'poisoning', 'overdose', 'suicidal', 'suicide', 'self harm', 'kill myself'
  ];
  
  const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
    symptomsLower.includes(keyword)
  );
  
  if (hasEmergencyKeywords) {
    return {
      isValid: true,
      isEmergency: true,
      message: 'Based on your symptoms, this may be a medical emergency. Please call emergency services (911) or go to the nearest emergency room immediately.'
    };
  }

  // Filter only clearly inappropriate content - be more permissive
  const inappropriatePatterns = [
    // Only explicit profanity
    /\b(fuck|shit|bitch|asshole|nigga|nigger|faggot|retard)\b/i,
    // Clear spam patterns only
    /\b(aaa+|bbb+|ccc+|111+|222+|333+|asdf|qwerty)\b/i,
    // Obvious non-medical spam
    /\b(lol+|wtf+|hahaha+|okokok)\b/i,
    // Repeated characters (5+ times)
    /(.)\1{4,}/,
  ];

  const hasInappropriate = inappropriatePatterns.some(pattern => 
    pattern.test(symptomsLower)
  );

  if (hasInappropriate) {
    return {
      isValid: false,
      message: 'Please enter appropriate content. Inappropriate language or spam is not accepted.'
    };
  }

  // Only block clearly unrelated content
  const completelyUnrelatedPatterns = [
    // Only obvious non-medical topics
    /\b(javascript programming|calculus homework|video game|movie review)\b/i,
    // Marketing spam
    /\b(buy now|click here|discount offer)\b/i,
  ];

  const isCompletelyUnrelated = completelyUnrelatedPatterns.some(pattern => 
    pattern.test(symptomsLower)
  );

  if (isCompletelyUnrelated) {
    return {
      isValid: false,
      message: 'Please describe your medical symptoms or health concerns. The content appears to be unrelated to health matters.'
    };
  }

  // Very permissive validation - only reject clearly inappropriate content
  // Accept most input unless it's obviously spam or inappropriate
  const isValidInput = symptomsLower.length >= 3 && 
    symptomsLower.split(' ').length >= 2 && 
    !hasInappropriate && 
    !isCompletelyUnrelated;

  if (!isValidInput) {
    return {
      isValid: false,
      message: 'Please provide a description of your symptoms or health concerns.'
    };
  }

  return { 
    isValid: true,
    isEmergency: false 
  };
};

/**
 * Generate personalized mood recommendations using Groq AI
 * @param {Object} moodData - User's mood data and patterns
 * @returns {Promise<Array>} - Array of personalized recommendations
 */
export const generateMoodRecommendations = async (moodData) => {
  console.log('🧠 Starting mood recommendation generation...');
  console.log('📊 Mood data received:', moodData);
  
  // Check API key configuration
  if (!API_KEY || API_KEY === 'your_groq_api_key_here' || API_KEY === 'your_api_key_here') {
    console.warn('⚠️ Groq API key not configured properly');
    throw new Error('Groq API key not configured. Please add your actual API key to the .env file.\n\nGet your free API key from: https://console.groq.com/\n\nCurrent key status: ' + (API_KEY ? 'Placeholder detected' : 'Missing'));
  }

  if (!groq) {
    console.error('❌ Groq client not initialized');
    throw new Error('Groq client not initialized. Please check your API key configuration.');
  }

  try {
    console.log('✅ API key configured, generating prompt...');
    
    const prompt = generateMoodRecommendationPrompt(moodData);
    console.log('📝 Generated prompt preview:', prompt.substring(0, 200) + '...');
    
    console.log('🔄 Making API call to Groq...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.4, // Slightly higher for more creative recommendations
      max_tokens: 1500,
    });

    const text = completion.choices[0]?.message?.content;
    
    if (!text) {
      throw new Error('No response received from Groq API');
    }

    console.log('📡 Received response from Groq');
    console.log('✅ Raw AI response received:', text.substring(0, 300) + '...');
    
    // Parse the AI response
    const recommendations = parseMoodRecommendations(text);
    
    if (recommendations.length === 0) {
      console.warn('⚠️ No valid recommendations parsed from AI response');
      throw new Error('Failed to parse valid recommendations from AI response');
    }
    
    console.log(`🎯 Successfully generated ${recommendations.length} AI-powered recommendations`);
    return recommendations;
    
  } catch (error) {
    console.error('❌ Failed to generate mood recommendations:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code
    });
    
    // Enhanced error handling for mood recommendations with Groq
    if (error.message && (error.message.includes('rate limit') || error.message.includes('quota') || error.status === 429)) {
      throw new Error('🚫 Groq API rate limit exceeded. Please wait a moment and try again. Groq provides 14,400 requests per day.');
    }
    
    if (error.message && error.message.includes('Invalid API Key')) {
      throw new Error('Invalid Groq API key for mood recommendations. Please verify your API key at https://console.groq.com/');
    }
    
    if (error.status === 401) {
      throw new Error('Groq API authentication failed for mood recommendations. Please verify your API key is correct.');
    }
    
    if (error.status === 403) {
      throw new Error('Groq API access forbidden for mood recommendations. Please check your API key settings.');
    }
    
    if (error.status === 503) {
      throw new Error('Groq service temporarily unavailable for mood recommendations. Please try again in a moment.');
    }
    
    // Network or service errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      throw new Error('Network error connecting to Groq API for mood recommendations. Please check your internet connection.');
    }
    
    // Re-throw the error instead of falling back to hardcoded recommendations
    // This way the UI can show the actual error and ask user to configure API key
    throw error;
  }
};

/**
 * Generate prompt for mood recommendations
 */
function generateMoodRecommendationPrompt(moodData) {
  const {
    averageMood = 3,
    moodTrend = 'neutral',
    totalEntries = 0,
    commonEmotions = [],
    commonActivities = [],
    recent7Average = 3,
    previous7Average = 3,
    recentEntries = [],
    allEntries = []
  } = moodData;

  // Check if the most recent entry is emoji-only or minimal
  const mostRecentEntry = recentEntries[0];
  const isRecentEntryMinimal = mostRecentEntry && (!mostRecentEntry.notes || mostRecentEntry.notes.trim().length < 5);
  
  let analysisContext = '';
  let analysisInstructions = '';

  if (isRecentEntryMinimal && mostRecentEntry) {
    // Focus on the current simple entry
    const moodLabel = mostRecentEntry.mood >= 5 ? 'Very Good' : mostRecentEntry.mood >= 4 ? 'Good' : mostRecentEntry.mood >= 3 ? 'Neutral' : mostRecentEntry.mood >= 2 ? 'Low' : 'Very Low';
    analysisContext = `MOST RECENT ENTRY (TODAY): Mood=${moodLabel}(${mostRecentEntry.mood}/5), Emotions=[${mostRecentEntry.emotions?.join(', ') || 'none'}], Activities=[${mostRecentEntry.activities?.join(', ') || 'none'}], Notes="${mostRecentEntry.notes || 'Simple emoji entry'}"\n\nThis is a simple, quick mood check-in without detailed notes.`;
    
    analysisInstructions = `
CURRENT ENTRY ANALYSIS (FOCUS ON THIS):
1. The user just logged a simple mood entry (${moodLabel}) without detailed notes
2. Base recommendations on the CURRENT mood level (${mostRecentEntry.mood}/5) and selected emotions/activities
3. Provide general wellness advice appropriate for someone feeling "${moodLabel}"
4. Do NOT over-analyze or reference issues from old entries with detailed notes
5. Keep recommendations fresh and relevant to TODAY'S mood state`;
  } else {
    // Use detailed analysis for entries with substantial notes
    const recentTexts = recentEntries.slice(0, 5).map(entry => {
      const moodLabel = entry.mood >= 5 ? 'Very Good' : entry.mood >= 4 ? 'Good' : entry.mood >= 3 ? 'Neutral' : entry.mood >= 2 ? 'Low' : 'Very Low';
      return `Entry (${new Date(entry.timestamp).toLocaleDateString()}): Mood=${moodLabel}(${entry.mood}/5), Emotions=[${entry.emotions?.join(', ') || 'none'}], Activities=[${entry.activities?.join(', ') || 'none'}], Notes="${entry.notes || 'No notes'}"`;
    }).join('\n');
    
    analysisContext = `RECENT MOOD ENTRIES (ANALYZE CAREFULLY):\n${recentTexts || 'No recent entries available'}`;
    
    analysisInstructions = `
ANALYSIS INSTRUCTIONS:
1. READ each mood entry's notes carefully - this is where the REAL emotions are
2. IDENTIFY specific issues mentioned (career, relationships, family, health, finances, etc.)
3. DETECT mood-text contradictions (high mood rating but sad notes, or vice versa)
4. FOCUS on the most recent and concerning issues mentioned in notes
5. PROVIDE actionable advice for the SPECIFIC problems mentioned, not generic wellness tips`;
  }

  return `You are a certified mental health advisor providing personalized wellness recommendations based on mood tracking data.

${isRecentEntryMinimal ? 'SIMPLE MOOD CHECK-IN ANALYSIS:' : 'DETAILED MOOD ANALYSIS:'}
- Focus on providing relevant, actionable recommendations for the current mood state
- ${isRecentEntryMinimal ? 'Keep advice general and supportive for simple emoji entries' : 'Analyze detailed notes for specific concerns and targeted advice'}

MOOD DATA ANALYSIS:
- Average Mood: ${averageMood}/5 (1=Very Low, 5=Very High)
- Recent Trend: ${moodTrend} (recent 7-day average: ${recent7Average}, previous 7-day: ${previous7Average})
- Total Journal Entries: ${totalEntries}
- Common Emotions: ${commonEmotions.map(e => `${e.emotion} (${e.count} times)`).join(', ') || 'None reported'}
- Common Activities: ${commonActivities.map(a => `${a.activity} (${a.count} times)`).join(', ') || 'None reported'}

${analysisContext}
${analysisInstructions}

STRICT CONTENT REQUIREMENTS:
- ONLY provide appropriate mental health and wellness recommendations
- REJECT any inappropriate, harmful, or unrelated content
- Focus on evidence-based wellness practices${isRecentEntryMinimal ? ' for current mood state' : ' tailored to ACTUAL concerns mentioned'}
- NO medication recommendations (refer to healthcare professionals)
- NO diagnosis or medical advice
${isRecentEntryMinimal ? '- Provide general, supportive recommendations for simple mood check-ins' : '- Address SPECIFIC issues found in the notes (e.g., career stress, placement anxiety, relationship issues)'}

Provide EXACTLY 6-8 personalized recommendations in the following JSON format (MINIMUM 6 recommendations required):

{
  "recommendations": [
    {
      "title": "${isRecentEntryMinimal ? 'Supportive recommendation for current mood state' : 'Specific actionable recommendation addressing real concerns from notes'}",
      "description": "Detailed helpful description (2-3 sentences)${isRecentEntryMinimal ? ' appropriate for the current mood level' : ' that directly addresses issues mentioned in mood entries'}",
      "category": "exercise|mindfulness|social|routine|creativity|professional|nutrition|sleep|career|academic|coping",
      "priority": "high|medium|low",
      "icon": "appropriate emoji",
      "relevantConcerns": ["${isRecentEntryMinimal ? 'current mood state' : 'specific issues this addresses from the notes'}"]
    }
    // ... continue for AT LEAST 6 total recommendations
  ]
}

CRITICAL REQUIREMENTS:
- MUST provide EXACTLY 6-8 recommendations (no fewer than 6)
- MUST respond with ONLY valid JSON (no additional text, explanations, or markdown)
- MUST ensure all recommendations are complete with title, description, category, priority, icon, and relevantConcerns
- Each recommendation MUST be unique and address different aspects of wellbeing

RECOMMENDATION GUIDELINES:
- DIRECTLY address concerns mentioned in mood entry notes
- If someone mentions "depression about placements/career" → provide career/job search coping strategies
- If someone mentions relationship issues → provide relationship/social support advice
- If someone mentions stress about studies → provide academic stress management
- If there are mood-rating contradictions → acknowledge the complexity of emotions
- Include mix of immediate relief and long-term strategies for identified issues
- Be specific and actionable, not generic
- Ensure all recommendations are safe and appropriate

RESPOND ONLY WITH VALID JSON - NO ADDITIONAL TEXT OR EXPLANATIONS.`;
}

/**
 * Parse AI-generated mood recommendations
 */
function parseMoodRecommendations(text) {
  try {
    console.log('🔍 Parsing mood recommendations...');
    console.log('📄 Raw AI response:', text.substring(0, 500) + '...');
    
    // Clean the response
    let cleanText = text.trim();
    
    // Remove code block markers if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Extract JSON - more robust extraction
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('🧹 Cleaned text for parsing:', cleanText.substring(0, 300) + '...');
    
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.log('📝 Attempting to fix common JSON issues...');
      
      // Try to fix common JSON issues
      let fixedText = cleanText
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/"/g, '"')      // Fix smart quotes
        .replace(/"/g, '"');     // Fix smart quotes
      
      try {
        parsed = JSON.parse(fixedText);
        console.log('✅ JSON fixed and parsed successfully');
      } catch (secondError) {
        console.error('❌ Still failed to parse JSON after fixes:', secondError);
        throw new Error('Unable to parse AI response as valid JSON');
      }
    }
    
    // Validate and filter recommendations
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    console.log(`📊 Found ${recommendations.length} raw recommendations`);
    
    if (recommendations.length === 0) {
      console.warn('⚠️ No recommendations array found in response');
      return [];
    }
    
    // Filter and validate each recommendation
    const validRecommendations = recommendations
      .filter(rec => {
        const isValid = rec && rec.title && rec.description;
        if (!isValid) {
          console.warn('⚠️ Filtered out invalid recommendation:', rec);
        }
        return isValid;
      })
      .filter(rec => {
        const isAppropriate = isAppropriateRecommendation(rec);
        if (!isAppropriate) {
          console.warn('⚠️ Filtered out inappropriate recommendation:', rec.title);
        }
        return isAppropriate;
      })
      .map(rec => ({
        title: rec.title.slice(0, 100), // Limit length
        description: rec.description.slice(0, 300), // Limit length
        category: rec.category || 'general',
        priority: rec.priority || 'medium',
        icon: rec.icon || '💡',
        relevantConcerns: Array.isArray(rec.relevantConcerns) ? rec.relevantConcerns.slice(0, 3) : []
      }))
      .slice(0, 10); // Limit to 10 recommendations
    
    console.log(`✅ Parsed ${validRecommendations.length} valid recommendations`);
    
    // Check if we have the minimum required recommendations
    if (validRecommendations.length < 3) {
      console.warn(`⚠️ Only ${validRecommendations.length} valid recommendations found, expected at least 6`);
      throw new Error(`Insufficient recommendations generated. Only ${validRecommendations.length} valid recommendations found, but at least 6 are required for a comprehensive analysis.`);
    }
    
    return validRecommendations;
    
  } catch (error) {
    console.error('❌ Failed to parse mood recommendations:', error);
    return [];
  }
}

/**
 * Validate recommendation content for appropriateness
 */
function isAppropriateRecommendation(recommendation) {
  const content = `${recommendation.title} ${recommendation.description}`.toLowerCase();
  
  // Block inappropriate content
  const inappropriateTerms = [
    'medication', 'drug', 'pill', 'prescription', 'diagnose', 'disorder',
    'suicide', 'self-harm', 'harm', 'violence', 'alcohol', 'drinking',
    'inappropriate', 'sexual', 'illegal', 'dangerous'
  ];
  
  const hasInappropriate = inappropriateTerms.some(term => content.includes(term));
  
  // Ensure it's mental health related
  const healthTerms = [
    'mood', 'mental', 'wellness', 'health', 'exercise', 'mindfulness',
    'sleep', 'stress', 'anxiety', 'emotion', 'feeling', 'social',
    'therapy', 'support', 'routine', 'activity', 'relax', 'breathing'
  ];
  
  const isHealthRelated = healthTerms.some(term => content.includes(term));
  
  return !hasInappropriate && isHealthRelated && recommendation.title.length > 5;
}

/**
 * Generate advanced mood analytics and insights using Groq AI
 * @param {Object} analyticsData - Comprehensive mood data for analysis
 * @returns {Promise<Object>} Advanced insights including patterns, predictions, and recommendations
 */
export const generateAdvancedMoodInsights = async (analyticsData) => {
  try {
    if (!groq) {
      throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.\n\nGet your free API key from: https://console.groq.com/');
    }

    if (API_KEY === 'your_groq_api_key_here' || API_KEY === 'your_api_key_here') {
      throw new Error('Please replace the placeholder API key with your actual Groq API key.\n\nGet your free API key from: https://console.groq.com/');
    }

    if (!groq) {
      throw new Error('Groq client not initialized properly. Please check your API key configuration.');
    }

    // Ensure analyticsData is an object and provide defaults
    const data = analyticsData || {};
    
    const {
      entries = [],
      avgMood = 0,
      totalEntries = 0,
      moodDistribution = {},
      topTags = [],
      topEmotions = [],
      weekdayAvgs = [0, 0, 0, 0, 0, 0, 0],
      hourlyAvgs = Array(24).fill(0),
      sleepData = [],
      energyData = [],
      timeframe = 'period'
    } = data;

    // Ensure arrays and objects are properly initialized
    const safeMoodDistribution = moodDistribution || {};
    const safeTopTags = Array.isArray(topTags) ? topTags : [];
    const safeTopEmotions = Array.isArray(topEmotions) ? topEmotions : [];
    const safeWeekdayAvgs = Array.isArray(weekdayAvgs) ? weekdayAvgs : [0, 0, 0, 0, 0, 0, 0];
    const safeHourlyAvgs = Array.isArray(hourlyAvgs) ? hourlyAvgs : Array(24).fill(0);
    const safeEntries = Array.isArray(entries) ? entries : [];

    const prompt = `As a mental health analytics expert, analyze this comprehensive mood data and provide advanced insights:

MOOD DATA SUMMARY:
- Average Mood: ${avgMood}/5 over ${totalEntries} entries (${timeframe})
- Mood Distribution: ${Object.entries(safeMoodDistribution).map(([mood, count]) => `${mood}/5: ${count} times`).join(', ') || 'No mood data available'}
- Top Activities: ${safeTopTags.map(([tag, count]) => `${tag} (${count}x)`).join(', ') || 'No activity data'}
- Top Emotions: ${safeTopEmotions.map(([emotion, count]) => `${emotion} (${count}x)`).join(', ') || 'No emotion data'}
- Best Day: ${safeWeekdayAvgs.length > 0 ? safeWeekdayAvgs.indexOf(Math.max(...safeWeekdayAvgs)) : 'N/A'} (${safeWeekdayAvgs.length > 0 ? Math.max(...safeWeekdayAvgs).toFixed(1) : 'N/A'}/5)
- Worst Day: ${safeWeekdayAvgs.length > 0 ? safeWeekdayAvgs.indexOf(Math.min(...safeWeekdayAvgs.filter(avg => avg > 0))) : 'N/A'} (${safeWeekdayAvgs.length > 0 ? Math.min(...safeWeekdayAvgs.filter(avg => avg > 0)).toFixed(1) : 'N/A'}/5)
- Best Hour: ${safeHourlyAvgs.length > 0 ? safeHourlyAvgs.indexOf(Math.max(...safeHourlyAvgs)) : 'N/A'}:00 (${safeHourlyAvgs.length > 0 ? Math.max(...safeHourlyAvgs).toFixed(1) : 'N/A'}/5)

RECENT ENTRIES (last 10):
${safeEntries.slice(-10).map(entry => `- ${new Date(entry.timestamp || entry.date || Date.now()).toLocaleDateString()}: Mood ${entry.mood || 'N/A'}/5, Activities: [${(entry.activities || []).join(', ') || 'none'}], Emotions: [${(entry.emotions || []).join(', ') || 'none'}], Notes: "${entry.notes || 'none'}"`).join('\n') || 'No recent entries available'}

Provide a JSON response with these specific insights:

{
  "weeklyMoodSummary": "Natural language summary of mood trends this period",
  "triggerPatternDetection": "Identified patterns in mood triggers and timing",
  "behavioralSuggestion": "Specific actionable advice to improve mood",
  "tagCorrelation": "Analysis of which activities/tags correlate with mood changes",
  "sentimentMoodMapping": "How journal entry length/content relates to mood",
  "moodSpikeDetection": "Notable mood changes and their potential causes",
  "timeOfDayInsights": "When mood is typically highest/lowest and why",
  "weekdayPatterns": "Day-of-week mood patterns and insights",
  "predictiveInsights": "Prediction of future mood trends based on current patterns",
  "customTitle": "Creative title for this mood period (e.g., 'Monday Meltdowns', 'Weekend Recharge')",
  "riskFactors": "Any concerning patterns that need attention",
  "positivePatterns": "Mood-boosting activities and circumstances to encourage"
}

Focus on actionable insights that help understand mood patterns and improve mental wellness.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response received from Groq AI');
    }

    // --- Robust JSON parsing logic ---
    let insights = null;
    let cleanText = response.trim();
    // Remove code block markers if present
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    // Try to extract JSON object
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    try {
      insights = JSON.parse(cleanText);
    } catch (parseError) {
      console.warn('Failed to parse JSON response, returning text insights:', parseError);
      // Fallback: return as before
      return {
        weeklyMoodSummary: response,
        triggerPatternDetection: "Unable to parse detailed analysis",
        behavioralSuggestion: "Please try again for detailed recommendations",
        tagCorrelation: "Analysis unavailable",
        sentimentMoodMapping: "Analysis unavailable",
        moodSpikeDetection: "Analysis unavailable",
        timeOfDayInsights: "Analysis unavailable",
        weekdayPatterns: "Analysis unavailable",
        predictiveInsights: "Analysis unavailable",
        customTitle: "Mood Analysis",
        riskFactors: "None identified",
        positivePatterns: "Continue current practices"
      };
    }
    return insights;
  } catch (error) {
    console.error('Advanced mood insights generation failed:', error);
    throw new Error(`Failed to generate advanced mood insights: ${error.message}`);
  }
};

/**
 * Analyze best and most challenging day using Groq AI (Llama 3)
 * @param {Array} entries - Array of mood entries for the month [{date, mood, emoji, notes}]
 * @returns {Promise<Object>} - { bestDay: {date, mood, emoji, reason}, challengingDay: {date, mood, emoji, reason} }
 */
export const analyzeBestAndChallengingDay = async (entries) => {
  if (!API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }
  if (!groq) {
    throw new Error('Groq client not initialized. Please check your API key configuration.');
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('No mood entries provided for analysis.');
  }

  const prompt = `You are a mental health assistant. Given the following mood entries for a user (each with date, mood score 1-5, emoji, and notes), analyze both the mood/emoji and the notes. Determine:
1. The most positive (best) day of the month
2. The most challenging day of the month

For each, return:
- date
- mood score
- emoji
- a short reason (based on both mood/emoji and notes)

Respond ONLY in this JSON format:
{
  "bestDay": { "date": "YYYY-MM-DD", "mood": 1-5, "emoji": "", "reason": "..." },
  "challengingDay": { "date": "YYYY-MM-DD", "mood": 1-5, "emoji": "", "reason": "..." }
}

Mood entries:
${JSON.stringify(entries, null, 2)}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 512,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('No response from Groq AI');
    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }
    return result;
  } catch (error) {
    console.error('Groq AI error (best/challenging day):', error);
    throw new Error('Groq AI error: ' + (error.message || 'Unknown error'));
  }
};

export default {
  analyzeSymptoms,
  refineAnalysis,
  validateSymptoms,
  generateMoodRecommendations,
  generateAdvancedMoodInsights,
  analyzeBestAndChallengingDay
};
