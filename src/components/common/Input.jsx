// (Same as before, it's already using the CSS classes)
import React from 'react';
import '../../styles/components/Input.css';

const Input = React.forwardRef(({ label, type = 'text', placeholder, error, ...props }, ref) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <p className="input-error-message">{error}</p>}
    </div>
  );
});

export default Input;
