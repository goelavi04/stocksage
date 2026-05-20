from fastapi import APIRouter, HTTPException
from backend.services.data_fetcher import fetch_stock_quote

# APIRouter is like a mini FastAPI app
# We use it to group related endpoints together
# All routes in this file will be prefixed with /stock
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

    # Fetch data from NSE
    data = fetch_stock_quote(symbol)

    # If data is None, something went wrong — tell the client clearly
    if data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for symbol '{symbol}'. Check if the symbol is correct and try again."
        )

    return data