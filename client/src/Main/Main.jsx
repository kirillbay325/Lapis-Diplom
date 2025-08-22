import React, { useState, useEffect } from 'react';
import './Main.css';
import './Сategories.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";

function Main() {
  const [counts, setCounts] = useState({
    Программирование: 0,
    Дизайн: 0,
    Маркетинг: 0,
    Копирайтинг: 0,
  });
  const API_URL = 'http://localhost:8000';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`${API_URL}/services`);
      const services = response.data;

      const foundService = services.find(service =>
        service.service_title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (foundService) {
        navigate('/Full_Services', { state: { service: foundService } });
      } else {
        alert("Услуга не найдена");
      }
    } catch (err) {
      console.error("Ошибка поиска:", err);
      alert("Не удалось выполнить поиск");
    }
  };

  useEffect(() => {
    fetch('http://localhost:8000/services/categories')
      .then((res) => res.json())
      .then((data) => {
        const categories = data.categories || [];

        const newCounts = { ...counts };

        categories.forEach((category) => {
          if (category === 'Программирование') newCounts.Программирование += 1;
          if (category === 'Дизайн') newCounts.Дизайн += 1;
          if (category === 'Маркетинг') newCounts.Маркетинг += 1;
          if (category === 'Копирайтинг') newCounts.Копирайтинг += 1;
        });

        setCounts(newCounts);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке категорий:', err);
      });
  }, []);

  const formatNumber = (num) => num.toLocaleString();

  return (
    <>
      <div className="main">
        <h1 className="main-title">
          Найдите <span className="perfect-text">идеального</span> фрилансера для вашего проекта
        </h1>

        <h3 className="main-subtitle">
          Современная платформа для поиска талантливых специалистов и интересных проектов
        </h3>

        <div className="search-container">
            <div className="search-bar">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Найти услуги, фрилансеров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">Поиск</button>
              </form>
            </div>
          </div>
      </div>
      

      <div className="categories-main">
        <h1 className="categories-title">Популярные категории</h1>

        <div className="categories-container">
          <Link
            to="/ServicesList"
            state={{ category: "Программирование" }}
            className="category-item-link"
          >
            <div className="category-item">
              <div className="category-icon">💻</div>
              <p className="category-name">Программирование</p>
              <p className="category-quantity">{formatNumber(counts.Программирование)} услуг</p>
            </div>
          </Link>

          <Link
              to="/ServicesList"
              state={{ category: "Дизайн" }}
              className="category-item-link"
            >
              <div className="category-item">
                <div className="category-icon">🎨</div>
                <p className="category-name">Дизайн</p>
                <p className="category-quantity">{formatNumber(counts.Дизайн)} услуг</p>
              </div>
            </Link>

            <Link
              to="/ServicesList"
              state={{ category: "Маркетинг" }}
              className="category-item-link"
            >
              <div className="category-item">
                <div className="category-icon">📈</div>
                <p className="category-name">Маркетинг</p>
                <p className="category-quantity">{formatNumber(counts.Маркетинг)} услуг</p>
              </div>
            </Link>

            <Link
              to="/ServicesList"
              state={{ category: "Копирайтинг" }}
              className="category-item-link"
            >
              <div className="category-item">
                <div className="category-icon">✍️</div>
                <p className="category-name">Копирайтинг</p>
                <p className="category-quantity">{formatNumber(counts.Копирайтинг)} услуг</p>
              </div>
            </Link>

        </div>
      </div>
    </>
  );
}

export default Main;