// Test file to debug Groq API responses
import { analyzePrescription, getMedicationInfo } from './prescriptionAPI.js';

// Simple test prescription
const testPrescription = `
Rx: Amoxicillin 500mg
Sig: Take 1 capsule by mouth three times daily
Disp: #21 (twenty-one)
Refills: 0
`;

// Test user profile
const testProfile = {
  age: 30,
  gender: 'Female',
  weight: '65kg',
  allergies: 'None',
  conditions: 'None',
  currentMedications: 'None'
};

// Test functions
export const testPrescriptionAnalysis = async () => {
  try {
    console.log('🧪 Testing prescription analysis...');
    const result = await analyzePrescription(testPrescription, testProfile, 'comprehensive');
    console.log('✅ Test passed:', result);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

export const testMedicationInfo = async () => {
  try {
    console.log('🧪 Testing medication info...');
    const result = await getMedicationInfo('Ibuprofen');
    console.log('✅ Test passed:', result);
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run tests from browser console:
// import('./testAPI.js').then(m => m.testMedicationInfo())
// import('./testAPI.js').then(m => m.testPrescriptionAnalysis())
