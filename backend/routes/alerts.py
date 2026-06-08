from fastapi import APIRouter
from backend.services.alerter import check_portfolio_alerts, is_market_open

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/check")
def check_alerts():
    """
    Manually trigger an alert check on your portfolio.
    Normally runs automatically every 5 minutes during market hours.

    Example: GET /alerts/check
    """
    results = check_portfolio_alerts()
    return results


@router.get("/market-status")
def market_status():
    """
    Check if Indian stock market is currently open.
    """
    open_status = is_market_open()
    now = __import__('datetime').datetime.now()

    return {
        "market_open": open_status,
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "market_hours": "9:15 AM to 3:30 PM IST, Monday to Friday",
        "status": "🟢 Market is OPEN" if open_status else "🔴 Market is CLOSED"
    }