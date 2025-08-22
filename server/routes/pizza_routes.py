
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body, Depends
from database import SessionLocal
from sqlalchemy.orm import Session
from models.service import Service
from models.user import User
from models.balance import Balance
from models.earnings import Earnings
from models.review import Review
from models.transaction import Transaction
from core.security import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/services")
def get_services():
    db: Session = SessionLocal()
    services = db.query(Service).all()
    db.close()
    return services

@router.post("/services")
async def add_service(
    freelancer_name: str = Form(...),
    service_title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    duration: int = Form(...),
    skills: str = Form(...),
    image: UploadFile = File(...),
    category: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    
    
    image_path = f"pizza_images/{image.filename}"
    with open(image_path, "wb") as f:
        f.write(await image.read())

    db: Session = SessionLocal()
    service = Service(
        freelancer_name=freelancer_name,
        service_title=service_title,
        description=description,
        price=price,
        duration=duration,
        skills=skills,
        image_path=image_path,
        category = category,
        user_id=current_user.id

    )
    db.add(service)
    db.commit()
    db.refresh(service)
    db.close()

    return {"message": "Услуга добавлена!", "service": service}

@router.patch("/services/{service_id}/status")
def update_service_status(service_id: int, status_data: dict = Body(...)):
    db = SessionLocal()
    try:
        service = db.query(Service).filter(Service.id == service_id).first()

        if not service:
            raise HTTPException(status_code=404, detail="Услуга не найдена")

        new_status = status_data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Поле 'status' обязательно")

        service.status = new_status
        db.commit()
        db.refresh(service)
        return {"message": "Статус обновлён", "status": service.status}
    finally:
        db.close()

@router.patch("/services/{service_id}/reviews")
def update_service_reviews(service_id: int, data: dict = Body(...)):
    db = SessionLocal()
    try:
        service = db.query(Service).filter(Service.id == service_id).first()

        if not service:
            raise HTTPException(status_code=404, detail="Услуга не найдена")

        new_reviews = data.get("reviews")
        if new_reviews is None:
            raise HTTPException(status_code=400, detail="Поле 'reviews' обязательно")

        service.reviews = new_reviews
        db.commit()
        db.refresh(service)
        return {"message": "Количество отзывов обновлено", "reviews": service.reviews}
    finally:
        db.close()

@router.post("/services/{service_id}/responses")
def add_service_response(service_id: int, data: dict = Body(...)):
    db = SessionLocal()
    try:
        service = db.query(Service).filter(Service.id == service_id).first()

        if not service:
            raise HTTPException(status_code=404, detail="Услуга не найдена")

        responder_name = data.get("name")
        if not responder_name:
            raise HTTPException(status_code=400, detail="Имя откликнувшегося обязательно")

        existing_names = []
        if service.responses:
            existing_names = [name.strip() for name in service.responses.split(",")]

        if responder_name in existing_names:
            raise HTTPException(
                status_code=400,
                detail="Вы уже откликнулись на эту услугу"
            )

        if service.responses:
            service.responses = service.responses + "," + responder_name
        else:
            service.responses = responder_name

        db.commit()
        db.refresh(service)
        return {"message": "Отклик успешно добавлен", "name": responder_name}
    finally:
        db.close()

@router.get("/services/categories")
def get_all_categories():
    db = SessionLocal()
    try:
        result = db.query(Service.category).all()
        categories = [row.category for row in result if row.category]
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")
    finally:
        db.close()

@router.get("/my-services")
def get_my_services(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    services = db.query(Service).filter(Service.user_id == current_user.id).all()
    return services

@router.patch("/services/{service_id}/complete")
def complete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    if service.status != "В разработке":
        raise HTTPException(status_code=400, detail="Заказ не в статусе 'В разработке'")

    if service.freelancer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете завершить этот заказ")

    amount = service.price

    balance = db.query(Balance).filter(Balance.user_id == current_user.id).first()
    if not balance:
        balance = Balance(user_id=current_user.id, amount=0.0)
        db.add(balance)

 
    earnings = db.query(Earnings).filter(Earnings.user_id == current_user.id).first()
    if not earnings:
        earnings = Earnings(user_id=current_user.id, total_earned=0.0)
        db.add(earnings)


    balance.amount += amount
    earnings.total_earned += amount


    service.status = "Завершенный"

    db.commit()

    return {"message": f"Заказ завершён. Вам начислено {amount}$", "balance": balance.amount}

@router.post("/withdraw")
def withdraw(
    amount: float = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    balance = db.query(Balance).filter(Balance.user_id == current_user.id).first()
    if not balance or balance.amount < amount:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    transaction = Transaction(
        user_id=current_user.id,
        amount=amount,
        status="Обработан"
    )
    db.add(transaction)


    balance.amount -= amount

    db.commit()
    db.refresh(transaction)

    return {"message": "Запрос на вывод отправлен", "transaction": transaction}
 
@router.get("/finances")
def get_finances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    balance = db.query(Balance).filter(Balance.user_id == current_user.id).first()
    earnings = db.query(Earnings).filter(Earnings.user_id == current_user.id).first()
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc()).all()

    return {
        "balance": balance.amount if balance else 0.0,
        "total_earned": earnings.total_earned if earnings else 0.0,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "status": t.status,
                "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for t in transactions
        ]
    }
@router.post("/services/{service_id}/respond")
def respond_to_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"🎯 Начало обработки отклика на заказ {service_id}")
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    if service.status != "Открытый":
        raise HTTPException(status_code=400, detail="Заказ уже в работе или завершён")


    service.freelancer_id = current_user.id
    service.status = "В разработке"



    db.commit()
    db.refresh(service)

    return {
        "message": "Вы откликнулись на заказ",
        "status": service.status,
        "freelancer_id": service.freelancer_id
    }

@router.get("/services/{service_id}")
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Сервис не найден")

    owner = db.query(User).filter(User.id == service.user_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Заказчик не найден")

    return {
        "id": service.id,
        "service_title": service.service_title,
        "description": service.description,
        "price": service.price,
        "duration": service.duration,
        "skills": service.skills,
        "image_path": service.image_path,
        "reviews": service.reviews,
        "status": service.status,
        "category": service.category,
        "responses": service.responses,
        "freelancer_name": service.freelancer_name,
        "user_id": service.user_id,
        "customer": {
            "name": owner.username,
            "email": owner.email
        }
    }
@router.get("/my-completed-services")
def get_my_completed_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    services = db.query(Service).filter(
        Service.freelancer_id == current_user.id,
        Service.status == "Завершенный"
    ).all()

    result = []
    for service in services:

        customer = db.query(User).filter(User.id == service.user_id).first()
        customer_name = customer.username if customer else "Неизвестно"

  
        price = float(service.price) if service.price is not None else 0.0
        duration = service.duration if service.duration is not None else 0

        result.append({
            "id": service.id,
            "service_title": service.service_title,
            "description": service.description,
            "price": price,
            "duration": duration,
            "category": service.category,
            "status": service.status,
            "image_path": service.image_path,
            "freelancer_name": service.freelancer_name,
            "customer_name": customer_name, 
            "customer_id": service.user_id  
        })

    return result

@router.post("/services/{service_id}/rate")
def rate_worker(
    service_id: int,
    rating: float = Body(..., embed=True, ge=0.5, le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Оценить исполнителя после завершения заказа
    """

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if service.status != "Завершенный":
        raise HTTPException(status_code=400, detail="Заказ ещё не завершён")


    if service.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Только заказчик может оценить")


    if not service.freelancer_id:
        raise HTTPException(status_code=400, detail="У заказа нет исполнителя")


    existing_review = db.query(Review).filter(
        Review.service_id == service_id,
        Review.reviewer_id == current_user.id
    ).first()

    if existing_review:
        raise HTTPException(status_code=400, detail="Вы уже оценили этот заказ")


    review = Review(
        service_id=service_id,
        reviewer_id=current_user.id,
        worker_id=service.freelancer_id,
        rating=rating
    )
    db.add(review)
    db.commit()

    return {"message": "Оценка успешно добавлена"}
    
@router.get("/services/{service_id}/has-rated")
def has_user_rated(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    review = db.query(Review).filter(
        Review.service_id == service_id,
        Review.reviewer_id == current_user.id
    ).first()
    return {"has_rated": review is not None}

@router.post("/services/{service_id}/rate")
def rate_user(
    service_id: int,
    rating: float = Body(..., ge=0.5, le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if service.status != "Завершенный":
        raise HTTPException(status_code=400, detail="Заказ ещё не завершён")


    if service.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Оценивать может только заказчик")

    if not service.freelancer_id:
        raise HTTPException(status_code=400, detail="У заказа нет исполнителя")

    existing_review = db.query(Review).filter(
        Review.service_id == service_id,
        Review.reviewer_id == current_user.id
    ).first()

    if existing_review:
        raise HTTPException(status_code=400, detail="Вы уже оценили этот заказ")


    review = Review(
        rating=rating,
        reviewer_id=current_user.id,
        worker_id=service.freelancer_id,
        service_id=service_id
    )
    db.add(review)
    db.commit()

    return {"message": "Оценка успешно добавлена"}

@router.get("/users/{user_id}/rating")
def get_user_rating(user_id: int, db: Session = Depends(get_db)):
    """
    Получить средний рейтинг пользователя
    """
    reviews = db.query(Review).filter(Review.worker_id == user_id).all()
    
    if not reviews:
        return {"rating": 0.0, "count": 0}

    total = sum(r.rating for r in reviews)
    avg = total / len(reviews)

    return {"rating": round(avg, 1), "count": len(reviews)}


    