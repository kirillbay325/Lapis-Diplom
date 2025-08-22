
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from database import Base
from sqlalchemy.orm import relationship

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    freelancer_name = Column(String(100), nullable=False)
    service_title = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    image_path = Column(String(255))
    duration = Column(Integer)
    skills = Column(String(255))
    freelancer_id = Column(Integer, ForeignKey("users.id"))
    reviews = Column(Integer, default=0)
    status = Column(String(50), default="Открытый", nullable=False)
    responses = Column(Text)
    category = Column(String(50))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="services", foreign_keys=[user_id])
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    reviews = relationship("Review", back_populates="service")

    
    