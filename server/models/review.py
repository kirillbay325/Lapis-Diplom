
from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)   
    rating = Column(Float, nullable=False)  
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    service = relationship("Service", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    worker = relationship("User", foreign_keys=[worker_id])