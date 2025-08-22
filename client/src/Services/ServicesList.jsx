import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Services.css";
import AddService from "./AddService";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ServicesList() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [visibleServices, setVisibleServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Все категории");
  const [budget, setBudget] = useState("Любой");
  const [duration, setDuration] = useState("Любой");
  const [status, setStatus] = useState("Все");
  
  const [users, setUsers] = useState({}); 
  const [avatars, setAvatars] = useState({}); 
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const getStatusClass = (status) => {
    if (status === "Открытый") return "status-tag-open";
    if (status === "В разработке") return "status-tag-working";
    if (status === "Завершенный") return "status-tag-completed";
    return "status-tag";
  };

  useEffect(() => {
    if (location.state?.category) {
      setCategory(location.state.category);
    }
  }, [location.state?.category]);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
    fetchServices();
  }, []);

  useEffect(() => {
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowForm(false);
    }
  }, [isAuthenticated]);


  useEffect(() => {
    if (filteredServices.length === 0) return;
    setVisibleServices([]);
    const timeouts = [];
    filteredServices.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleServices((prev) => [...prev, index]);
      }, 100 * index);
      timeouts.push(timeout);
    });
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [filteredServices]);

  const fetchUser = async (userId) => {
    if (!userId || users[userId]) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => ({ ...prev, [userId]: response.data }));
    } catch (err) {
      console.error(`Не удалось загрузить пользователя ${userId}:`, err);
    }
  };

  const fetchUserAvatar = async (userId) => {
    if (!userId || avatars[userId]) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/users/${userId}/avatar`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      let imagePath = response.data.image_path;
      if (imagePath && !imagePath.startsWith("/")) {
        imagePath = "/" + imagePath;
      }
      
      const fullUrl = `http://localhost:8000${imagePath}`;
      setAvatars(prev => ({ ...prev, [userId]: fullUrl }));
    } catch (err) {
      console.error(`Не удалось загрузить аватарку для пользователя ${userId}:`, err);
      setAvatars(prev => ({ ...prev, [userId]: null }));
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/services");
      setServices(response.data);
      setFilteredServices(response.data);
      
      response.data.forEach(service => {
        if (service.user_id) {
          fetchUser(service.user_id);
          fetchUserAvatar(service.user_id);
        }
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...services];
    if (category !== "Все категории") {
      result = result.filter((service) => service.category === category);
    }
    if (budget !== "Любой") {
      if (budget === "до 100") {
        result = result.filter((service) => service.price <= 100);
      } else if (budget === "100-500") {
        result = result.filter((service) => service.price >= 100 && service.price <= 500);
      } else if (budget === "500-1000") {
        result = result.filter((service) => service.price >= 500 && service.price <= 1000);
      } else if (budget === "1000+") {
        result = result.filter((service) => service.price >= 1000);
      }
    }
    if (duration !== "Любой") {
      if (duration === "1-3 дня") {
        result = result.filter((service) => service.duration >= 1 && service.duration <= 3);
      } else if (duration === "3-7 дней") {
        result = result.filter((service) => service.duration >= 3 && service.duration <= 7);
      } else if (duration === "1-2 недели") {
        result = result.filter((service) => service.duration >= 7 && service.duration <= 14);
      } else if (duration === "Месяц+") {
        result = result.filter((service) => service.duration >= 30);
      }
    }
    if (status !== "Все") {
      result = result.filter((service) => service.status === status);
    }
    setFilteredServices(result);
  }, [category, budget, duration, status, services]);

  const handleServiceAdded = (newService) => {
    setServices((prev) => [...prev, newService]);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="loading-container dark-theme">
        <div className="loading-spinner"></div>
        <p>Загрузка услуг...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message dark-theme">Ошибка: {error}</div>;
  }

  return (
    <div className="services-container dark-theme">
      <div className="all-services-title">
        <div className="all-services-text">
          <h1 className="all-services-title-h1">Все заказы</h1>
          <p className="all-services-title-p">Найдите подходящий проект под вас</p>
        </div>
        {isAuthenticated ? (
          <Link to="/AddService">
            <button
              className="add-service-btn"
              onClick={() => setShowForm(true)}
            >
              Создать заказ
            </button>
          </Link>
        ) : (
          <button className="add-service-btn disabled" disabled>
            Создать заказ
          </button>
        )}
      </div>
      <div className="filters-container">
        <div className="filter-group">
          <label>Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Все категории</option>
            <option>Программирование</option>
            <option>Дизайн</option>
            <option>Маркетинг</option>
            <option>Копирайтинг</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Бюджет</label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <option>Любой</option>
            <option>до 100</option>
            <option>100-500</option>
            <option>500-1000</option>
            <option>1000+</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Длительность</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option>Любой</option>
            <option>1-3 дня</option>
            <option>3-7 дней</option>
            <option>1-2 недели</option>
            <option>Месяц+</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Статус</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Все</option>
            <option>Открытые</option>
            <option>В работе</option>
            <option>Завершенные</option>
          </select>
        </div>
      </div>
      <div className="card-container">
        {filteredServices.length === 0 ? (
          <p className="no-services-message">Нет подходящих заказов</p>
        ) : (
          filteredServices.map((service, index) => {
            const user = users[service.user_id];
            const avatar = avatars[service.user_id];
            
            return (
              <div
                key={service.id}
                className={`freelancer-card ${visibleServices.includes(index) ? "show" : "hide"}`}
              >
                <div className="freelancer-header">
                  <div className="freelancer-avatar">
                    <img
                      loading="lazy"
                      src={avatar || "./img/user.webp"}
                      alt={user?.username || "аватар заказчика"}
                      onError={(e) => {
                        e.target.src = "./img/user.webp";
                      }}
                    />
                  </div>
                  <div className="card-header">
                    <div className="freelancer-meta">
                      <h4 className="freelancer-name">{user?.username || "Загрузка..."}</h4>
                    </div>
                    <div className="freelancer-rating">
                      <p className={getStatusClass(service.status)}>{service.status}</p>
                      <p className="category-title">{service.category}</p>
                    </div>
                  </div>
                </div>
                <div className="service-info">
                  <h3 className="service-title">{service.service_title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
                <div className="skills">
                  {service.skills ? (
                    service.skills
                      .split(",")
                      .map((skill, idx) => (
                        <span className="skill-tag" key={idx}>
                          {skill.trim()}
                        </span>
                      ))
                  ) : (
                    <span className="no-skills">Нет навыков</span>
                  )}
                </div>
                <div className="pricing">
                  <div className="price-info">
                    <span className="price">{service.price} $</span>
                    <span className="duration">{service.duration} дней</span>
                  </div>
                  <Link to="/Full_Services" state={{ service: service }}>
                    <button className="order-btn">Заказать</button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ServicesList;