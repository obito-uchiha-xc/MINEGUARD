import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      suffix,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className={`mg-input-group ${disabled ? 'is-disabled' : ''} ${error ? 'has-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="mg-input-label">
            {label}
          </label>
        )}
        <div className="mg-input-wrapper">
          {leftIcon && <span className="mg-input__addon mg-input__addon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className="mg-input"
            {...props}
          />
          {suffix && <span className="mg-input__suffix">{suffix}</span>}
          {rightIcon && <span className="mg-input__addon mg-input__addon--right">{rightIcon}</span>}
        </div>
        {error ? (
          <p id={errorId} className="mg-input-message mg-input-message--error" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mg-input-message">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
