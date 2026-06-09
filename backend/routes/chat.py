from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.models.portfolio import Portfolio
from backend.services.ai_agent import (
    chat_with_portfolio,
    generate_daily_briefing,
    analyse_stock_with_ai,
    build_portfolio_context
)
from backend.services.data_fetcher import fetch_stock_quote
from backend.services.indicators import fetch_technical_indicators
from backend.services.fundamentals import fetch_fundamental_data
from backend.services.news_fetcher import fetch_stock_news
from backend.services.recommender import generate_recommendation
from backend.services.alerter import check_portfolio_alerts
from backend.services.news_fetcher import fetch_portfolio_news

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat & Analysis"]
)


# ── Pydantic Models ───────────────────────────────────
class ChatMessage(BaseModel):
    message    : str
    father_mode: Optional[bool] = False
    history    : Optional[List[dict]] = []


# ── Portfolio Context Helper ──────────────────────────
def get_portfolio_data(db: Session) -> dict:
    """Gets portfolio data for AI context."""
    holdings = db.query(Portfolio).all()

    if not holdings:
        return {"holdings": [], "summary": {}}

    portfolio_items = []
    total_invested  = 0
    current_value   = 0

    for holding in holdings:
        quote         = fetch_stock_quote(holding.symbol)
        current_price = quote["current_price"] if quote else holding.buy_price
        invested      = holding.invested_amount
        current       = round(current_price * holding.quantity, 2)
        pnl           = round(current - invested, 2)
        pnl_percent   = round((pnl / invested) * 100, 2)

        total_invested += invested
        current_value  += current

        portfolio_items.append({
            "symbol"       : holding.symbol,
            "company_name" : holding.company_name,
            "quantity"     : holding.quantity,
            "buy_price"    : holding.buy_price,
            "current_price": current_price,
            "pnl"          : pnl,
            "pnl_percent"  : pnl_percent
        })

    total_pnl         = round(current_value - total_invested, 2)
    total_pnl_percent = round((total_pnl / total_invested) * 100, 2) if total_invested > 0 else 0

    return {
        "holdings": portfolio_items,
        "summary" : {
            "total_invested"  : round(total_invested, 2),
            "current_value"   : round(current_value, 2),
            "total_pnl"       : total_pnl,
            "total_pnl_percent": total_pnl_percent
        }
    }


# ── Chat Endpoint ─────────────────────────────────────
@router.post("/message")
def send_message(
    chat: ChatMessage,
    db: Session = Depends(get_db)
):
    """
    Chat with StockSage AI about your portfolio.
    AI knows your exact holdings and gives personalized advice.

    Example body:
    {
        "message": "Should I hold JIOFIN or cut my losses?",
        "father_mode": false,
        "history": []
    }
    """
    # Get portfolio context
    portfolio_data    = get_portfolio_data(db)
    portfolio_context = build_portfolio_context(portfolio_data)

    # Get AI response
    result = chat_with_portfolio(
        user_question     = chat.message,
        portfolio_context = portfolio_context,
        chat_history      = chat.history,
        father_mode       = chat.father_mode
    )

    return result


# ── Daily Briefing ────────────────────────────────────
@router.get("/briefing")
def get_daily_briefing(
    father_mode: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get personalized daily morning briefing.
    Combines portfolio + news + alerts into one summary.

    Example: GET /chat/briefing
    Example: GET /chat/briefing?father_mode=true
    """
    # Get all data needed for briefing
    portfolio_data = get_portfolio_data(db)

    # Get portfolio symbols
    symbols = [h["symbol"] for h in portfolio_data["holdings"]]

    # Get news for portfolio
    news_data = fetch_portfolio_news(symbols) if symbols else {}

    # Get current alerts
    alerts_data = check_portfolio_alerts()

    # Generate briefing
    result = generate_daily_briefing(
        portfolio_data = portfolio_data,
        news_data      = news_data,
        alerts_data    = alerts_data,
        father_mode    = father_mode
    )

    return result


# ── Stock Deep Analysis ───────────────────────────────
@router.get("/analyse/{symbol}")
def deep_analyse_stock(symbol: str):
    """
    Get comprehensive AI analysis of any stock.
    Combines technical + fundamental + news + AI reasoning.

    Example: GET /chat/analyse/TATASTEEL
    Example: GET /chat/analyse/JIOFIN
    """
    # Fetch all data
    indicators     = fetch_technical_indicators(symbol)
    fundamentals   = fetch_fundamental_data(symbol)
    news           = fetch_stock_news(symbol)
    recommendation = generate_recommendation(symbol)

    if not indicators or not fundamentals:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for {symbol}"
        )

    result = analyse_stock_with_ai(
        symbol         = symbol,
        indicators     = indicators,
        fundamentals   = fundamentals,
        news           = news,
        recommendation = recommendation
    )

    return result


# ── Quick Question ────────────────────────────────────
@router.get("/ask")
def quick_ask(
    question    : str,
    father_mode : bool = False,
    db          : Session = Depends(get_db)
):
    """
    Quick question without chat history.
    Perfect for simple one-off questions.

    Example: GET /chat/ask?question=Should I buy more TCS today?
    Example: GET /chat/ask?question=Market kaise hai aaj?&father_mode=true
    """
    portfolio_data    = get_portfolio_data(db)
    portfolio_context = build_portfolio_context(portfolio_data)

    result = chat_with_portfolio(
        user_question     = question,
        portfolio_context = portfolio_context,
        father_mode       = father_mode
    )

    return result