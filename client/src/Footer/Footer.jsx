
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer" id='footer'>
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-column logo-column">
            <div className="footer-logo">
              <div className="logo-img-container">
                <img src="./img/logo.webp" alt="FreeLance логотип" className="footer-logo-img" loading="lazy" />
              </div>
              <div className="logo-text-container">
                <p className="footer-tagline">Платформа для фрилансеров и заказчиков</p>
              </div>
            </div>
            <p className="footer-description">
              Lapis — это современная платформа, которая объединяет талантливых фрилансеров 
              и заказчиков со всего мира. Создавайте проекты, находите исполнителей и развивайте свой бизнес.
            </p>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">Платформа</h3>
            <ul className="footer-links">
              <li><a href="">Главная</a></li>
              <li><a href="">Услуги</a></li>
              <li><a href="">Проекты</a></li>
              <li><a href="">Фрилансеры</a></li>
              <li><a href="">О нас</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">Помощь</h3>
            <ul className="footer-links">
              <li><a href="">Частые вопросы</a></li>
              <li><a href="t">Техподдержка</a></li>
              <li><a href="">Руководства</a></li>
              <li><a href="">Условия использования</a></li>
              <li><a href="">Политика конфиденциальности</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">Контакты</h3>
            <div className="footer-contact">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-text">support@lapis.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <span className="contact-text">+7 (918) 945-00-38</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span className="contact-text">г. Краснодар, ул. Базовская, д. 254</span>
              </div>
            </div>
            
            <div className="social-links">
              <a href="" className="social-link">
                <img src="./img/logo-max.svg" alt="" className='social-max-logo' loading="lazy"/>
              </a>
              <a href="" className="social-link">
                <img src="./img/logo-telegram.webp" alt="" className='social-logo' loading="lazy"/>
              </a>
              <a href="" className="social-link">
                <img src="./img/logo-github.webp" alt=""className='social-logo' loading="lazy"/>
              </a>
              <a href="" className="social-link">
                <img src="./img/logo-gmail.webp" alt="" className='social-logo' loading="lazy"/>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">© 2025 Lapis. Все права защищены.</p>
          <div className="footer-bottom-links">
            <a href="/terms">Условия использования</a>
            <a href="/privacy">Политика конфиденциальности</a>
            <a href="/cookies">Политика файлов cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;