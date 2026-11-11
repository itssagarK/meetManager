import React from 'react';

export const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notice">
      <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
