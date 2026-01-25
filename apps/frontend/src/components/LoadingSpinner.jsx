import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'medium', className = '', ...props }) => {
  const sizeClasses = {
    small: { container: 'w-4 h-4', border: 'border-2' },
    medium: { container: 'w-8 h-8', border: 'border-3' },
    large: { container: 'w-12 h-12', border: 'border-4' }
  };

  const config = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`inline-block rounded-full border-solid border-cyan-400 border-r-transparent animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite] ${config.container} ${className}`}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default LoadingSpinner;
