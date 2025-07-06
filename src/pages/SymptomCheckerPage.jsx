import React from 'react';
import Navbar from '../components/layout/Navbar';
import SymptomChecker from '../components/features/health/SymptomChecker';
import '../styles/components/Navbar.css';
import '../styles/components/SymptomChecker.css';

const SymptomCheckerPage = () => {
  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Symptom Analysis</h1>
          <p>Get AI-powered insights about your symptoms and receive helpful health guidance.</p>
        </div>
        <SymptomChecker />
      </div>
    </div>
  );
};

export default SymptomCheckerPage;
