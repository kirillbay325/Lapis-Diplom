from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship     
from database import Base
from models.review import Review


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    services = relationship("Service", back_populates="user", foreign_keys="[Service.user_id]", cascade="all, delete-orphan")
    balance = relationship("Balance", back_populates="user", uselist=False, cascade="all, delete-orphan")
    earnings = relationship("Earnings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    reviews_as_worker = relationship("Review", foreign_keys=[Review.worker_id], back_populates="worker")
    reviews_as_reviewer = relationship("Review", foreign_keys=[Review.reviewer_id], back_populates="reviewer")  

    