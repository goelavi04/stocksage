from fastapi import APIRouter
from backend.services.sip_calculator import (
    calculate_sip,
    analyse_existing_sip
)
from backend.services.stock_recommender import (
    get_stock_recommendations,
    get_sip_recommendations,
    get_etf_recommendations,
    get_complete_recommendation
)

router = APIRouter(
    prefix="/recommend",
    tags=["Investment Recommendations"]
)


@router.get("/sip/calculate")
def sip_calculator(
    monthly_amount: float = 2000,
    annual_return: float  = 12.0,
    years: int            = 10,
    inflation: float      = 6.0
):
    """
    Calculate SIP returns with year by year breakdown.

    Example: GET /recommend/sip/calculate?monthly_amount=2000&annual_return=12&years=10
    """
    result = calculate_sip(monthly_amount, annual_return, years, inflation)
    return result


@router.get("/sip/analyse")
def analyse_sip(
    fund_name     : str   = "Mirae Asset Large Cap Fund",
    monthly_amount: float = 2000,
    start_date    : str   = "2024-01-01",
    expected_rate : float = 12.0
):
    """
    Analyse an existing SIP — current status and future projections.

    Example: GET /recommend/sip/analyse?fund_name=Mirae Asset Large Cap&monthly_amount=2000&start_date=2024-01-01
    """
    result = analyse_existing_sip(
        fund_name, monthly_amount, start_date, expected_rate
    )
    if not result:
        return {"error": "Could not analyse SIP"}
    return result


@router.get("/stocks")
def recommend_stocks(
    budget    : float = 5000,
    risk_level: str   = "medium"
):
    """
    Get stock recommendations within your budget.

    Example: GET /recommend/stocks?budget=5000&risk_level=medium
    Risk levels: low, medium, high
    """
    result = get_stock_recommendations(budget, risk_level)
    return result


@router.get("/sips")
def recommend_sips(
    monthly_budget   : float = 2000,
    risk_level       : str   = "medium",
    investment_years : int   = 10
):
    """
    Get SIP recommendations for your monthly budget.

    Example: GET /recommend/sips?monthly_budget=2000&risk_level=medium&investment_years=10
    """
    result = get_sip_recommendations(
        monthly_budget, risk_level, investment_years
    )
    return result


@router.get("/etfs")
def recommend_etfs(
    budget: float = 5000,
    goal  : str   = "wealth"
):
    """
    Get ETF recommendations for your budget.

    Example: GET /recommend/etfs?budget=5000&goal=wealth
    Goals: wealth, safety, gold, sector
    """
    result = get_etf_recommendations(budget, goal)
    return result


@router.get("/complete")
def complete_recommendation(
    budget          : float = 5000,
    monthly_sip     : float = 2000,
    risk_level      : str   = "medium",
    investment_years: int   = 10
):
    """
    Complete investment plan — stocks + SIPs + ETFs combined.

    Example: GET /recommend/complete?budget=5000&monthly_sip=2000&risk_level=medium&investment_years=10
    """
    result = get_complete_recommendation(
        budget, monthly_sip, risk_level, investment_years
    )
    return result