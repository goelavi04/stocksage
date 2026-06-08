from fastapi import APIRouter, HTTPException
from backend.services.news_fetcher import (
    fetch_market_news,
    fetch_stock_news,
    fetch_portfolio_news
)

router = APIRouter(
    prefix="/news",
    tags=["News & Sentiment"]
)


@router.get("/market")
def get_market_news():
    """
    Get latest Indian market news with FinBERT sentiment.
    Sources: Economic Times, Moneycontrol, Business Standard
    """
    articles = fetch_market_news(max_articles=10)

    if not articles:
        raise HTTPException(
            status_code=404,
            detail="Could not fetch market news. Check internet connection."
        )

    # Separate by sentiment
    positive = [a for a in articles if a["sentiment"] == "positive"]
    negative = [a for a in articles if a["sentiment"] == "negative"]
    neutral  = [a for a in articles if a["sentiment"] == "neutral"]

    return {
        "total_articles": len(articles),
        "sentiment_breakdown": {
            "positive": len(positive),
            "negative": len(negative),
            "neutral": len(neutral)
        },
        "articles": articles
    }


@router.get("/stock/{symbol}")
def get_stock_news(symbol: str):
    """
    Get news specifically about a stock with sentiment analysis.
    Filters all market news to find articles about this company.

    Example: GET /news/stock/JIOFIN
    Example: GET /news/stock/TATASTEEL
    """
    data = fetch_stock_news(symbol)
    return data


@router.get("/portfolio")
def get_portfolio_news(symbols: str = "JIOFIN,TATASTEEL,IDEA"):
    """
    Get news for all your portfolio stocks at once.
    Pass comma separated symbols.

    Example: GET /news/portfolio?symbols=JIOFIN,TATASTEEL,IDEA
    """
    symbol_list = [s.strip() for s in symbols.split(",")]
    data = fetch_portfolio_news(symbol_list)
    return data