import React, { useState, useEffect } from 'react';
import './AllOrder.css';
import axios from 'axios';

const AllOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/my-completed-services`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data);
      } catch (err) {
        console.error("Ошибка загрузки заказов:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const [visibleOrders, setVisibleOrders] = useState([]);

  useEffect(() => {
    if (orders.length === 0) return;
    
    setVisibleOrders([]);
    const timeouts = [];
    
    orders.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleOrders(prev => [...prev, index]);
      }, 100 * index);
      timeouts.push(timeout);
    });
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="all-orders-page all-orders-main-container loading">
        <div className="section-header">
          <div className="skeleton page-title"></div>
          <div className="skeleton total-orders"></div>
        </div>
        
        <div className="orders-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="order-card loading">
              <div className="skeleton order-title"></div>
              <div className="skeleton order-description"></div>
              <div className="skeleton order-meta"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="all-orders-page all-orders-main-container">
      <div className="section-header">
        <h2 className="page-title">Мои выполненные заказы</h2>
        <p className="total-orders">Всего заказов: {orders.length}</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>Вы еще не выполнили ни одного заказа</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className={`order-card ${visibleOrders.includes(index) ? 'visible' : ''}`}
            >
              <div className="order-header">
                <div className="order-info">
                  <h3 className="order-title">{order.service_title}</h3>
                  <p className="order-description">{order.description}</p>
                  <div className="order-meta">
                    <span className="order-price">${order.price}</span>
                    <span className="order-duration">{order.duration} дней</span>
                  </div>
                </div>
              </div>
              <div className="order-footer">
                <div className="order-category">
                  <span className="category-value">Категория: {order.category}</span>
                </div>
                <div className="order-client">
                  <span className="client-value">Заказчик: {order.customer_name}</span>
                </div>
                <div className="order-date">
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllOrder;