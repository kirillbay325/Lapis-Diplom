import bcrypt
import jwt
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.user import User
from database import SessionLocal



JWT_SECRET = "SECRET_KEY"  
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_SECONDS = 86400  



security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    """Хеширование пароля с использованием bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_jwt_token(user_id: int) -> str:
    """Создание JWT токена"""
    try:
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS),
            "iat": datetime.utcnow() 
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании токена: {str(e)}"
        )

def decode_jwt_token(token: str) -> int:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise ValueError("Invalid token: no user ID")
        return int(user_id)  
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Срок действия токена истек")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Неверный токен")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Ошибка при декодировании токена: {str(e)}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    print("🔐 Получен токен:", credentials.credentials)
    try:
        user_id = decode_jwt_token(credentials.credentials)
        print("✅ Раскодирован user_id:", user_id)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print("❌ Пользователь не найден")
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        print("👤 Пользователь найден:", user.username, user.id)
        return user
    except Exception as e:
        print("🔴 Ошибка аутентификации:", str(e))
        raise HTTPException(status_code=401, detail="Неверный токен")