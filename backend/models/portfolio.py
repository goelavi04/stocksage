from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from backend.database import Base
import enum


# ── Holding Type Enum ─────────────────────────────────
class HoldingType(str, enum.Enum):
    STOCK = "stock"
    SIP   = "sip"
    ETF   = "etf"


# ── Portfolio Table ───────────────────────────────────
class Portfolio(Base):
    __tablename__ = "portfolio"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    user_id          = Column(Integer, default=1)
    symbol           = Column(String, nullable=False)
    company_name     = Column(String, nullable=True)
    holding_type     = Column(String, default="stock")
    quantity         = Column(Float, nullable=False)
    buy_price        = Column(Float, nullable=False)
    invested_amount  = Column(Float, nullable=False)
    buy_date         = Column(String, nullable=True)
    notes            = Column(String, nullable=True)
    created_at       = Column(DateTime, server_default=func.now())


# ── SIP Table ─────────────────────────────────────────
class SIP(Base):
    __tablename__ = "sips"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    user_id         = Column(Integer, default=1)
    fund_name       = Column(String, nullable=False)
    monthly_amount  = Column(Float, nullable=False)
    start_date      = Column(String, nullable=True)
    sip_date        = Column(Integer, default=1)
    notes           = Column(String, nullable=True)
    created_at      = Column(DateTime, server_default=func.now())


# ── Notification Table ────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    symbol           = Column(String, nullable=True)
    alert_type       = Column(String, nullable=False)
    severity         = Column(String, nullable=False)
    message          = Column(String, nullable=False)
    message_hindi    = Column(String, nullable=True)
    message_english  = Column(String, nullable=True)
    action           = Column(String, nullable=True)
    is_read          = Column(Boolean, default=False)
    email_sent       = Column(Boolean, default=False)
    whatsapp_sent    = Column(Boolean, default=False)
    detail           = Column(String, nullable=True)
    created_at       = Column(DateTime, server_default=func.now())