// (Same as before, it's already using the CSS classes)
import React from 'react';
import '../../styles/components/Button.css';

const Button = ({ children, onClick, type = 'submit', variant = 'primary', disabled = false, fullWidth = false }) => {
  const buttonClasses = `btn ${variant} ${fullWidth ? 'full-width' : ''}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
};

export default Button;
