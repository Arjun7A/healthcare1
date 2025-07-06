import React, { useState } from 'react';
import LoginForm from '../components/features/auth/LoginForm';
import SignUpForm from '../components/features/auth/SignUpForm';
import "../styles/pages/AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      {/* Left Side - Healthcare Hero Section */}
      <div className="auth-hero">
        {/* Top Brand Section */}
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
              </svg>
            </div>
            <span className="brand-name">HealthAssist</span>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Trusted Healthcare Platform</span>
            </div>
            
            <h1 className="hero-title">
              Your Personal
              <br />
              <span className="hero-title-accent">Health Assistant</span>
            </h1>
            
            <p className="hero-description">
              Your intelligent health companion is here. Get personalized insights, connect with specialists, and manage your health journey seamlessly. Our platform offers AI-driven symptom analysis, secure record keeping, and direct access to healthcare professionals, all in one place.
            </p>

            {/* <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Accuracy Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Support</div>
              </div>
            </div> */}
          </div>

          {/* Medical Illustration */}
          <div className="medical-illustration">
            <div className="illustration-main">
              {/* Simple Doctor Figure */}
              <div className="doctor-figure">
                <div className="doctor-head"></div>
                <div className="doctor-body"></div>
                <div className="stethoscope"></div>
              </div>
              
              {/* Medical Icons */}
              <div className="medical-icons">
                <div className="medical-icon heart-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#ff6b9d"/>
                  </svg>
                </div>
                <div className="medical-icon plus-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v16m8-8H4" stroke="#4ade80" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="medical-icon pulse-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#60a5fa" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="hero-features">
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <span>AI-Powered Diagnosis</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <span>Telemedicine Integration</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span>Secure Health Records</span>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="trust-section">
          <div className="trust-indicators">
            <div className="trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Private & Secure</span>
            </div>
            <div className="trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Expert-Backed</span>
            </div>
            <div className="trust-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span>Always Available</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="hero-footer">
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact Us</a>
          </div>
          <p className="copyright">© 2024 HealthAssist. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Clean Login Form */}
      <div className="auth-form-section">
        <div className="auth-container">
          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="auth-form-container">
            {isLogin ? <LoginForm /> : <SignUpForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
