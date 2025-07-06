import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth';
import Button from '../../common/Button';
import { resendConfirmationEmail } from '../../../utils/emailConfirmation';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const { signUp } = useAuth();

  // Validate form in real-time
  useEffect(() => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPassword = password.length >= 6;
    const isValidName = fullName.trim().length >= 2;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    setFormValid(isValidEmail && isValidPassword && isValidName && passwordsMatch);
  }, [email, password, confirmPassword, fullName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Use the current origin for the redirect
          emailRedirectTo: `${window.location.origin}/confirm-email`,
        },
      });

      if (signUpError) throw signUpError;

      // Check if user was created but needs email confirmation
      if (data?.user && !data?.session) {
        setMessage('Account created successfully! Please check your email (including spam folder) to confirm your account before signing in.');
        setShowResendButton(true);
      } else if (data?.user && data?.session) {
        setMessage('Account created and signed in successfully!');
        setShowResendButton(false);
      } else {
        setMessage('Account created successfully! Please check your email to confirm your account.');
        setShowResendButton(true);
      }
    } catch (err) {
      // Better error handling for common issues
      if (err.message.includes('already registered')) {
        setError('An account with this email already exists. Please try signing in instead.');
      } else if (err.message.includes('email')) {
        setError('Please enter a valid email address.');
      } else if (err.message.includes('password')) {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    const result = await resendConfirmationEmail(email);
    
    if (result.error) {
      setError('Failed to resend email: ' + result.error);
    } else {
      setMessage('Confirmation email sent! Please check your inbox and spam folder.');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="16,8 10,14 8,12" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {message}
          {showResendButton && (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={loading || !email}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #16a34a',
                borderRadius: '6px',
                color: '#16a34a',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}
            >
              Resend Email
            </button>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="fullName" className="form-label">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="form-input"
          required
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="form-input"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div className="password-input-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password (min. 6 characters)"
            className="form-input"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm Password
        </label>
        <div className="password-input-wrapper">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="form-input"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <div className="error-message">
            Passwords do not match
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={loading || !formValid}
        className="submit-btn"
      >
        {loading ? (
          <span className="loading">
            <div className="spinner"></div>
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      {showResendButton && (
        <button
          type="button"
          onClick={handleResendEmail}
          className="resend-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="loading">
              <div className="spinner"></div>
              Resending...
            </span>
          ) : (
            'Resend Confirmation Email'
          )}
        </button>
      )}
    </form>
  );
};

export default SignUpForm;
