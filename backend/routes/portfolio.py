from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.models.portfolio import Portfolio, SIP
from backend.services.data_fetcher import fetch_stock_quote

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"]
)


# ── Pydantic Schemas ──────────────────────────────────
# These define what data the API accepts and validates
# Think of them as forms — with required and optional fields

class AddHolding(BaseModel):
    symbol: str
    quantity: float
    buy_price: float
    buy_date: Optional[str] = None
    holding_type: Optional[str] = "stock"
    notes: Optional[str] = None


class AddSIP(BaseModel):
    fund_name: str
    monthly_amount: float
    start_date: Optional[str] = None
    sip_date: Optional[int] = 1
    notes: Optional[str] = None


# ── ADD HOLDING ───────────────────────────────────────
@router.post("/add")
def add_holding(holding: AddHolding, db: Session = Depends(get_db)):
    """
    Add a new stock or ETF to your portfolio.

    Example body:
    {
        "symbol": "TCS",
        "quantity": 10,
        "buy_price": 3200,
        "buy_date": "2025-01-12",
        "holding_type": "stock"
    }
    """
    # Fetch company name from yfinance
    quote = fetch_stock_quote(holding.symbol)
    company_name = quote["company_name"] if quote else holding.symbol.upper()

    # Create new portfolio record
    new_holding = Portfolio(
        symbol=holding.symbol.upper(),
        company_name=company_name,
        quantity=holding.quantity,
        buy_price=holding.buy_price,
        invested_amount=round(holding.quantity * holding.buy_price, 2),
        buy_date=holding.buy_date,
        holding_type=holding.holding_type,
        notes=holding.notes
    )

    # Save to database
    db.add(new_holding)
    db.commit()
    db.refresh(new_holding)

    return {
        "message": f"{holding.symbol.upper()} added to portfolio successfully",
        "holding": {
            "id": new_holding.id,
            "symbol": new_holding.symbol,
            "company_name": new_holding.company_name,
            "quantity": new_holding.quantity,
            "buy_price": new_holding.buy_price,
            "invested_amount": new_holding.invested_amount,
            "buy_date": new_holding.buy_date,
            "holding_type": new_holding.holding_type
        }
    }


# ── GET PORTFOLIO ─────────────────────────────────────
@router.get("/")
def get_portfolio(db: Session = Depends(get_db)):
    """
    Get your complete portfolio with current prices and P&L.
    Shows total invested, current value, and profit/loss.
    """
    # Get all holdings from database
    holdings = db.query(Portfolio).all()
    sips = db.query(SIP).all()

    if not holdings and not sips:
        return {
            "message": "Portfolio is empty. Add your first holding!",
            "total_invested": 0,
            "current_value": 0,
            "total_pnl": 0,
            "total_pnl_percent": 0,
            "holdings": [],
            "sips": []
        }

    # Calculate current value and P&L for each holding
    portfolio_items = []
    total_invested = 0
    current_value = 0

    for holding in holdings:
        # Fetch current price
        quote = fetch_stock_quote(holding.symbol)
        current_price = quote["current_price"] if quote else holding.buy_price

        # Calculate P&L
        invested = holding.invested_amount
        current = round(current_price * holding.quantity, 2)
        pnl = round(current - invested, 2)
        pnl_percent = round((pnl / invested) * 100, 2)

        total_invested += invested
        current_value += current

        portfolio_items.append({
            "id": holding.id,
            "symbol": holding.symbol,
            "company_name": holding.company_name,
            "holding_type": holding.holding_type,
            "quantity": holding.quantity,
            "buy_price": holding.buy_price,
            "current_price": current_price,
            "invested_amount": invested,
            "current_value": current,
            "pnl": pnl,
            "pnl_percent": pnl_percent,
            "buy_date": holding.buy_date,
            "notes": holding.notes
        })

    # Portfolio level totals
    total_pnl = round(current_value - total_invested, 2)
    total_pnl_percent = round((total_pnl / total_invested) * 100, 2) if total_invested > 0 else 0

    # SIP summary
    sip_items = []
    total_sip_monthly = 0
    for sip in sips:
        sip_items.append({
            "id": sip.id,
            "fund_name": sip.fund_name,
            "monthly_amount": sip.monthly_amount,
            "start_date": sip.start_date,
            "sip_date": sip.sip_date,
            "notes": sip.notes
        })
        total_sip_monthly += sip.monthly_amount

    return {
        "summary": {
            "total_invested": round(total_invested, 2),
            "current_value": round(current_value, 2),
            "total_pnl": total_pnl,
            "total_pnl_percent": total_pnl_percent,
            "total_holdings": len(holdings),
            "total_sip_monthly": total_sip_monthly
        },
        "holdings": portfolio_items,
        "sips": sip_items
    }


# ── DELETE HOLDING ────────────────────────────────────
@router.delete("/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    """
    Remove a holding from portfolio by its ID.
    Example: DELETE /portfolio/1
    """
    holding = db.query(Portfolio).filter(Portfolio.id == holding_id).first()

    if not holding:
        raise HTTPException(
            status_code=404,
            detail=f"Holding with id {holding_id} not found"
        )

    db.delete(holding)
    db.commit()

    return {
        "message": f"{holding.symbol} removed from portfolio successfully"
    }


# ── ADD SIP ───────────────────────────────────────────
@router.post("/sip/add")
def add_sip(sip: AddSIP, db: Session = Depends(get_db)):
    """
    Add a new SIP to track.

    Example body:
    {
        "fund_name": "Mirae Asset Large Cap Fund",
        "monthly_amount": 500,
        "start_date": "2025-01-01",
        "sip_date": 1
    }
    """
    new_sip = SIP(
        fund_name=sip.fund_name,
        monthly_amount=sip.monthly_amount,
        start_date=sip.start_date,
        sip_date=sip.sip_date,
        notes=sip.notes
    )

    db.add(new_sip)
    db.commit()
    db.refresh(new_sip)

    return {
        "message": f"SIP for {sip.fund_name} added successfully",
        "sip": {
            "id": new_sip.id,
            "fund_name": new_sip.fund_name,
            "monthly_amount": new_sip.monthly_amount,
            "start_date": new_sip.start_date,
            "sip_date": new_sip.sip_date
        }
    }


# ── DELETE SIP ────────────────────────────────────────
@router.delete("/sip/{sip_id}")
def delete_sip(sip_id: int, db: Session = Depends(get_db)):
    """
    Remove a SIP by its ID.
    Example: DELETE /portfolio/sip/1
    """
    sip = db.query(SIP).filter(SIP.id == sip_id).first()

    if not sip:
        raise HTTPException(
            status_code=404,
            detail=f"SIP with id {sip_id} not found"
        )

    db.delete(sip)
    db.commit()

    return {
        "message": f"{sip.fund_name} SIP removed successfully"
    }