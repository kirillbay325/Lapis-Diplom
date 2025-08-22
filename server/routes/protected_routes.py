from fastapi import APIRouter, Depends
from models.user import User
from core.security import get_current_user

router = APIRouter()

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "message": "Это защищённый эндпоинт, доступный только авторизованным пользователям"
    }
