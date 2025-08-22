from fastapi import APIRouter, HTTPException, Depends, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.user import User
from models.review import Review
from core.security import hash_password, verify_password, create_jwt_token
from database import SessionLocal
from fastapi.security import OAuth2PasswordBearer
from core.security import get_current_user
from models.worker import Worker



router = APIRouter()


class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str 
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    """Регистрация + автоматический вход (возвращает токен)"""
    try:
        existing_user = db.query(User).filter(
            or_(User.username == user.username, User.email == user.email)
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Пользователь с таким логином или email уже существует"
            )


        hashed_password = hash_password(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_jwt_token(new_user.id)

        return {
            "token": token,
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            },
            "message": "Пользователь успешно зарегистрирован и вошёл в аккаунт"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка регистрации: {str(e)}")

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Вход пользователя"""
    try:
        db_user = db.query(User).filter(
            or_(User.username == user.username, User.email == user.username)
        ).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

 
        if not verify_password(user.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        token = create_jwt_token(db_user.id)
        
        return {
            "token": token,
            "user": {
                "id": db_user.id,
                "username": db_user.username,
                "email": db_user.email
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка входа: {str(e)}"
        )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    try:
        db_user = db.query(User).filter(User.id == user_id).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        db.delete(db_user)
        db.commit()
        
        return {"message": "Пользователь успешно удален"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка удаления пользователя: {str(e)}"
        )

@router.post("/change-password")
def change_password(
    current_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    confirm_password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Смена пароля пользователя
    """
   
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

  
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Неверный текущий пароль"
        )

 
    if new_password != confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Новый пароль и подтверждение не совпадают"
        )

 
    user.password_hash = hash_password(new_password)

    try:
        db.commit()
        db.refresh(user) 
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при сохранении пароля: {str(e)}"
        )

    return {"message": "Пароль успешно изменён"}

@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Находим анкету фрилансера (Worker)
    worker = db.query(Worker).filter(Worker.user_id == user.id).first()

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "image_path": worker.image_path if worker else None
    }

@router.get("/users/{user_id}/avatar")
def get_customer_avatar(user_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.user_id == user_id).first()
    if not worker:
        return {"image_path": None}
    
    return {"image_path": worker.image_path}
@router.get("/users/{user_id}/rating")
def get_user_rating(user_id: int, db: Session = Depends(get_db)):
    """
    Получить средний рейтинг пользователя (исполнителя)
    """
    reviews = db.query(Review).filter(Review.worker_id == user_id).all()
    
    if not reviews:
        return {"rating": 0.0, "count": 0}

    total_rating = sum(r.rating for r in reviews)
    avg_rating = total_rating / len(reviews)

    return {"rating": round(avg_rating, 1), "count": len(reviews)}

@router.get("/users/{user_id}/rating")
def get_user_rating(user_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.worker_id == user_id).all()
    
    if not reviews:
        return {"rating": 0.0, "count": 0}

    total = sum(r.rating for r in reviews)
    avg = total / len(reviews)

    return {"rating": round(float(avg), 1), "count": len(reviews)}