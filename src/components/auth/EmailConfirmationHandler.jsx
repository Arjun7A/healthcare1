import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const EmailConfirmationHandler = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get URL parameters from both search and hash
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const token_hash = searchParams.get('token_hash');
        
        // Also check the URL hash for parameters (Supabase sometimes uses hash-based routing)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const hashTokenHash = hashParams.get('token_hash');
        
        // Use hash params if search params are empty
        const finalAccessToken = accessToken || hashAccessToken;
        const finalRefreshToken = refreshToken || hashRefreshToken;
        const finalType = type || hashType;
        const finalTokenHash = token_hash || hashTokenHash;
        
        console.log('Email confirmation params:', { 
          finalAccessToken: finalAccessToken ? 'present' : 'missing', 
          finalRefreshToken: finalRefreshToken ? 'present' : 'missing', 
          finalType, 
          finalTokenHash: finalTokenHash ? 'present' : 'missing',
          searchParams: Object.fromEntries(searchParams.entries()),
          hashParams: Object.fromEntries(hashParams.entries())
        });
        
        // Add debug info for development
        if (import.meta.env.DEV) {
          console.log('🔍 DEBUG - Current URL:', window.location.href);
          console.log('🔍 DEBUG - Search params:', Object.fromEntries(searchParams.entries()));
          console.log('🔍 DEBUG - Hash params:', Object.fromEntries(hashParams.entries()));
          console.log('🔍 DEBUG - Final tokens available:', {
            accessToken: !!finalAccessToken,
            refreshToken: !!finalRefreshToken,
            tokenHash: !!finalTokenHash,
            type: finalType
          });
        }
        
        // Method 1: Try using setSession with access_token and refresh_token
        if (finalAccessToken && finalRefreshToken) {
          console.log('Attempting setSession method...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken,
          });

          if (error) {
            console.error('setSession error:', error);
            
            // If setSession fails, try alternative method with token_hash
            if (finalTokenHash) {
              console.log('Trying alternative method with token_hash...');
              
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: finalTokenHash,
                type: 'email'
              });
              
              if (verifyError) {
                console.error('verifyOtp error:', verifyError);
                handleConfirmationError(error); // Use the original setSession error
              } else {
                console.log('Email confirmed via verifyOtp:', verifyData);
                handleConfirmationSuccess(verifyData);
              }
            } else {
              handleConfirmationError(error);
            }
          } else {
            console.log('Email confirmed via setSession:', data);
            handleConfirmationSuccess(data);
          }
        } 
        // Method 2: Try using token_hash if available but no access/refresh tokens
        else if (finalTokenHash) {
          console.log('Attempting verifyOtp method with token_hash...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: finalTokenHash,
            type: 'email'
          });
          
          if (error) {
            console.error('verifyOtp error:', error);
            handleConfirmationError(error);
          } else {
            console.log('Email confirmed via verifyOtp:', data);
            handleConfirmationSuccess(data);
          }
        } 
        // Method 3: Check for auth state change (user might already be logged in)
        else {
          console.log('No tokens found, checking current auth state...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session check error:', sessionError);
            setError('Unable to verify your current session. Please try signing in again.');
          } else if (session?.user) {
            console.log('User already has active session:', session.user);
            
            // Check if email is confirmed
            if (session.user.email_confirmed_at) {
              console.log('Email already confirmed, redirecting to dashboard...');
              setSuccess(true);
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              setError('Your email is not yet confirmed. Please check your email for the confirmation link.');
            }
          } else {
            // Check if there are any URL parameters at all
            const allSearchParams = Array.from(searchParams.entries());
            const allHashParams = Array.from(hashParams.entries());
            
            console.log('All search params:', allSearchParams);
            console.log('All hash params:', allHashParams);
            
            if (allSearchParams.length === 0 && allHashParams.length === 0) {
              setError('This page is only accessible through email confirmation links. Please check your email and click the confirmation link.');
            } else {
              console.error('Missing required tokens in URL');
              setError('Invalid confirmation link - missing required parameters. Please try clicking the link from your email again.');
            }
          }
        }
      } catch (err) {
        console.error('Confirmation error:', err);
        setError('Something went wrong during confirmation. Please try again or contact support.');
      } finally {
        setLoading(false);
      }
    };

    const handleConfirmationError = (error) => {
      // Provide more specific error messages based on the error type
      if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
        setError('This confirmation link has expired or is invalid. Please sign up again to receive a new confirmation email.');
      } else if (error.message.includes('expired')) {
        setError('This confirmation link has expired. Please sign up again to receive a new confirmation email.');
      } else if (error.message.includes('invalid')) {
        setError('This confirmation link is invalid. Please make sure you clicked the correct link from your email.');
      } else {
        setError(`Email confirmation failed: ${error.message}. Please try signing up again.`);
      }
    };

    const handleConfirmationSuccess = (data) => {
      console.log('✅ Email confirmation successful!', data);
      
      // Verify the user is actually confirmed
      if (data?.user?.email_confirmed_at || data?.user) {
        console.log('✅ User confirmed, email_confirmed_at:', data?.user?.email_confirmed_at);
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        console.warn('⚠️ Session created but email confirmation unclear:', data);
        setError('Email confirmation incomplete. Please check your email for the confirmation link or sign up again.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <p>Confirming your email...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '2rem'
      }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Email Confirmation Issue</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '1.5rem' }}>{error}</p>
          
          {error.includes('only accessible through email') ? (
            <div style={{ 
              background: '#eff6ff', 
              border: '1px solid #3b82f6', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <strong style={{ color: '#1e40af' }}>To confirm your email:</strong>
              <ol style={{ color: '#1e40af', margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                <li>Check your email inbox (and spam folder)</li>
                <li>Look for an email from your healthcare app</li>
                <li>Click the "Confirm Email" button/link in the email</li>
                <li>You'll be redirected back here with confirmation</li>
              </ol>
              <p style={{ color: '#1e40af', margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                <strong>Note:</strong> If you don't have a confirmation email, sign up again to receive a new one.
              </p>
            </div>
          ) : error.includes('expired') || error.includes('Invalid Refresh Token') ? (
            <div style={{ 
              background: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <strong style={{ color: '#92400e' }}>Common causes:</strong>
              <ul style={{ color: '#92400e', margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                <li>The confirmation link has expired (links typically expire after 24 hours)</li>
                <li>The link has already been used</li>
                <li>You may have clicked an old confirmation email</li>
              </ul>
              <p style={{ color: '#92400e', margin: '0.5rem 0 0 0' }}>
                <strong>Solution:</strong> Sign up again to receive a fresh confirmation email.
              </p>
            </div>
          ) : null}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Sign Up Again
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#ffffff',
                color: '#667eea',
                border: '2px solid #667eea',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Go to Login
            </button>
          </div>
          
          {/* Debug info in development */}
          {import.meta.env.DEV && (
            <details style={{ marginTop: '1rem', fontSize: '0.8rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Debug Information</summary>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '4px' }}>
                <p><strong>Current URL:</strong> {window.location.href}</p>
                <p><strong>Search Params:</strong> {JSON.stringify(Object.fromEntries(searchParams.entries()))}</p>
                <p><strong>Hash:</strong> {window.location.hash}</p>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '2rem'
      }}>
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#16a34a', marginBottom: '1rem' }}>Email Confirmed!</h2>
          <p style={{ color: '#15803d', marginBottom: '1.5rem' }}>
            Your email has been successfully confirmed. You will be redirected to your dashboard shortly.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Redirecting in 2 seconds...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default EmailConfirmationHandler;
