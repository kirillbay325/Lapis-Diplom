import { createContext, useContext, useState, useRef, useEffect } from 'react';
import './Alert.css';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const timers = useRef({});

  const removeAlert = (id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }

    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, isExiting: true } : alert
      )
    );

    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 300);
  };

  const showAlert = (type, title, message, icon) => {
    const id = Date.now();
    const newAlert = { id, type, title, message, icon, isExiting: false };
    
    setAlerts(prev => [...prev, newAlert]);
    
    const timerId = setTimeout(() => {
      removeAlert(id);
    }, 5000);
    
    timers.current[id] = timerId;
  };

  const showSuccess = () => {
    showAlert('success', 'Успешно!', 'Operation completed successfully. All systems online.', '✓');
  };

  const showSuccessLogIn = () => {
    showAlert('success', 'Успешно!', 'Успешный вход', '✓');
  };

  const showSuccessAddService = () => {
    showAlert('success', 'Успешно!', 'Услуга успешно добавлена', '✓');
  };

  const showSuccessChangeData = () => {
    showAlert('success', 'Успешно!', 'Данные успешно изменены', '✓');
  };


  const showWarning = () => {
    showAlert('warning', 'Warning', 'System anomaly detected. Please review configuration settings.', '⚠');
  };



  const showError = () => {
    showAlert('error', 'Ошибка❗', 'Ошибка ', '✕');
  };

   const showErrorLogIn = () => {
    showAlert('error', 'Ошибка❗', 'Ошибка Входа', '✕');
  };

  const showErrorAddService = () => {
    showAlert('error', 'Ошибка❗', 'Не удалось добавить услугу', '✕');
  };

  const showErrorChangeData = () => {
    showAlert('error', 'Ошибка❗', 'Не удалось изменить данные', '✕');
  };



  const showInfo = () => {
    showAlert('info', 'Information', 'New system update available. Click to learn more.', 'i');
  };

  const value = {
    alerts,
    removeAlert,

    showSuccess,
    showSuccessLogIn,
    showSuccessAddService,
    showSuccessChangeData,
    
    showWarning,

    showError,
    showErrorLogIn,
    showErrorAddService,
    showErrorChangeData,

    showInfo,

    showAlert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};