import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Header.css';
import { Link } from 'react-router-dom';
import { useAlert } from '../Alert/AlertContext';

export const AuthContext = React.createContext();

function Header({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const API_URL = 'http://localhost:8000'; 
  

  const { 
    showSuccess,
    showSuccessLogIn,
    showError, 
    showErrorLogIn,
    showWarning,
    showInfo 
  } = useAlert();

  useEffect(() => {
    checkAuth();
    const handleAuthUpdate = (e) => {
      setIsAuthenticated(e.detail.isAuthenticated);
      setUserData(e.detail.user);
    };
    window.addEventListener('authUpdate', handleAuthUpdate);
    return () => {
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token);
    setUserData(user ? JSON.parse(user) : null);
  };

  const openModal = (type) => {
    setShowModal(type);
    setModalClosing(false);
    document.body.style.overflow = 'hidden';
    setFormData({
      username: '',
      email: '',
      password: ''
    });
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setShowModal(null);
      setModalClosing(false);
      document.body.style.overflow = 'auto';
      setFormData({
        username: '',
        email: '',
        password: ''
      });
    }, 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      const { token, user, message } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      setUserData(user);
      window.dispatchEvent(new CustomEvent('authUpdate', {
        detail: { isAuthenticated: true, user }
      }));
      showSuccessLogIn(
        'Регистрация успешна!',
        message || 'Добро пожаловать в систему!',
        '✓'
      );
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Ошибка регистрации';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.detail || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      showErrorLogIn(
        'Регистрация не удалась',
        errorMessage,
        '✕'
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username: formData.username, 
        password: formData.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.data?.token) {
        throw new Error('Сервер не вернул токен');
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      setUserData(response.data.user);
      window.dispatchEvent(new CustomEvent('authUpdate', {
        detail: { 
          isAuthenticated: true, 
          user: response.data.user 
        }
      }));
      closeModal();
      showSuccessLogIn(
        'Вход выполнен',
        'Добро пожаловать обратно!',
        '✓'
      );
    } catch (err) {
      let errorMessage = 'Ошибка при входе';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const data = err.response.data;
          if (Array.isArray(data.detail)) {
            const messages = data.detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`);
            errorMessage = "Ошибка валидации: " + messages.join("; ");
          } else if (typeof data.detail === 'object') {
            errorMessage = Object.entries(data.detail)
              .map(([key, value]) => `${key}: ${value}`)
              .join("; ");
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          }
        } else if (err.request) {
          errorMessage = 'Сервер не отвечает';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      showErrorLogIn(
        'Ошибка входа',
        errorMessage,
        '✕'
      );
    }
  };

  const authValue = {
    isAuthenticated,
    userData,
    openModal,
    closeModal
  };

  const handleAnchorClick = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    const element = document.querySelector(targetId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className='block-header'>
        <div className='main-header'>
          <div className='logo'>
            <Link to={'/'}>
              <img src="./img/logo.webp" alt="Логотип" className='logo-img' />
            </Link>
          </div>
          
          <div className='navbar'>
            <Link to={'/'}>
              <p className='nav-text'>Главная</p>
            </Link>
            <Link to={'/ServicesList'}>
              <p className='nav-text'>Заказы</p>
            </Link>
            <a href="#footer" onClick={handleAnchorClick}>
              <p className='nav-text' >О нас</p>
            </a>
          </div>
          
          <div className='main-login-btn'>
            {!isAuthenticated ? (
              <>
                <button className='login-btn' onClick={() => openModal('login')}>Войти</button>
                <button className='register-btn' onClick={() => openModal('register')}>Регистрация</button>
              </>
            ) : (
              <Link to={'/Profile'}>
                <button className='profile-btn'>Профиль</button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {(showModal) && (
        <div 
          className={`modal-overlay ${modalClosing ? 'closing' : ''}`}
          onClick={handleOverlayClick}>
          {showModal === 'login' ? (
            <div className={`modal-content login-modal ${modalClosing ? 'closing' : ''}`}>
              <button className='modal-close-btn' onClick={closeModal}>×</button>
              <div className='auth-form'>
                <h2 className='perfect-text login-text'>Вход в аккаунт</h2>
                <p className='hello-text'>Добро пожаловать в FreeLance</p>
                <form className='login-form' onSubmit={handleLogin}>
                  <div>
                    <p className='over-input-text'>Имя пользователя</p>
                    <input 
                      className='name-input' 
                      type="text" 
                      name="username"
                      placeholder="Имя пользователя" 
                      value={formData.username}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <p className='over-input-text'>Пароль</p>
                    <input 
                      className='password-input' 
                      type="password" 
                      name="password"
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <button className='login-btn-modal' type="submit">Войти</button>
                </form>
                <p style={{color: '#9CA3AF'}}>Нет аккаунта? <span className='have-account-text' onClick={() => openModal('register')}>Зарегистрироваться</span></p>
              </div>
            </div>
          ) : (
            <div className={`modal-content register-modal ${modalClosing ? 'closing' : ''}`}>
              <button className='modal-close-btn' onClick={closeModal}>×</button>
              <div className='auth-form'>
                <h2 className='perfect-text login-text'>Регистрация</h2>
                <p className='hello-text'>Присоединитесь к сообществу профессионалов</p>
                <form className='register-form' onSubmit={handleRegister}>
                  <p className='over-input-text'>Имя пользователя</p>
                  <input 
                    className='name-input' 
                    type="text" 
                    name="username"
                    placeholder="Имя пользователя" 
                    value={formData.username}
                    onChange={handleInputChange}
                    required 
                  />
                  <p className='over-input-text'>Email</p>
                  <input 
                    className='email-input' 
                    type="email" 
                    name="email"
                    placeholder="Example@email.com" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required 
                  />
                  <p className='over-input-text'>Пароль</p>
                  <input 
                    className='password-input' 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleInputChange}
                    required 
                  />
                  <button className='register-btn-modal' type="submit">Зарегистрироваться</button>
                </form>
                <p style={{color: '#9CA3AF'}}>Уже есть аккаунт? <span className='have-account-text' onClick={() => openModal('login')}>Войти</span></p>
              </div>
            </div>
          )}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export default Header;
export const useAuth = () => React.useContext(AuthContext);