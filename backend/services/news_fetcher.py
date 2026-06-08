import feedparser
from backend.services.sentiment import analyse_sentiment, get_overall_sentiment

# ── NSE Symbol to Company Name Mapping ───────────────
# Used to search news by company name not symbol
SYMBOL_TO_COMPANY = {
    "JIOFIN": ["JIO Financial", "Jio Financial Services", "JFSL"],
    "IDEA": ["Vodafone Idea", "Vi ", "Vodafone"],
    "TATASTEEL": ["Tata Steel", "TataSteel"],
    "TATAMOTORS": ["Tata Motors", "TataMotors"],
    "TATAMTRDVR": ["Tata Motors", "Tata DVR"],
    "ZOMATO": ["Zomato", "Eternal"],
    "AMBUJACEM": ["Ambuja Cement", "Ambuja"],
    "IOC": ["Indian Oil", "IOCL", "IOC"],
    "SUZLON": ["Suzlon Energy", "Suzlon"],
    "YESBANK": ["Yes Bank", "YesBank"],
    "SATIA": ["Satia Industries", "Satia"],
    "SYNCOM": ["Syncom Formulations", "Syncom"],
    "RAJNANDINI": ["Rajnandini Metal", "Rajnandini"],
    "TCS": ["TCS", "Tata Consultancy", "Tata Consultancy Services"],
    "RELIANCE": ["Reliance Industries", "Reliance", "RIL"],
    "INFY": ["Infosys", "Infy"],
    "HDFCBANK": ["HDFC Bank", "HDFCBank"],
    "WIPRO": ["Wipro"],
    "ICICIBANK": ["ICICI Bank", "ICICI"],
    "SBIN": ["State Bank", "SBI"],
}

# ── RSS Feed URLs ─────────────────────────────────────
RSS_FEEDS = {
    "economic_times": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "moneycontrol": "https://www.moneycontrol.com/rss/latestnews.xml",
    "business_standard": "https://www.business-standard.com/rss/markets-106.rss",
    "livemint": "https://www.livemint.com/rss/markets",
}


def fetch_market_news(max_articles: int = 20) -> list:
    """
    Fetches latest market news from all RSS feeds.
    Returns list of articles with sentiment analysis.

    Args:
        max_articles: Maximum number of articles to fetch per source

    Returns:
        List of news articles with sentiment scores
    """
    all_articles = []

    for source_name, feed_url in RSS_FEEDS.items():
        try:
            # Parse RSS feed
            feed = feedparser.parse(feed_url)

            for entry in feed.entries[:max_articles]:
                # Extract article details
                title   = entry.get("title", "")
                summary = entry.get("summary", "")
                link    = entry.get("link", "")
                published = entry.get("published", "")

                if not title:
                    continue

                # Run FinBERT sentiment on headline
                sentiment = analyse_sentiment(title)

                article = {
                    "title": title,
                    "summary": summary[:200] if summary else "",
                    "link": link,
                    "published": published,
                    "source": source_name,
                    "sentiment": sentiment["sentiment"],
                    "sentiment_emoji": sentiment["emoji"],
                    "confidence": sentiment["confidence"],
                    "impact": sentiment["impact"]
                }

                all_articles.append(article)

        except Exception as e:
            print(f"Error fetching {source_name}: {e}")
            continue

    return all_articles


def fetch_stock_news(symbol: str, max_articles: int = 10) -> dict:
    """
    Fetches news specifically about a stock from your portfolio.
    Filters all articles to find ones mentioning this company.

    Args:
        symbol: NSE stock symbol e.g. "JIOFIN", "TATASTEEL"
        max_articles: Maximum articles to return

    Returns:
        Dictionary with filtered news and overall sentiment
    """
    # Get company name variations for this symbol
    company_names = SYMBOL_TO_COMPANY.get(
        symbol.upper(),
        [symbol.upper()]
    )

    all_articles = fetch_market_news(max_articles=50)

    # Filter articles mentioning this company
    relevant_articles = []
    for article in all_articles:
        title_lower   = article["title"].lower()
        summary_lower = article["summary"].lower()

        for company_name in company_names:
            if company_name.lower() in title_lower or \
               company_name.lower() in summary_lower:
                relevant_articles.append(article)
                break

    # Get overall sentiment for this stock's news
    headlines = [a["title"] for a in relevant_articles]
    overall = get_overall_sentiment(headlines) if headlines else {
        "overall": "neutral",
        "score": 0,
        "market_mood": "No recent news found",
        "hindi_summary": "Koi khabar nahi mili"
    }

    return {
        "symbol": symbol.upper(),
        "total_articles": len(relevant_articles),
        "overall_sentiment": overall,
        "articles": relevant_articles[:max_articles]
    }


def fetch_portfolio_news(symbols: list) -> dict:
    """
    Fetches and analyses news for ALL stocks in your portfolio.
    This is what powers the daily briefing.

    Args:
        symbols: List of NSE symbols e.g. ["JIOFIN", "TATASTEEL", "IDEA"]

    Returns:
        Dictionary with news and sentiment for each stock
    """
    # Fetch all market news ONCE and reuse for all stocks
    all_articles = fetch_market_news(max_articles=50)

    portfolio_news = {}
    all_relevant_headlines = []

    for symbol in symbols:
        company_names = SYMBOL_TO_COMPANY.get(symbol.upper(), [symbol.upper()])

        # Filter for this stock
        relevant = []
        for article in all_articles:
            title_lower   = article["title"].lower()
            summary_lower = article["summary"].lower()
            for name in company_names:
                if name.lower() in title_lower or \
                   name.lower() in summary_lower:
                    relevant.append(article)
                    all_relevant_headlines.append(article["title"])
                    break

        headlines = [a["title"] for a in relevant]
        sentiment = get_overall_sentiment(headlines) if headlines else {
            "overall": "neutral",
            "score": 0,
            "market_mood": "No recent news found",
            "hindi_summary": "Koi khabar nahi mili"
        }

        portfolio_news[symbol.upper()] = {
            "articles_found": len(relevant),
            "sentiment": sentiment,
            "top_headlines": [a["title"] for a in relevant[:3]],
            "articles": relevant[:5]
        }

    # Overall market sentiment from ALL fetched articles
    all_headlines = [a["title"] for a in all_articles]
    market_sentiment = get_overall_sentiment(all_headlines) if all_headlines else {
        "overall": "neutral",
        "score": 0,
        "market_mood": "Could not fetch market news",
        "hindi_summary": "Khabar nahi mil rahi"
    }

    return {
        "market_sentiment": market_sentiment,
        "portfolio_news": portfolio_news
    }