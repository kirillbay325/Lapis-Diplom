import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User
from core.security import get_current_user 
from models.worker import Worker

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


os.makedirs("user_images", exist_ok=True)

@router.post("/worker")
async def create_worker(
    name: str = Form(None),
    email: str = Form(None),
    surname: str = Form(None),
    number: str = Form(None),
    country: str = Form(None),
    city: str = Form(None),
    description: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):




    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()


    image_path = worker.image_path if worker else None
    

    if image:
        file_extension = image.filename.split(".")[-1]
        new_filename = f"user_{current_user.id}.{file_extension}"
        image_path = f"user_images/{new_filename}"
        print(f"📷 Начинаю сохранение файла: {image.filename} → {image_path}")

        os.makedirs("user_images", exist_ok=True)

        try:
            with open(image_path, "wb") as f:
                content = await image.read()
                print(f"📝 Прочитано байт: {len(content)}") 
                f.write(content)
            print(f"✅ Файл успешно сохранён на диск: {image_path}")
        except Exception as e:
            print(f"❌ Ошибка при сохранении файла: {str(e)}")
            raise HTTPException(status_code=500, detail="Не удалось сохранить изображение")


    if worker:
        print("🔄 Обновляем существующего worker")
        if name is not None:
            worker.name = name
        if email is not None:
            worker.email = email
        if surname is not None:
            worker.surname = surname
        if number is not None:
            worker.number = number
        if country is not None:
            worker.country = country
        if city is not None:
            worker.city = city
        if description is not None:
            worker.description = description
        if image_path is not None:
            worker.image_path = image_path
    else:
        print("🆕 Создаём нового worker")

        worker = Worker(
            user_id=current_user.id,
            name=name,
            email=email,
            surname=surname,
            number=number,
            country=country,
            city=city,
            description=description,
            image_path=image_path
        )
        db.add(worker)

    try:
        db.commit()
        db.refresh(worker)
        print("✅ Данные сохранены в БД")
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при сохранении в БД: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Ошибка при сохранении в БД: {str(e)}")


    return {
        "message": "Анкета фрилансера успешно обновлена",
        "user": {
            "id": worker.id,
            "name": worker.name,
            "surname": worker.surname,
            "email": worker.email,
            "number": worker.number,
            "country": worker.country,
            "city": worker.city,
            "description": worker.description,
            "data": worker.data.strftime("%Y-%m-%d") if worker.data else None,
            "image_path": worker.image_path
        }
    }


@router.delete("/pizzas/{pizza_id}")
def delete_pizza(pizza_id: int):

    db = SessionLocal()

    pizza = db.query(Worker).filter(Worker.id == pizza_id).first()
    if not pizza:
        raise HTTPException(status_code=404, detail="Пицца не найдена")
    

    db.delete(pizza)
    db.commit()
  

    db.close()
    
    return {"message": "Пицца удалена!"}

@router.get("/worker/me")
def get_current_worker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):


    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()


    return {
        "message": "Данные пользователя",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "name": worker.name if worker else None,
            "surname": worker.surname if worker else None,
            "number": worker.number if worker else None,
            "country": worker.country if worker else None,
            "city": worker.city if worker else None,
            "description": worker.description if worker else None,
            "data": worker.data.strftime("%Y-%m-%d") if worker and worker.data else None,
            "image_path": worker.image_path if worker else None
        }
    }