from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import sessionmaker, declarative_base



Base = declarative_base()

engine = create_engine("sqlite:///pizza.db")
SessionLocal = sessionmaker(bind=engine)