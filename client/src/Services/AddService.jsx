import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddService.css";
import { useAlert } from "../Alert/AlertContext";

function AddService({ onServiceAdded }) {
  const { 
    showSuccessAddService, 
    showErrorAddService 
  } = useAlert();
  
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    freelancer_name: "",
    service_title: "",
    description: "",
    price: "",
    duration: "",
    skills: "",
    category: "",
    image: null
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "skills") {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === "image" && files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      showErrorAddService(
        "Ошибка авторизации",
        "Пожалуйста, войдите в систему",
        "✕"
      );
      navigate("/ServicesList");
      return;
    }

    try {
      const processedSkills = formData.skills
        .split(/[\s,]+/)
        .map(skill => skill.trim())
        .filter(skill => skill !== "")
        .join(",");

      const data = new FormData();
      data.append("freelancer_name", formData.freelancer_name);
      data.append("service_title", formData.service_title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("duration", formData.duration);
      data.append("category", formData.category);
      data.append("skills", processedSkills);
      
      if (formData.image) {
        data.append("image", formData.image);
      }

      const response = await axios.post(
        "http://localhost:8000/services", 
        data, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (onServiceAdded) {
        onServiceAdded(response.data);
      }
      
      showSuccessAddService(
        "Услуга добавлена",
        "Ваша услуга успешно опубликована",
        "✓"
      );
      
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }

      setFormData({
        freelancer_name: "",
        service_title: "",
        description: "",
        price: "",
        duration: "",
        skills: "",
        category: "",
        image: null
      });

      setTimeout(() => {
        navigate("/ServicesList");
      }, 1000);

    } catch (err) {
      console.error("Ошибка:", err);
      
      let errorMsg = "Не удалось добавить услугу";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMsg = "Сессия истекла. Пожалуйста, войдите снова.";
          localStorage.removeItem("token");
          setTimeout(() => {
            showErrorAddService(
              "Сессия истекла",
              "Пожалуйста, войдите в систему снова",
              "✕"
            );
            navigate("/login");
          }, 1000);
        } 
        else if (err.response.data && err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data && typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
      }
      
      setError(errorMsg);
      setSuccess("");
      
      showErrorAddService(
        "Ошибка добавления",
        errorMsg,
        "✕"
      );
    }
  };
  
  return (
    <div className="add-service-modal">
    <p className="back-button" onClick={() => navigate("/ServicesList")}>
      ← Все заказы 
    </p>
      <div className="add-service-card">
        <h3 className="add-service-title">Добавить услугу</h3>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-service-form">
          <div className="form-group">
            <label>Категория</label>
            <select 
              className="add-service-select"
              name="category" 
              value={formData.category}
              onChange={handleChange} 
              required
            >
              <option value="">Выберите категорию</option>
              <option value="Программирование">Программирование</option>
              <option value="Дизайн">Дизайн</option>
              <option value="Маркетинг">Маркетинг</option>
              <option value="Копирайтинг">Копирайтинг</option>
              <option value="Другое">Другое</option>
            </select>
          </div>

          <div className="form-group">
            <label>Название услуги</label>
            <input
              type="text"
              name="service_title"
              placeholder="Например: Верстка Landing Page"
              value={formData.service_title}
              onChange={handleChange}
              required
              className="add-service-input"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              name="description"
              placeholder="Опишите услугу"
              value={formData.description}
              onChange={handleChange}
              required
              className="add-service-input add-service-textarea"
            />
          </div>

          <div className="form-group">
            <label>Цена ($)</label>
            <input
              type="number"
              name="price"
              placeholder="Например: 200"
              value={formData.price}
              onChange={handleChange}
              required
              className="add-service-input"
            />
          </div>

          <div className="form-group">
            <label>Длительность (дни)</label>
            <input
              type="number"
              name="duration"
              placeholder="Например: 5"
              value={formData.duration}
              onChange={handleChange}
              required
              className="add-service-input"
            />
          </div>

          <div className="form-group">
            <label>Навыки (через запятую)</label>
            <input
              type="text"
              name="skills"
              placeholder="HTML, CSS, React"
              value={formData.skills}
              onChange={handleChange}
              required
              className="add-service-input"
            />
          </div>

          <div className="form-group">
            <label>Изображение</label>
            <div className="image-upload">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
              {preview ? (
                <img src={preview} alt="Превью" className="image-preview" />
              ) : (
                <div className="image-placeholder">Выберите изображение</div>
              )}
            </div>
          </div>

          <button type="submit" className="submit-service-btn">
            Добавить услугу
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddService;