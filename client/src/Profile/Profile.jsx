import React, { useState, useEffect, useRef } from 'react';
import './Profile.css';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from "../Alert/AlertContext";

function Profile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    surname: '',
    number: '',
    country: '',
    city: '',
    description: '',
    data: null,
    image: null
  });
  const [preview, setPreview] = useState(null);
  const API_URL = 'http://localhost:8000';
  const fileInputRef = useRef(null);
  const prevPreviewRef = useRef(null);
  const navigate = useNavigate();
  const [changingPassword, setChangingPassword] = useState(false);

  const { 
    showSuccessChangeData, 
    showErrorChangeData 
  } = useAlert();

  const fetchFreshUserData = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/worker/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const freshUserData = response.data.user;
      setUserData(freshUserData);
      setFormData(prev => ({
        ...prev,
        ...freshUserData,
        image: null
      }));

      localStorage.setItem('user', JSON.stringify(freshUserData));

      if (freshUserData.image_path) {
        const previewUrl = `http://localhost:8000/${freshUserData.image_path}`;
        setPreview(previewUrl);
        if (prevPreviewRef.current) {
          URL.revokeObjectURL(prevPreviewRef.current);
        }
        prevPreviewRef.current = previewUrl;
      } else {
        setPreview(null);
        if (prevPreviewRef.current) {
          URL.revokeObjectURL(prevPreviewRef.current);
          prevPreviewRef.current = null;
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки данных пользователя:", err);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token) {
      setIsAuthenticated(true);
      
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUserData(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          surname: parsedUser.surname || '',
          number: parsedUser.number || '',
          country: parsedUser.country || '',
          city: parsedUser.city || '',
          description: parsedUser.description || '',
          data: parsedUser.data || null,
          image: null
        });
        fetchFreshUserData(token);
      } else {
        fetchFreshUserData(token);
      }
    } else {
      setIsAuthenticated(false);
      setUserData(null);
      setFormData({
        name: '',
        email: '',
        surname: '',
        number: '',
        country: '',
        city: '',
        description: '',
        data: null,
        image: null
      });
    }
  };

  useEffect(() => {
    checkAuth();
    const syncAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const isAuthenticated = !!token;
      const userData = user ? JSON.parse(user) : null;
      setIsAuthenticated(isAuthenticated);
      setUserData(userData);
      window.dispatchEvent(new CustomEvent('authUpdate', {
        detail: { isAuthenticated, user: userData }
      }));
    };
    
    syncAuth();
    
    const handleAuthUpdate = (e) => {
      setIsAuthenticated(e.detail.isAuthenticated);
      setUserData(e.detail.user);
    };
    
    window.addEventListener('authUpdate', handleAuthUpdate);
    return () => {
      window.removeEventListener('authUpdate', handleAuthUpdate);
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
      
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      prevPreviewRef.current = objectUrl;
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'image' && key !== 'image_path') {
          formDataToSend.append(key, value);
        }
      });
      
      if (formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }
      
      const response = await axios.post(`${API_URL}/worker`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }
      
      const updatedUser = { ...userData, ...response.data.user };
      setUserData(updatedUser);
      
      if (response.data.user.image_path) {
        const newPreviewUrl = `http://localhost:8000/${response.data.user.image_path}`;
        setPreview(newPreviewUrl);
        prevPreviewRef.current = newPreviewUrl;
      }
      
      setFormData((prev) => ({ 
        ...prev, 
        ...response.data.user,
        image: null
      }));
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      window.dispatchEvent(new CustomEvent('authUpdate', {
        detail: { isAuthenticated: true, user: updatedUser },
      }));
      
      showSuccessChangeData(
        "Данные обновлены",
        "Ваш профиль успешно обновлен",
        "✓"
      );
      
    } catch (err) {
      console.error('Ошибка при обновлении:', err);
      
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
        setPreview(null);
      }
      
      let errorMsg = "Ошибка при сохранении данных";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMsg = "Сессия истекла. Пожалуйста, войдите снова.";
          localStorage.removeItem("token");
          navigate("/login");
        } 
        else if (err.response.data && err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data && typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
      }
      
      showErrorChangeData(
        "Ошибка обновления",
        errorMsg,
        "✕"
      );
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      if (prevPreviewRef.current) {
        URL.revokeObjectURL(prevPreviewRef.current);
        prevPreviewRef.current = null;
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUserData(null);
      setFormData({
        name: '',
        email: '',
        surname: '',
        number: '',
        country: '',
        city: '',
        description: '',
        data: null,
        image: null
      });
      setPreview(null);

      window.dispatchEvent(new CustomEvent('authUpdate', {
        detail: { isAuthenticated: false, user: null },
      }));

      navigate('/');
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    
    const currentPassword = document.querySelector('input[placeholder="Текущий пароль"]').value;
    const newPassword = document.querySelector('input[placeholder="Новый пароль"]').value;
    const confirmPassword = document.querySelector('input[placeholder="Подтвердить пароль"]').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorChangeData(
        "Ошибка смены пароля",
        "Все поля обязательны",
        "✕"
      );
      setChangingPassword(false);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showErrorChangeData(
        "Ошибка смены пароля",
        "Новый пароль и подтверждение не совпадают",
        "✕"
      );
      setChangingPassword(false);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/change-password`,
        { 
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword 
        },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      showSuccessChangeData(
        "Пароль изменен",
        response.data.message || "Пароль успешно изменён",
        "✓"
      );
      
      document.querySelector('input[placeholder="Текущий пароль"]').value = "";
      document.querySelector('input[placeholder="Новый пароль"]').value = "";
      document.querySelector('input[placeholder="Подтвердить пароль"]').value = "";
      
    } catch (err) {
      showErrorChangeData(
        "Ошибка смены пароля",
        err.response?.data?.detail || "Ошибка при смене пароля",
        "✕"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо!')) {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`${API_URL}/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Ошибка при удалении аккаунта');
        }
        
        if (prevPreviewRef.current) {
          URL.revokeObjectURL(prevPreviewRef.current);
          prevPreviewRef.current = null;
        }
        
        localStorage.clear();
        setIsAuthenticated(false);
        setUserData(null);
        
        window.dispatchEvent(new CustomEvent('authUpdate', {
          detail: { isAuthenticated: false, user: null },
        }));
        
        navigate('/');
      } catch (error) {
        console.error('Delete account error:', error);
        showErrorChangeData(
          "Ошибка удаления аккаунта",
          error.message || "Не удалось удалить аккаунт",
          "✕"
        );
      }
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <GeneralInfo
            userData={userData}
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            handleLogout={handleLogout}
            handleFileChange={handleFileChange}
            fileInputRef={fileInputRef}
            preview={preview}
          />
        );
      case 'finances':
        return <FinancesSection />;
      case 'freelancer':
      return <FreelancerSection userData={userData} />;
      case 'orders':
        return <OrdersSection />;
      case 'settings':
        return <SettingsSection 
          handleLogout={handleLogout} 
          handleDeleteAccount={handleDeleteAccount} 
          handleChangePassword={handleChangePassword} 
          changingPassword={changingPassword}
        />;
      default:
        return <GeneralInfo />;
    }
  };

  if (!isAuthenticated) {
    return <div style={{ display: 'none' }}></div>;
  }

  return (
    <div className='profile-main'>
      <h1 className='profile-title'>Мой профиль</h1>
      <p className='management-text'>Управляйте своим профилем и настройками</p>
      <div className='profile-container'>
        <div className='profile-nav-container'>
          <p
            className={`profile-nav-item ${activeSection === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSection('general')}
          >👤 Общая информация</p>
          <p
            className={`profile-nav-item ${activeSection === 'freelancer' ? 'active' : ''}`}
            onClick={() => setActiveSection('freelancer')}
          >💼 Анкета фрилансера</p>
          <p
            className={`profile-nav-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveSection('orders')}
          >📋 Мои заказы</p>
          <p
            className={`profile-nav-item ${activeSection === 'finances' ? 'active' : ''}`}
            onClick={() => setActiveSection('finances')}
          >💰 Финансы</p>
          <p
            className={`profile-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >⚙️ Настройки</p>
        </div>
        <div className='profile-content'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

const GeneralInfo = ({ 
  userData, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  handleLogout, 
  handleFileChange, 
  fileInputRef,
  preview 
}) => {
  return (
    <>
        <h2 className='profile-info-title'>Общая информация</h2>
    <div className='profile-info-section'>
      <form className='profile-form' onSubmit={handleSubmit}>
        <div className="avatar-info-wrapper">
          <div className='avatar-container'>
            <img
              loading="lazy"
              src={preview || "./img/user.webp"}
              alt="аватарка"
              className='profile-avatar'
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              className='change-photo-btn'
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className='profile-user-info'>
            <p className='profile-username'>{userData?.username}</p>
            <p className='profile-member-since'>
              Участник с {formData.data ? new Date(formData.data).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long'
              }) : 'дата неизвестна'}
            </p>
          </div>
        </div>
                <input
                    type="text"
                    name="name"
                    placeholder="Имя"
                    className="profile-input"
                    value={formData.name}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="surname"
                    placeholder="Фамилия"
                    className="profile-input"
                    value={formData.surname}
                    onChange={handleInputChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="profile-input"
                    value={formData.email}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="number"
                    placeholder="Телефон"
                    className="profile-input"
                    value={formData.number}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="country"
                    placeholder="Страна"
                    className="profile-input"
                    value={formData.country}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="city"
                    placeholder="Город"
                    className="profile-input"
                    value={formData.city}
                    onChange={handleInputChange}
                />
                <textarea
                    className="profile-textarea"
                    placeholder="Опишите себя"
                    rows="4"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                ></textarea>
                <button type="submit" className="save-btn">
                    Сохранить изменения
                </button>
            </form>
        </div>
    </>
  );
};

const FinancesSection = () => {
  const [finances, setFinances] = useState({ balance: 0, total_earned: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchFinances = async () => {
      try {
        const response = await axios.get(`${API_URL}/finances`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFinances(response.data);
      } catch (err) {
        console.error("Ошибка загрузки финансов:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchFinances();
  }, [token]);

  const handleWithdraw = async () => {
    const amount = parseFloat(prompt("Введите сумму для вывода:"));
    if (!amount || amount <= 0) return;
    try {
      await axios.post(`${API_URL}/withdraw`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Запрос на вывод отправлен");
      const response = await axios.get(`${API_URL}/finances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFinances(response.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Ошибка вывода");
    }
  };

  if (loading) return <div>Загрузка финансов...</div>;

  return (
    <div className="finances-section">
      <div className='finance-card-container'>
        <div className='output-card'>
          <div className='finance-icon'><p>💰</p></div>
          <p className='finance-output-title'>${finances.balance.toFixed(2)}</p>
          <p className='finance-subtitle'>Доступно для вывода</p>
          <button className='output-output-btn' onClick={handleWithdraw}>Вывести</button>
        </div>
        <div className='ATT-card'>
          <div className='finance-icon'><p>📊</p></div>
          <p className='finance-ATT-title'>${finances.total_earned.toFixed(2)}</p>
          <p className='finance-subtitle'>Общий доход</p>
          <p className='finance-ATT-value'>+12% за месяц</p>
        </div>
      </div>
      <div className="transaction-page">
        <div className="page-header">
          <h1 className="page-title">История выводов</h1>
          <p className="page-description">Все ваши транзакции за последнее время</p>
        </div>
        {finances.transactions && finances.transactions.length > 0 ? (
          <ul className="transactions-list">
            {finances.transactions.map((t, index) => (
              <li
                key={t.id}
                className="transaction-item"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="transaction-amount">-{t.amount}$</div>
                <div className="transaction-date">
                  {new Date(t.created_at).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className={`transaction-status status-${t.status.toLowerCase()}`}>
                  {t.status}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-transactions">
            <p>Нет транзакций</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FreelancerSection = ({ userData }) => {
  const [completedServices, setCompletedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleServices, setVisibleServices] = useState([]);
  const API_URL = 'http://localhost:8000';
  const token = localStorage.getItem('token');
  const [userRating, setUserRating] = useState(0);
  
  useEffect(() => {
    const fetchRating = async () => {
      if (!userData?.id || !token) {
        setUserRating(0);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/users/${userData.id}/rating`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setUserRating(response.data.rating);
      } catch (err) {
        console.error('Ошибка загрузки рейтинга:', err);
        setUserRating(0);
      }
    };

    fetchRating();
  }, [userData?.id, token]);

  useEffect(() => {
    const fetchCompletedServices = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const response = await axios.get(`${API_URL}/my-completed-services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCompletedServices(response.data);
      } catch (err) {
        console.error("Ошибка загрузки завершенных заказов:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchCompletedServices();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (completedServices.length === 0) return;
    setVisibleServices([]);
    const timeouts = [];
    const servicesToShow = Math.min(2, completedServices.length);
    for (let index = 0; index < servicesToShow; index++) {
      const timeout = setTimeout(() => {
        setVisibleServices(prev => [...prev, index]);
      }, 100 * index);
      timeouts.push(timeout);
    }
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [completedServices]);

  const totalServices = completedServices.length;
  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="freelancer-container">
      <div className="header-actions">
        <h2 className="section-title">Анкета фрилансера</h2>
        <div className="action-buttons">
          <Link to="/ServicesList">
            <button className="btn btn-add-service">
              Выполнить заказ
            </button>
          </Link>
        </div>
      </div>
      <div className="stats-grid-freelance">
        <div className="stat-card">
          <div className="service-value-title">{totalServices}</div>
          <div className="stat-label">Услуг</div>
        </div>
        <div className="stat-card">
          <div className="service-rating-title">{userRating}</div>
          <div className="stat-label"><p>Рейтинг</p></div>
        </div>

      </div>
      <div className="services-section">
        <div className="section-header">
          <h3 className="section-subtitle">Мои выполенные заказы</h3>
          <Link to="/AllOrder">
            <p className='see-all-title' style={{ margin: '0' }}>Все выполненные заказы →</p>
          </Link>
        </div>
        <div className="services-grid">
          {completedServices.slice(0, 2).map((service, index) => (
            <div 
              key={service.id} 
              className={`service-card ${visibleServices.includes(index) ? 'visible' : 'hidden'}`}
            >
              <div className="service-header">
                <div className="service-info">
                  <h3 className="service-title">{service.service_title}</h3>
                  <p className="service-description">{service.description}</p>
                  <div className="service-meta">
                    <span className="service-price">${service.price}</span>
                    <span className="service-duration">{service.duration} дней</span>
                  </div>
                </div>
                <div className="service-actions">
                </div>
              </div>
              <div className="service-footer">
                <div className="service-category">
                  <span className="category-label">Категория:</span>
                  <span className="category-value">{service.category}</span>
                </div>
              </div>
            </div>
          ))}
          {completedServices.length === 0 && (
            <div className="empty-services">
              <p>Вы еще не выполнили ни одного заказа</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrdersSection = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleServices, setVisibleServices] = useState([]);
  const API_URL = 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${API_URL}/my-services`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setServices(response.data);
      } catch (err) {
        console.error('Ошибка загрузки заказов:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchServices();
    } else {
      console.error('Токен не найден');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (services.length === 0) return;
    setVisibleServices([]);
    const timeouts = [];
    services.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleServices(prev => [...prev, index]);
      }, 100 * index);
      timeouts.push(timeout);
    });
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [services]);

  const activeCount = services.filter(s => s.status === "Открытый").length;
  const inProgressCount = services.filter(s => s.status === "В разработке").length;
  const completedCount = services.filter(s => s.status === "Завершенный").length;

  if (loading) {
    return (
      <div className="orders-stats-container">
        <div className="header">
          <h2>Мои заказы</h2>
          <Link to='/AddService'>
            <button className="create-order-btn">Создать заказ</button>
          </Link>
        </div>
        <div className="loading-skeleton">
          <div className="skeleton-stats-grid">
            <div className="skeleton-stat-card"></div>
            <div className="skeleton-stat-card"></div>
            <div className="skeleton-stat-card"></div>
          </div>
          <div className="skeleton-service-card"></div>
          <div className="skeleton-service-card"></div>
          <div className="skeleton-service-card"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="orders-stats-container">
        <div className="header">
          <h2>Мои заказы</h2>
          <Link to='/AddService'>
            <button className="create-order-btn">Создать заказ</button>
          </Link>
        </div>
        <div className="stats-grid">
          <div className="stat-card active-orders">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Открытые</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-value">{inProgressCount}</div>
            <div className="stat-label">В разработке</div>
          </div>
          <div className="stat-card completed-orders">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Завершенные</div>
          </div>
        </div>
        {services.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <p>📋</p>
            </div>
            <h3>Заказов пока нет</h3>
            <p>Создайте свой первый заказ</p>
            <Link to='/AddService'>
              <button className="create-order-btn">Создать заказ</button>
            </Link>
          </div>
        ) : (
          <div className="services-list">
            {services.map((service, index) => (
              <div 
                key={service.id} 
                className={`order-card ${visibleServices.includes(index) ? 'visible' : 'hidden'}`}
              >
                <div className="order-header">
                  <div className="order-info">
                    <h4 className="order-title">{service.service_title}</h4>
                    <p className="order-description">{service.description}</p>
                  </div>
                  <div className="order-actions">
                  </div>
                </div>
                <div className="order-meta">
                  <div className="meta-item">
                    <span className="meta-icon">🏷️</span>
                    <span className="meta-text">{service.category}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">💰</span>
                    <span className="meta-text">{service.price} $</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">⏳</span>
                    <span className="meta-text">{service.duration} дней</span>
                  </div>
                </div>
                <div className="order-footer">
                  <span className={`status-badge ${service.status.toLowerCase().replace(' ', '-')}`}>
                    {service.status}
                  </span>
                  <div className="skills-tag-items">
                    {service.skills?.split(',').slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill.trim()}
                      </span>
                    ))}
                    {service.skills?.split(',').length > 3 && (
                      <span className="skill-tag more">
                        +{service.skills.split(',').length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const SettingsSection = ({ 
  handleLogout, 
  handleDeleteAccount, 
  handleChangePassword,
  changingPassword 
}) => (
  <div>
    <div>
      <h2 className='settings-title'>Настройки</h2>
      <div className="settings-section">
        <h3 className='settings-subtitle'>Изменить пароль</h3>
        <form 
          className="change-password-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleChangePassword();
          }}
        >
          <div className="change-password-container">
            <input 
              type="password" 
              className="password-input input-setting" 
              placeholder="Текущий пароль" 
              required
            />
            <input 
              type="password" 
              className="password-input input-setting" 
              placeholder="Новый пароль" 
              required
            />
            <input 
              type="password" 
              className="password-input input-setting" 
              placeholder="Подтвердить пароль" 
              required
            />
          </div>
          <button 
            className="change-password-btn" 
            type="submit"
            disabled={changingPassword}
          >
            {changingPassword ? "Загрузка..." : "Сменить пароль"}
          </button>
        </form>
      </div>
    </div>
    <div className='danger-zone-container'>
      <h2 className='danger-zone-title'>Опасная зона</h2>
      <div className="logout-container">
        <div className="logout-text-container">
          <p className="logout-title" onClick={handleLogout}>Выйти из аккаунта</p>
          <p className="logout-subtitle">Выйти из аккаунта с возможностью восстановления</p>
        </div>
        <div className="logout-btn-container">
          <button className="logout-btn" onClick={handleLogout}>Выйти</button>
        </div>
      </div>
      <div className='delete-account-container'>
        <div className="delete-account-text-container">
          <p className='delete-account-title'>Удалить аккаунт</p>
          <p className='delete-account-subtitle'>Безвозвратно удалить ваш аккаунт и все данные</p>
        </div>
        <div className='delete-account-btn-container'>
          <button className="delete-account-btn" onClick={handleDeleteAccount}>Удалить</button>
        </div>
      </div>
    </div>
  </div>
);

export default Profile;