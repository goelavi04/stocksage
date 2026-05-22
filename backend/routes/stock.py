from fastapi import APIRouter, HTTPException
from backend.services.data_fetcher import fetch_stock_quote, fetch_stock_history

# APIRouter groups all stock related endpoints together
# All routes here are automatically prefixed with /stock
router = APIRouter(
    prefix="/stock",
    tags=["Stock Data"]
)


@router.get("/{symbol}")
def get_stock_quote(symbol: str):
    """
    Get real-time stock quote for any NSE listed stock.

    Example: GET /stock/TCS
    Example: GET /stock/RELIANCE
    Example: GET /stock/INFY
    """
    data = fetch_stock_quote(symbol)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for symbol '{symbol}'. Check if the symbol is correct and try again."
        )

    return data


@router.get("/{symbol}/history")
def get_stock_history(symbol: str, period: str = "1y"):
    """
    Get historical OHLCV data for any NSE stock.
    Used for charts and LSTM model training.

    Example: GET /stock/TCS/history
    Example: GET /stock/TCS/history?period=5y
    Example: GET /stock/RELIANCE/history?period=3mo
    """
    data = fetch_stock_history(symbol, period)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch history for '{symbol}'. Check the symbol and try again."
        )

    return data
from backend.services.indicators import fetch_technical_indicators

@router.get("/{symbol}/indicators")
def get_technical_indicators(symbol: str):
    """
    Get technical indicators for any NSE stock.
    RSI, Moving Averages, Bollinger Bands, MACD.

    Example: GET /stock/TCS/indicators
    Example: GET /stock/RELIANCE/indicators
    """
    data = fetch_technical_indicators(symbol)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not calculate indicators for '{symbol}'."
        )

    return data
from backend.services.fundamentals import fetch_fundamental_data

@router.get("/{symbol}/fundamentals")
def get_fundamentals(symbol: str):
    """
    Get fundamental financial data for any NSE stock.
    PE ratio, EPS, debt, ROE, margins and more.

    Example: GET /stock/TCS/fundamentals
    Example: GET /stock/HDFCBANK/fundamentals
    """
    data = fetch_fundamental_data(symbol)

    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch fundamentals for '{symbol}'."
        )

    return data