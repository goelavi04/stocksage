from fastapi import APIRouter, HTTPException
from backend.services.data_fetcher import fetch_stock_quote, fetch_stock_history
from backend.services.indicators import fetch_technical_indicators
from backend.services.fundamentals import fetch_fundamental_data
from backend.services.recommender import generate_recommendation

router = APIRouter(
    prefix="/stock",
    tags=["Stock Data"]
)


@router.get("/{symbol}")
def get_stock_quote(symbol: str):
    """
    Get real-time stock quote for any NSE listed stock.
    Example: GET /stock/TCS
    """
    data = fetch_stock_quote(symbol)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for symbol '{symbol}'."
        )
    return data


@router.get("/{symbol}/history")
def get_stock_history(symbol: str, period: str = "1y"):
    """
    Get historical OHLCV data for any NSE stock.
    Example: GET /stock/TCS/history?period=1y
    """
    data = fetch_stock_history(symbol, period)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch history for '{symbol}'."
        )
    return data


@router.get("/{symbol}/indicators")
def get_technical_indicators(symbol: str):
    """
    Get technical indicators for any NSE stock.
    RSI, Moving Averages, Bollinger Bands, MACD.
    Example: GET /stock/TCS/indicators
    """
    data = fetch_technical_indicators(symbol)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not calculate indicators for '{symbol}'."
        )
    return data


@router.get("/{symbol}/fundamentals")
def get_fundamentals(symbol: str):
    """
    Get fundamental financial data for any NSE stock.
    Example: GET /stock/TCS/fundamentals
    """
    data = fetch_fundamental_data(symbol)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch fundamentals for '{symbol}'."
        )
    return data


@router.get("/{symbol}/recommend")
def get_recommendation(symbol: str):
    """
    Get Buy/Hold/Sell recommendation for any NSE stock.
    Combines technical + fundamental + ML signals.
    Example: GET /stock/TCS/recommend
    """
    data = generate_recommendation(symbol)
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not generate recommendation for '{symbol}'."
        )
    return data