import React from 'react';

const APIKeyError = ({ error }) => {
  const isAPIKeyError = error.includes('Groq API key') || error.includes('API key');
  
  if (!isAPIKeyError) {
    return (
      <div className="error-message">
        <h4>❌ Analysis Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="api-key-error">
      <div className="error-header">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" strokeWidth="2"/>
        </svg>
        <h3>🤖 Groq API Key Required</h3>
      </div>
      
      <div className="error-content">
        <p>To use the AI-powered symptom checker, you need a Groq API key.</p>
        
        <div className="setup-steps">
          <h4>🚀 Quick Setup (2 minutes):</h4>
          <ol>
            <li>
              <strong>Get your free API key:</strong>
              <br />
              <a 
                href="https://console.groq.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="api-link"
              >
                https://console.groq.com/
              </a>
            </li>
            <li>
              <strong>Sign up and create API Key</strong> (it's completely free!)
            </li>
            <li>
              <strong>Copy the generated key</strong>
            </li>
            <li>
              <strong>Add it to your .env file:</strong>
              <div className="code-block">
                <code>VITE_GROQ_API_KEY=your_actual_api_key_here</code>
              </div>
            </li>
            <li>
              <strong>Restart the development server</strong>
            </li>
          </ol>
        </div>
        
        <div className="benefits">
          <h4>✨ What you'll get:</h4>
          <ul>
            <li>🤖 Ultra-fast AI-powered symptom analysis with Llama 3</li>
            <li>📊 Personalized health recommendations</li>
            <li>🎯 Intelligent follow-up questions</li>
            <li>📈 Risk assessment and urgency levels</li>
            <li>💡 Evidence-based medical insights</li>
            <li>⚡ Lightning-fast responses (faster than ChatGPT!)</li>
          </ul>
        </div>
        
        <div className="note">
          <p><strong>Note:</strong> Groq offers 14,400 free requests per day - much more generous than other providers!</p>
        </div>
      </div>
      
      <style jsx>{`
        .api-key-error {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          border: 2px solid #ef4444;
          border-radius: 12px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          text-align: left;
        }
        
        .error-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .error-header h3 {
          color: #dc2626;
          margin: 0;
          font-size: 1.5rem;
        }
        
        .setup-steps {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid #3b82f6;
        }
        
        .setup-steps h4 {
          color: #1e40af;
          margin-top: 0;
        }
        
        .setup-steps ol {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .setup-steps li {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        
        .api-link {
          color: #2563eb;
          text-decoration: none;
          font-family: monospace;
          font-weight: bold;
          padding: 0.25rem 0.5rem;
          background: #dbeafe;
          border-radius: 4px;
          display: inline-block;
          margin-top: 0.25rem;
        }
        
        .api-link:hover {
          background: #bfdbfe;
        }
        
        .code-block {
          background: #1f2937;
          color: #10b981;
          padding: 0.75rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
        
        .benefits {
          background: #f0f9ff;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1rem 0;
          border-left: 4px solid #10b981;
        }
        
        .benefits h4 {
          color: #059669;
          margin-top: 0;
        }
        
        .benefits ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .benefits li {
          margin-bottom: 0.5rem;
        }
        
        .note {
          background: #fffbeb;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #fbbf24;
          margin-top: 1rem;
        }
        
        .note p {
          margin: 0;
          color: #92400e;
        }
      `}</style>
    </div>
  );
};

export default APIKeyError;
