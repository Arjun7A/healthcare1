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

const GROQ_MODEL = "llama3-70b-8192";
const TEMPERATURE = 0.2; // Lower temperature for more consistent medical responses
const MAX_TOKENS = 3000;

/**
 * Analyze prescription and provide detailed explanation
 * @param {Object} params - Analysis parameters
 * @param {string} params.prescriptionText - Prescription text or image OCR result
 * @param {Object} params.userProfile - Patient profile information
 * @param {string} params.analysisType - Type of analysis (full, drug-interactions, side-effects, etc.)
 * @returns {Promise<Object>} - Structured prescription analysis
 */
export const analyzePrescription = async ({ prescriptionText, userProfile = {}, analysisType = 'full' }) => {
  if (!prescriptionText || prescriptionText.trim().length === 0) {
    throw new Error('Please provide prescription information');
  }

  if (!API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.\n\nGet your free API key from: https://console.groq.com/');
  }

  if (!groq) {
    throw new Error('Groq API not initialized. Please check your API key configuration.');
  }

  const systemPrompt = `You are a highly qualified clinical pharmacist and medical AI assistant specializing in prescription analysis and medication management. Your role is to provide comprehensive, accurate, and patient-friendly explanations of prescriptions and medications.

**CRITICAL INSTRUCTION: YOU MUST RETURN ONLY VALID JSON - NO MARKDOWN, NO EXPLANATION TEXT, JUST RAW JSON**

**IMPORTANT DISCLAIMERS:**
- This is an AI-powered analysis tool for educational purposes only
- Always consult with healthcare professionals before making medication decisions
- Never stop or change medications without medical supervision
- Seek immediate medical attention for serious adverse reactions

**RESPONSE FORMAT:**
Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:

{
  "prescriptionSummary": {
    "totalMedications": number,
    "complexityLevel": "Low/Medium/High",
    "estimatedCost": "string",
    "treatmentDuration": "string"
  },
  "medications": [
    {
      "name": "string",
      "genericName": "string",
      "dosage": "string",
      "frequency": "string",
      "route": "string",
      "duration": "string",
      "purpose": "string",
      "category": "string",
      "instructions": "string",
      "foodInteractions": "string",
      "storageInstructions": "string",
      "costEstimate": "string"
    }
  ],
  "drugInteractions": [
    {
      "medications": ["string"],
      "interactionType": "Minor/Moderate/Major",
      "description": "string",
      "recommendations": "string"
    }
  ],
  "sideEffects": {
    "common": ["string"],
    "serious": ["string"],
    "whenToSeekHelp": ["string"]
  },
  "contraindications": [
    {
      "condition": "string",
      "medications": ["string"],
      "severity": "string",
      "explanation": "string"
    }
  ],
  "patientInstructions": [
    {
      "category": "string",
      "instruction": "string",
      "importance": "High/Medium/Low"
    }
  ],
  "monitoringParameters": [
    {
      "parameter": "string",
      "frequency": "string",
      "normalRange": "string",
      "reason": "string"
    }
  ],
  "lifestyle": {
    "dietary": ["string"],
    "activity": ["string"],
    "avoidance": ["string"],
    "sleep": ["string"],
    "hydration": ["string"],
    "stressManagement": ["string"],
    "other": ["string"]
  },
  "warningsAndPrecautions": [
    {
      "warning": "string",
      "severity": "Critical/High/Medium/Low",
      "explanation": "string"
    }
  ],
  "emergencyContacts": {
    "poisonControl": "1-800-222-1222",
    "instructions": "When to call emergency services"
  }
}

**LIFESTYLE RECOMMENDATIONS GUIDELINES:**
- Provide at least 6-7 advanced, actionable, and diverse lifestyle recommendations
- Cover areas such as diet, physical activity, sleep, stress management, hydration, avoidance, and any other relevant domains
- Each recommendation should be clear, specific, and tailored to the prescription context

**ANALYSIS GUIDELINES:**
1. Extract all medications with complete details
2. Identify potential drug interactions
3. Highlight serious warnings and contraindications
4. Provide clear patient instructions
5. Include monitoring requirements
6. Include at least 6-7 advanced lifestyle recommendations as described above
7. Consider patient demographics and health conditions
8. Maintain professional medical terminology while being patient-friendly`;

  const userPrompt = `Please analyze this prescription and provide a comprehensive explanation:

**Prescription Details:**
${prescriptionText}

**Patient Profile:**
- Age: ${userProfile.age || 'Not specified'}
- Gender: ${userProfile.gender || 'Not specified'}
- Weight: ${userProfile.weight || 'Not specified'}
- Allergies: ${userProfile.allergies || 'None specified'}
- Medical Conditions: ${userProfile.conditions || 'None specified'}
- Current Medications: ${userProfile.currentMedications || 'None specified'}

**Analysis Type:** ${analysisType}

Please provide a detailed analysis focusing on medication safety, interactions, proper usage, and patient education.`;
  try {
    console.log('🔍 Analyzing prescription with Groq AI...');
    console.log('📝 Prescription text:', prescriptionText.substring(0, 200) + '...');
    console.log('👤 User profile:', userProfile);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      top_p: 0.9,
      stream: false
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI service');
    }

    console.log('🔍 Raw AI response length:', responseText.length);
    console.log('🔍 Raw AI response preview:', responseText.substring(0, 300) + '...');

    // Try to extract JSON from the response
    let analysis;
    try {
      // First, try to parse the entire response as JSON
      analysis = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON directly');
    } catch (firstError) {
      console.log('❌ Failed to parse JSON directly:', firstError.message);
      // If that fails, try to extract JSON from markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          analysis = JSON.parse(codeBlockMatch[1]);
          console.log('✅ Successfully parsed JSON from code block');
        } catch (codeBlockError) {
          console.log('❌ Failed to parse JSON from code block:', codeBlockError.message);
          throw new Error('Failed to parse JSON from code block');
        }
      } else {
        // Try to find JSON object in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully parsed extracted JSON');
          } catch (jsonError) {
            console.log('❌ Failed to parse extracted JSON:', jsonError.message);
            throw new Error('Failed to parse extracted JSON');
          }
        } else {
          console.error('❌ No valid JSON found in response:', responseText);
          console.log('🔄 Using fallback response for prescription analysis');
          analysis = createFallbackResponse('prescription', prescriptionText);
        }
      }
    }
    
    // Validate required fields
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }

    if (!analysis.medications || !analysis.prescriptionSummary) {
      console.error('❌ Missing required fields in analysis:', analysis);
      console.log('🔄 Using fallback response for incomplete analysis');
      analysis = createFallbackResponse('prescription', prescriptionText);
    }

    console.log('✅ Prescription analysis completed successfully');
    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      disclaimer: "This analysis is for educational purposes only. Always consult healthcare professionals for medical decisions."
    };

  } catch (error) {
    console.error('❌ Prescription analysis failed:', error);
    
    if (error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    
    if (error.message.includes('API key')) {
      throw new Error('Invalid API key. Please check your Groq API configuration.');
    }
    
    if (error.message.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try again.');
    }
    
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

/**
 * Analyze drug interactions between medications
 * @param {Array} medications - Array of medication names
 * @returns {Promise<Object>} - Drug interaction analysis
 */
export const analyzeDrugInteractions = async (medications) => {
  if (!medications || medications.length === 0) {
    throw new Error('Please provide at least one medication');
  }

  if (!API_KEY || !groq) {
    throw new Error('Groq API not configured properly');
  }

  const systemPrompt = `You are a clinical pharmacist specializing in drug interactions. Analyze the provided medications for potential interactions and provide detailed safety information.

Return your analysis as a JSON object with this structure:
{
  "interactions": [
    {
      "medications": ["drug1", "drug2"],
      "severity": "Minor/Moderate/Major/Contraindicated",
      "mechanism": "string",
      "clinicalEffects": "string",
      "management": "string",
      "monitoringRequired": "string"
    }
  ],
  "riskLevel": "Low/Medium/High/Critical",
  "recommendations": ["string"],
  "alternativeOptions": ["string"]
}`;

  const userPrompt = `Analyze these medications for drug interactions:
${medications.map((med, index) => `${index + 1}. ${med}`).join('\n')}

Please provide a comprehensive interaction analysis with clinical significance and management recommendations.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: 2000,
      top_p: 0.9,
      stream: false
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Drug interaction analysis failed:', error);
    throw new Error(`Interaction analysis failed: ${error.message}`);
  }
};

/**
 * Get medication information and education
 * @param {string} medicationName - Name of the medication
 * @returns {Promise<Object>} - Detailed medication information
 */
export const getMedicationInfo = async (medicationName) => {
  if (!medicationName || medicationName.trim().length === 0) {
    throw new Error('Please provide medication name');
  }

  if (!API_KEY || !groq) {
    throw new Error('Groq API not configured properly');
  }

  const systemPrompt = `You are a clinical pharmacist providing comprehensive medication information. Provide detailed, accurate information about the requested medication.

**CRITICAL INSTRUCTION: YOU MUST RETURN ONLY VALID JSON - NO MARKDOWN, NO EXPLANATION TEXT, JUST RAW JSON**

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:
{
  "medication": {
    "name": "string",
    "genericName": "string",
    "brandNames": ["string"],
    "classification": "string",
    "mechanism": "string",
    "indications": ["string"],
    "contraindications": ["string"],
    "dosageForm": ["string"],
    "strengthsAvailable": ["string"]
  },
  "dosing": {
    "adult": "string",
    "pediatric": "string",
    "geriatric": "string",
    "renalAdjustment": "string",
    "hepaticAdjustment": "string"
  },
  "administration": {
    "route": "string",
    "instructions": "string",
    "foodInteractions": "string",
    "timingRecommendations": "string"
  },
  "sideEffects": {
    "common": ["string"],
    "serious": ["string"],
    "rare": ["string"]
  },
  "monitoring": {
    "parameters": ["string"],
    "frequency": "string",
    "labTests": ["string"]
  },
  "patientEducation": {
    "keyPoints": ["string"],
    "lifestyle": ["string"],
    "warnings": ["string"]
  },
  "storage": "string",
  "costInformation": "string"
}`;

  const userPrompt = `Please provide comprehensive information about this medication: ${medicationName}

Include all relevant clinical information, dosing guidelines, safety considerations, and patient education points.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: GROQ_MODEL,
      temperature: TEMPERATURE,
      max_tokens: 3000,
      top_p: 0.9,
      stream: false
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI service');
    }

    console.log('🔍 Raw medication info response:', responseText.substring(0, 200) + '...');

    // Try to extract and parse JSON from the response
    let info;
    try {
      // First, try to parse the entire response as JSON
      info = JSON.parse(responseText);
    } catch (firstError) {
      // If that fails, try to extract JSON from markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          info = JSON.parse(codeBlockMatch[1]);
        } catch (codeBlockError) {
          throw new Error('Failed to parse JSON from code block');
        }
      } else {
        // Try to find JSON object in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            info = JSON.parse(jsonMatch[0]);
          } catch (jsonError) {
            throw new Error('Failed to parse extracted JSON');
          }
        } else {
          console.error('❌ No valid JSON found in medication response:', responseText);
          console.log('🔄 Using fallback response for medication info');
          info = createFallbackResponse('medication', medicationName);
        }
      }
    }

    // Validate required fields
    if (!info || typeof info !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }

    if (!info.medication) {
      console.error('❌ Missing medication field in response:', info);
      console.log('🔄 Using fallback response for incomplete medication info');
      info = createFallbackResponse('medication', medicationName);
    }
    
    return {
      success: true,
      info,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Medication info retrieval failed:', error);
    throw new Error(`Medication info retrieval failed: ${error.message}`);
  }
};

// Helper function to create fallback response when AI parsing fails
const createFallbackResponse = (type, input) => {
  if (type === 'prescription') {
    // Extract some basic information from the prescription text
    const lines = input.split('\n').filter(line => line.trim().length > 0);
    const possibleMedications = lines.filter(line => 
      line.match(/\b[A-Z][a-z]+\b/) && 
      (line.includes('mg') || line.includes('tablet') || line.includes('capsule') || line.includes('ml'))
    );
    
    return {
      prescriptionSummary: {
        totalMedications: possibleMedications.length || 1,
        complexityLevel: "Medium",
        estimatedCost: "Contact pharmacy for pricing",
        treatmentDuration: "As prescribed by healthcare provider",
        extractedText: input.substring(0, 200) + (input.length > 200 ? '...' : '')
      },
      medications: possibleMedications.length > 0 ? possibleMedications.map(med => ({
        name: med.split(' ')[0] || "Medication from prescription",
        genericName: "Generic name not available - consult pharmacist",
        dosage: med.match(/\d+\s*mg/) ? med.match(/\d+\s*mg/)[0] : "As prescribed",
        frequency: "As prescribed",
        route: "As prescribed",
        duration: "As prescribed",
        purpose: "Treatment as prescribed by healthcare provider",
        category: "Prescription medication",
        instructions: "Follow healthcare provider instructions exactly",
        foodInteractions: "Consult healthcare provider or pharmacist",
        storageInstructions: "Store as directed on prescription label",
        costEstimate: "Contact pharmacy for pricing"
      })) : [{
        name: "Medication from prescription",
        genericName: "Generic name not available - consult pharmacist",
        dosage: "As prescribed",
        frequency: "As prescribed",
        route: "As prescribed",
        duration: "As prescribed",
        purpose: "Treatment as prescribed by healthcare provider",
        category: "Prescription medication",
        instructions: "Follow healthcare provider instructions exactly",
        foodInteractions: "Consult healthcare provider or pharmacist",
        storageInstructions: "Store as directed on prescription label",
        costEstimate: "Contact pharmacy for pricing"
      }],
      drugInteractions: [],
      warnings: [
        "⚠️ This is a simplified analysis. The AI could not fully process your prescription.",
        "✅ Text was successfully extracted from your image",
        "📞 Please consult your healthcare provider or pharmacist for complete information",
        "🔍 For detailed analysis, try uploading a clearer image or typing the prescription text manually"
      ],
      patientInstructions: [
        "Take medications exactly as prescribed",
        "Contact healthcare provider with any questions or concerns",
        "Do not stop or change medications without medical supervision",
        "Report any adverse reactions to your healthcare provider immediately"
      ],
      emergencyContacts: {
        poisonControl: "1-800-222-1222",
        instructions: "Contact emergency services (911) for serious medical emergencies"
      }
    };
  } else if (type === 'medication') {
    return {
      medication: {
        name: input || "Unknown medication",
        genericName: "Information not available",
        brandNames: ["Information not available"],
        classification: "Information not available",
        mechanism: "Consult healthcare provider for mechanism of action",
        indications: ["As prescribed by healthcare provider"],
        contraindications: ["Consult healthcare provider"],
        dosageForm: ["Various forms available"],
        strengthsAvailable: ["Various strengths available"]
      },
      dosing: {
        adult: "As prescribed by healthcare provider",
        pediatric: "Consult healthcare provider",
        geriatric: "Consult healthcare provider",
        renalAdjustment: "Consult healthcare provider",
        hepaticAdjustment: "Consult healthcare provider"
      },
      administration: {
        route: "As prescribed",
        instructions: "Follow healthcare provider instructions",
        foodInteractions: "Consult healthcare provider",
        timingRecommendations: "As prescribed"
      },
      sideEffects: {
        common: ["Consult healthcare provider for side effect information"],
        serious: ["Contact healthcare provider immediately for serious side effects"],
        rare: ["Report any unusual symptoms to healthcare provider"]
      },
      monitoring: {
        parameters: ["Follow up with healthcare provider"],
        frequency: "As recommended by healthcare provider",
        labTests: ["As ordered by healthcare provider"]
      },
      patientEducation: {
        keyPoints: ["Take as prescribed", "Do not stop without consulting healthcare provider"],
        lifestyle: ["Consult healthcare provider for lifestyle recommendations"],
        warnings: ["This is incomplete information - consult healthcare provider"]
      },
      storage: "Store as directed",
      costInformation: "Contact pharmacy for pricing"
    };
  }
};
