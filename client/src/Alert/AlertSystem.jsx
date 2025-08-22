import React from 'react';
import { useAlert } from './AlertContext';
import './Alert.css';

const AlertSystem = () => {
  const { 
    alerts, 
    removeAlert,
    showSuccess,
    showWarning,
    showError,
    showInfo 
  } = useAlert();

  return (
    <div className="alert-container">
      <div className="alert-controls" style={{display: 'none'}}>
        <h1 className="title">System Alerts</h1>
        <div className="controls">
          <button className="button success" onClick={showSuccess}>Success</button>
          <button className="button warning" onClick={showWarning}>Warning</button>
          <button className="button error" onClick={showError}>Error</button>
          <button className="button info" onClick={showInfo}>Info</button>
        </div>
      </div>

      {alerts.map(alert => (
        <div 
          key={alert.id}
          className={`notification alert ${alert.type} ${alert.isExiting ? 'exiting' : ''}`}
          style={{
            top: `${30 + alerts.findIndex(a => a.id === alert.id) * 136}px`,
            right: '30px'
          }}
        >
          <button 
            className="close-button" 
            onClick={() => removeAlert(alert.id)}
            aria-label="Close alert"
          >
            ×
          </button>
          <div className="alert-header">
            <div className="alert-icon">{alert.icon}</div>
            <div className="alert-title">{alert.title}</div>
          </div>
          <div className="alert-message">{alert.message}</div>
        </div>
      ))}
    </div>
  );
};

export default AlertSystem;