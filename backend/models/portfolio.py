from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from backend.database import Base
import enum


# ── Holding Type Enum ─────────────────────────────────
# Enum = a fixed set of allowed values
# Like a dropdown — only these options are valid
class HoldingType(str, enum.Enum):
    STOCK = "stock"
    SIP   = "sip"
    ETF   = "etf"


# ── Portfolio Table ───────────────────────────────────
# This class = one table in the database
# Each attribute = one column in that table
class Portfolio(Base):
    __tablename__ = "portfolio"

    # Primary key — unique ID for each holding
    # autoincrement means database assigns 1, 2, 3... automatically
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Stock symbol — e.g. "TCS", "RELIANCE"
    symbol = Column(String, nullable=False)

    # Company name — e.g. "Tata Consultancy Services"
    company_name = Column(String, nullable=True)

    # Type of holding
    holding_type = Column(String, default="stock")

    # Number of shares owned
    quantity = Column(Float, nullable=False)

    # Price at which you bought
    buy_price = Column(Float, nullable=False)

    # Total amount invested = quantity × buy_price
    invested_amount = Column(Float, nullable=False)

    # Date you bought (stored as string for simplicity)
    buy_date = Column(String, nullable=True)

    # Notes — optional personal notes about this holding
    notes = Column(String, nullable=True)

    # Automatically set when record is created
    created_at = Column(DateTime, server_default=func.now())


# ── SIP Table ─────────────────────────────────────────
class SIP(Base):
    __tablename__ = "sips"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Fund name — e.g. "Mirae Asset Large Cap Fund"
    fund_name = Column(String, nullable=False)

    # Monthly investment amount
    monthly_amount = Column(Float, nullable=False)

    # Date SIP started
    start_date = Column(String, nullable=True)

    # Which day of month SIP deducts
    sip_date = Column(Integer, default=1)

    # Notes
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, server_default=func.now())