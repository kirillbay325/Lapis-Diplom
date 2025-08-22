import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Full_Services.css";
import axios from "axios";

function Full_Services({ formData }) {
  const location = useLocation();
  const [service, setService] = useState(location.state?.service || null);
  const [loading, setLoading] = useState(!location.state?.service);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [executor, setExecutor] = useState(null);
  const [customerAvatar, setCustomerAvatar] = useState(null);
  const [status, setStatus] = useState(service?.status || "Открытый");
  const [reviews, setReviews] = useState(service?.reviews || 0);
  const [copied, setCopied] = useState(false);
  const [responses, setResponses] = useState([]);
  const [executorRating, setExecutorRating] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filteredServices, setFilteredServices] = useState([]);
  const [services, setServices] = useState([]);

  const API_URL = "http://localhost:8000";
  const userData = JSON.parse(localStorage.getItem("user")) || {};
  const currentUser =
    formData?.name || formData?.username || userData.username || "Аноним";

  const hasResponded = responses.includes(currentUser);

  const [customer, setCustomer] = useState(null);
  const [customerRating, setCustomerRating] = useState(0);
  const [customerReviewCount, setCustomerReviewCount] = useState(0);
  const [executorReviewCount, setExecutorReviewCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    const checkIfRated = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_URL}/services/${service.id}/has-rated`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHasRated(response.data.has_rated);
      } catch (err) {
        console.error("Ошибка проверки оценки:", err);
      }
    };

    if (service.id && userData?.id === service.user_id) {
      checkIfRated();
    }
  }, [service.id, userData]);

  const handleSubmitRating = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/services/${service.id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasRated(true);
      alert(`Спасибо за оценку ${rating} звезд!`);
    } catch (err) {
      alert(err.response?.data?.detail || "Не удалось отправить оценку");
    }
  };

  const fetchCustomerRating = async (customerId) => {
    console.log("🔍 Запрос рейтинга заказчика:", customerId);
    if (!customerId) {
      setCustomerRating(0);
      setCustomerReviewCount(0);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/users/${customerId}/rating`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Ответ сервера (заказчик):", response.data);
      setCustomerRating(response.data.rating);
      setCustomerReviewCount(response.data.count);
    } catch (err) {
      console.error("❌ Ошибка загрузки рейтинга заказчика:", err);
      setCustomerRating(0);
      setCustomerReviewCount(0);
    }
  };


  const fetchExecutorRating = async (freelancerId) => {
    console.log("🔍 Запрос рейтинга исполнителя:", freelancerId);
    if (!freelancerId) {
      setExecutorRating(0);
      setExecutorReviewCount(0);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/users/${freelancerId}/rating`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Ответ сервера (исполнитель):", response.data);
      setExecutorRating(response.data.rating);
      setExecutorReviewCount(response.data.count);
    } catch (err) {
      console.error("❌ Ошибка загрузки рейтинга исполнителя:", err);
      setExecutorRating(0);
      setExecutorReviewCount(0);
    }
  };

  useEffect(() => {
    console.log("🔁 useEffect запущен");
    console.log("location.search:", location.search);
    console.log("service:", service);
    const searchParams = new URLSearchParams(location.search);
    const serviceId = searchParams.get("id");

    const fetchCustomer = async (userId) => {
      if (!userId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCustomer(response.data);
      } catch (err) {
        console.error("Не удалось загрузить заказчика:", err);
        setCustomer(null);
      }
    };


    const fetchExecutor = async (freelancerId) => {
      if (!freelancerId) {
        setExecutor(null);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/users/${freelancerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setExecutor(response.data);
      } catch (err) {
        console.error("Не удалось загрузить исполнителя:", err);
        setExecutor(null);
      }
    };

    const fetchCustomerAvatar = async (userId) => {
      if (!userId) {
        setCustomerAvatar(null);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8000/users/${userId}/avatar`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );


        let imagePath = response.data.image_path;
        console.log("Получен путь аватарки:", imagePath);


        if (imagePath && !imagePath.startsWith("/")) {
          imagePath = "/" + imagePath;
        }


        const fullUrl = `http://localhost:8000${imagePath}`;
        console.log("Формируемый URL аватарки:", fullUrl);

        setCustomerAvatar(fullUrl);
      } catch (err) {
        console.error("Не удалось загрузить аватар заказчика:", err);
        setCustomerAvatar(null);
      }
    };


    const fetchService = async (id) => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/services/${id}`
        );
        const serviceData = response.data;
        setService(serviceData);


        if (serviceData.user_id) {
          await fetchCustomer(serviceData.user_id);
          await fetchCustomerAvatar(serviceData.user_id);
          await fetchCustomerRating(serviceData.user_id);
        }

        if (serviceData.freelancer_id) {
          await fetchExecutor(serviceData.freelancer_id);
          await fetchExecutorRating(serviceData.freelancer_id);
        }
      } catch (err) {
        console.error("Ошибка загрузки сервиса:", err);
        alert("Не удалось загрузить сервис");
      } finally {
        setLoading(false);
      }
    };


    if (serviceId) {
      if (service && service.id === Number(serviceId)) {
        if (service.user_id) {
          fetchCustomer(service.user_id);
          fetchCustomerAvatar(service.user_id);
          fetchCustomerRating(service.user_id);
        }
        if (service.freelancer_id) {
          fetchExecutor(service.freelancer_id);
          fetchExecutorRating(service.freelancer_id);
        }
      } else {
        fetchService(serviceId);
      }
    } else {
      if (service) {
        if (service.user_id) {
          fetchCustomer(service.user_id);
          fetchCustomerAvatar(service.user_id);
          fetchCustomerRating(service.user_id);
        }
        if (service.freelancer_id) {
          fetchExecutor(service.freelancer_id);
          fetchExecutorRating(service.freelancer_id);
        }
      } else {
        alert("Не указан ID сервиса");
      }
    }
  }, [location, service]);

  const changeStatus = async (newStatus) => {
    try {
      setLoading(true);

      const statusResponse = await fetch(
        `http://localhost:8000/services/${service.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!statusResponse.ok) {
        const error = await statusResponse.json().catch(() => ({}));
        throw new Error(error.detail || "Ошибка при обновлении статуса");
      }

      const statusResult = await statusResponse.json();
      setStatus(statusResult.status);

      if (newStatus === "В разработке" && !hasResponded) {
        const updatedReviews = reviews + 1;

        const reviewsResponse = await fetch(
          `http://localhost:8000/services/${service.id}/reviews`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reviews: updatedReviews }),
          }
        );

        if (!reviewsResponse.ok) {
          throw new Error("Ошибка при обновлении количества отзывов");
        }

        const reviewsResult = await reviewsResponse.json();
        setReviews(reviewsResult.reviews);

        const responseResponse = await fetch(
          `http://localhost:8000/services/${service.id}/responses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: currentUser }),
          }
        );

        if (!responseResponse.ok) {
          const error = await responseResponse.json().catch(() => ({}));
          throw new Error(error.detail || "Ошибка при отправке отклика");
        }

        const responseResult = await responseResponse.json();
        setResponses([...responses, responseResult.name]);
      } else {
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const currentUrl = `${window.location.origin}/Full_Services?id=${service.id}`;

    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Не удалось скопировать текст: ", err);
        alert("Не удалось скопировать ссылку");
      });
  };

  const handleRespond = async () => {
    try {
      console.log("🔧 handleRespond вызван");

      const token = localStorage.getItem("token");
      console.log("Токен:", token ? "есть" : "отсутствует");

      if (!token) {
        setError("Необходимо войти в аккаунт");
        return;
      }

      if (!service?.id) {
        console.error("❌ service.id не найден", service);
        setError("Не удалось определить ID заказа");
        return;
      }

      console.log(
        "Отправляю запрос на:",
        `${API_URL}/services/${service.id}/respond`
      );

      const response = await axios.post(
        `${API_URL}/services/${service.id}/respond`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Успешный ответ:", response.data);


      setStatus(response.data.status);
      setSuccess("Вы откликнулись на заказ");
      setError("");
      setResponses([...responses, currentUser]);

      setTimeout(() => setSuccess(""), 1500);
    } catch (err) {
      console.error("❌ Ошибка отклика:", err);
      console.error("Ответ сервера:", err.response?.data);

      setError(
        err.response?.data?.detail || err.message || "Не удалось откликнуться"
      );
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };


  const handleComplete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.patch(
        `${API_URL}/services/${service.id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStatus("Завершенный");
      setSuccess(`Заказ завершён. Вам начислено ${response.data.balance}$`);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось завершить заказ");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const statusResponse = await axios.patch(
        `${API_URL}/services/${service.id}/status`,
        { status: "Открытый" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );


      const updatedReviews = Math.max(0, reviews - 1);
      const reviewsResponse = await axios.patch(
        `${API_URL}/services/${service.id}/reviews`,
        { reviews: updatedReviews },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );


      await axios.delete(`${API_URL}/services/${service.id}/responses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: { name: currentUser },
      });

      setStatus("Открытый");
      setReviews(updatedReviews);
      setExecutor(null);
      setResponses(responses.filter((name) => name !== currentUser));

      setSuccess("Вы отказались от заказа. Статус изменен на 'Открытый'");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Ошибка при отмене заказа:", err);
      setError(err.response?.data?.detail || "Не удалось отменить заказ");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    checkAuth();
  }, []);


  useEffect(() => {
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/services");
      setServices(response.data);
      setFilteredServices(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!service) {
    return <div>Сервис не найден</div>;
  }

  const getStatusClass = (status) => {
    if (status === "Открытый") return "status-tag-open";
    if (status === "В разработке") return "status-tag-working";
    if (status === "Завершенный") return "status-tag-completed";
    return "status-tag";
  };

  return (
    <>
      <div className="full-services-main">
        <div className="full-services-container">
          <div className="left-column">
            <div className="full-services-info">
              <div className="header-mini-info">
                <h3>{service.service_title}</h3>
                <p className={getStatusClass(status)}>{status}</p>
              </div>

              <div className="mini-info-service">
                <p>Опубликовано: {new Date().toLocaleDateString()}</p>
                <p>•</p>
                <p>ID: {service.id || "Нет ID"}</p>
              </div>
              <div className="main-skills-full">
                {service.skills ? (
                  service.skills.split(",").map((skill, index) => (
                    <span className="skill-tag skill-tag-full" key={index}>
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span>Нет навыков</span>
                )}
              </div>
              <div className="price-duration">
                <div className="main-price-full">
                  <p className="price-full">{service.price} $</p>
                  <p>Бюджет</p>
                </div>
                <div className="main-duration-full">
                  <p className="price-full">{service.duration} дней</p>
                  <p>Срок</p>
                </div>
                <div className="main-category-full">
                  <p className="price-full">{service.category}</p>
                  <p>Категория</p>
                </div>
              </div>
            </div>

            <div className="full-services-description">
              <p className="description-title">Описание проекта</p>
              <p>{service.description}</p>
            </div>

            <div className="full-services-likes">

              <div>
                <h2>Исполнитель:</h2>

                {status === "Открытый" ? (
                  <div className="full-services-executor">
                    <div>
                      Пока что нет исполнителя
                    </div>
                  </div>
                ) : null}

                {status === "В разработке" || status === "Завершенный" ? (
                  <div className="full-services-executor">
                    
                    <div>
                      <p>Никнейм: {executor?.username || "?"}</p>
                      <p>Email: {executor?.email || "?"}</p>
                      <p>
                        Рейтинг:{""}
                        {executorRating > 0 ? executorRating.toFixed(1) : ""} ★
                        <p>Количество оценок: {executorReviewCount}</p>

                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {isAuthenticated &&
                status === "Завершенный" &&
                userData?.id === service.user_id &&
                !hasRated && (
                  <div className="rating-section">
                    <p className="rating-label">Оцените исполнителя:</p>
                    <div className="rating-stars">
                      <fieldset className="rating">
                        {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map(
                          (value) => {
                            const isHalf = value % 1 !== 0;
                            const id = `star${value
                              .toString()
                              .replace(".", "")}`;

                            return (
                              <React.Fragment key={value}>
                                <input
                                  type="radio"
                                  id={id}
                                  name="rating"
                                  value={value}
                                  checked={rating === value}
                                  onChange={() => setRating(value)}
                                />
                                <label
                                  className={isHalf ? "half" : "full"}
                                  htmlFor={id}
                                  title={`${value} звезд${
                                    value === 1 ? "а" : "ы"
                                  }`}
                                ></label>
                              </React.Fragment>
                            );
                          }
                        )}
                      </fieldset>
                    </div>
                    <button
                      className="save-btn"
                      onClick={handleSubmitRating}
                      disabled={rating === 0}
                    >
                      Отправить оценку
                    </button>
                  </div>
                )}
            </div>
          </div>

          <div className="right-column">
            <div className="full-services-customer">
              <h2>Заказчик</h2>
              <div>
                <img
                  src={customerAvatar || "./img/user.webp"}
                  alt="аватар заказчика"
                  className="logo-customer"
                  onError={(e) => {
                    console.error("Ошибка загрузки аватарки:", customerAvatar);
                    e.target.src = "./img/user.webp";
                    setCustomerAvatar(null);
                  }}
                />
                <p>Никнейм: {customer?.username || "?"}</p>
                <p>Email: {customer?.email || "?"}</p>
                <p>
                  Рейтинг:{" "}
                  {customerRating > 0 ? customerRating.toFixed(1) : ""}★ 
                  <p>Количество оценок: {executorReviewCount}</p>
                </p>
              </div>
            </div>

            <div className="full-services-actions">
              <p>Действия</p>

              {isAuthenticated ? (
                status === "В разработке" ? (
                  <>
                    <button
                      disabled={loading}
                      onClick={handleComplete}
                      className="action-btn"
                    >
                      {loading ? "Загрузка..." : "Завершить заказ"}
                    </button>
                    <button
                      disabled={loading}
                      onClick={handleCancel}
                      className="action-btn"
                    >
                      {loading ? "Загрузка..." : "Отказаться от заказа"}
                    </button>
                  </>
                ) : (
                  <button
                    disabled={loading || status === "Завершенный"}
                    onClick={handleRespond}
                    className={
                      status === "Завершенный"
                        ? "action-btn-disabled"
                        : "action-btn"
                    }
                  >
                    {loading
                      ? "Загрузка..."
                      : status === "Завершенный"
                      ? "Заказ завершен"
                      : "Откликнуться на заказ"}
                  </button>
                )
              ) : (
                <button disabled className="action-btn-disabled">
                  Откликнуться на заказ
                </button>
              )}

              <button onClick={copyToClipboard} className="action-btn">
                {copied ? "Ссылка скопирована!" : "Поделиться"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Full_Services;
