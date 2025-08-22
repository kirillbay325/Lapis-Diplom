import React, { useState, useEffect } from 'react';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [visibleTransactions, setVisibleTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const mockTransactions = [
    {
      id: 1,
      type: 'income',
      title: 'Оплата за верстку Landing Page',
      date: '15 декабря 2024',
      amount: 200.00,
      status: 'completed',
      icon: '+',
      statusText: 'Завершено'
    },
    {
      id: 2,
      type: 'income',
      title: 'Разработка React приложения',
      date: '12 декабря 2024',
      amount: 500.00,
      status: 'processing',
      icon: '⏳',
      statusText: 'В обработке'
    },
    {
      id: 3,
      type: 'expense',
      title: 'Вывод средств',
      date: '10 декабря 2024',
      amount: 300.00,
      status: 'completed',
      icon: '-',
      statusText: 'Завершено'
    },
    {
      id: 4,
      type: 'income',
      title: 'Дизайн логотипа',
      date: '5 декабря 2024',
      amount: 150.00,
      status: 'completed',
      icon: '+',
      statusText: 'Завершено'
    },
    {
      id: 5,
      type: 'expense',
      title: 'Оплата сервиса',
      date: '1 декабря 2024',
      amount: 50.00,
      status: 'completed',
      icon: '-',
      statusText: 'Завершено'
    }
  ];

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);

        setTransactions(mockTransactions);
        setLoading(false);
      } catch (err) {
        setError('Не удалось загрузить историю транзакций');
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;
    
    setVisibleTransactions([]);
    const timeouts = [];
    
    transactions.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleTransactions(prev => [...prev, index]);
      }, 100 * index);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [transactions]);

  if (loading) {
    return (
      <div className="transaction-history-container">
        <div className="transaction-history-header">
          <h3 className="transaction-history-title">История транзакций</h3>
          <div className="loading-skeleton skeleton-button"></div>
        </div>
        <div className="transaction-list">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="skeleton-transaction">
              <div className="skeleton-transaction-content">
                <div className="skeleton-transaction-icon"></div>
                <div>
                  <div className="skeleton-transaction-title"></div>
                  <div className="skeleton-transaction-date"></div>
                </div>
              </div>
              <div className="skeleton-transaction-amount"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transaction-history-container">
        <div className="transaction-history-header">
          <h3 className="transaction-history-title">История транзакций</h3>
          <button className="view-all-btn">Показать все →</button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="transaction-history-container">
      <div className="transaction-history-header">
        <h3 className="transaction-history-title">История транзакций</h3>
        <button className="view-all-btn">Показать все →</button>
      </div>
      
      <div className="transaction-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h4>История транзакций пуста</h4>
            <p>У вас пока нет завершенных транзакций</p>
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <div
              key={transaction.id}
              className={`transaction-item ${visibleTransactions.includes(index) ? 'visible' : 'hidden'}`}
            >
              <div className="transaction-content">
                <div className="transaction-icon-container">
                  <div className={`transaction-icon ${transaction.type}`}>
                    <span>{transaction.icon}</span>
                  </div>
                </div>
                <div className="transaction-details">
                  <h4 className="transaction-title">{transaction.title}</h4>
                  <p className="transaction-date">{transaction.date}</p>
                </div>
              </div>
              <div className="transaction-amount-container">
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                </div>
                <div className={`transaction-status ${transaction.status}`}>
                  {transaction.statusText}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;