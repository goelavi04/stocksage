from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String, nullable=False)
    photo      = Column(Text, nullable=True)      # base64 data URI
    color      = Column(String, default="#3b82f6")
    created_at = Column(DateTime, server_default=func.now())
