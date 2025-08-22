import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Services.css";
import { Link } from "react-router-dom";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({}); 
  const [avatars, setAvatars] = useState({}); 

  const getStatusClass = (status) => {
    if (status === "Открытый") return "status-tag-open";
    if (status === "В разработке") return "status-tag-working";
    if (status === "Завершенный") return "status-tag-completed";
    return "status-tag";
  };

  useEffect(() => {
    fetchServices();
  }, []);


  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/services");
      setServices(response.data.slice(0, 3));
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (services.length > 0) {
      services.forEach(service => {
        if (service.user_id) {
          fetchUser(service.user_id);
          fetchUserAvatar(service.user_id);
        }
      });
    }
  }, [services]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div className="services-container">
      <div className="services-title-container">
        <h1 className='services-title'>
          Рекомендуемые услуги
        </h1>
        <Link to="/ServicesList">
          <p className='see-all-title'>
            Смотреть все →
          </p> 
        </Link>
      </div>
      <div className="card-container">
        {services.map((service) => {
          const user = users[service.user_id];
          const avatar = avatars[service.user_id];
          
          return (
            <div className="freelancer-card" key={service.id}>
              <div className="freelancer-header">
                <div className="freelancer-avatar">
                  <img
                    src={avatar || "./img/user.webp"}
                    alt={user?.username || "аватар заказчика"}
                    onError={(e) => {
                      e.target.src = "./img/user.webp";
                    }}
                  />
                </div>
                <div className="card-header">
                  <div className="freelancer-meta">
                    <h4 className=" freelancer-name " id="freelancer-name-max-width">{user?.username || "Загрузка..."}</h4>
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
                {service.skills
                  ? service.skills.split(",").map((skill, index) => (
                      <span className="skill-tag" key={index}>
                        {skill.trim()}
                      </span>
                    ))
                  : "Нет навыков"}
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
        })}
      </div>
    </div>
  );
}

export default Services;