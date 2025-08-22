from sqlalchemy import create_engine, Column, Integer, String, Float, Text, func, Date, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from database import Base


class Worker(Base):
    __tablename__ = "work"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    surname = Column(String(40))
    email = Column(String(50), unique=True, index=True)
    description = Column(Text)
    number = Column(String(20))
    country = Column(String(50))
    city = Column(String(30))
    data = Column(Date, server_default=func.current_date())
    image_path = Column(String(255))