import React from 'react';
import { ChevronDown } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, id, className = '', disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    return (
      <div className={`mg-select-group ${disabled ? 'is-disabled' : ''} ${error ? 'has-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="mg-select-label">
            {label}
          </label>
        )}
        <div className="mg-select-wrapper">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className="mg-select"
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="mg-select-option">
                {opt.label}
              </option>
            ))}
          </select>
          <span className="mg-select__chevron" aria-hidden="true">
            <ChevronDown size={16} />
          </span>
        </div>
        {error ? (
          <p id={errorId} className="mg-select-message mg-select-message--error" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mg-select-message">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
