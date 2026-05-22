import yfinance as yf
from datetime import datetime


def fetch_stock_quote(symbol: str):
    """
    Fetches real-time stock quote using yfinance.
    Temporary solution until Upstox API is configured.
    
    NSE symbols need '.NS' suffix for yfinance
    e.g. TCS → TCS.NS, RELIANCE → RELIANCE.NS
    """

    try:
        # Add .NS suffix for NSE listed stocks
        ticker_symbol = f"{symbol.upper()}.NS"
        ticker = yf.Ticker(ticker_symbol)

        # fast_info gives us essential price data quickly
        info = ticker.fast_info

        # Get more detailed company info
        details = ticker.info

        return {
            "symbol": symbol.upper(),
            "company_name": details.get("longName", symbol.upper()),
            "current_price": round(info.last_price, 2),
            "change": round(info.last_price - info.previous_close, 2),
            "percent_change": round(
                ((info.last_price - info.previous_close) / info.previous_close) * 100, 2
            ),
            "open": round(info.open, 2),
            "high": round(info.day_high, 2),
            "low": round(info.day_low, 2),
            "previous_close": round(info.previous_close, 2),
            "volume": info.last_volume,
            "52_week_high": round(info.year_high, 2),
            "52_week_low": round(info.year_low, 2),
            "market_cap": details.get("marketCap", 0),
            "pe_ratio": round(details.get("trailingPE", 0), 2),
            "source": "yfinance (temporary — Upstox coming next)",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


def fetch_stock_history(symbol: str, period: str = "1y"):
    """
    Fetches historical OHLCV data for a stock.
    This data will be used to train our LSTM model.

    Args:
        symbol: NSE stock symbol e.g. "TCS"
        period: How far back to fetch
                "1mo" = 1 month
                "3mo" = 3 months
                "6mo" = 6 months
                "1y"  = 1 year (default)
                "2y"  = 2 years
                "5y"  = 5 years

    Returns:
        List of daily OHLCV candles
    """
    try:
        ticker = yf.Ticker(f"{symbol.upper()}.NS")

        # Download historical data
        # Each row = one trading day
        # Columns = Open, High, Low, Close, Volume
        df = ticker.history(period=period)

        if df.empty:
            return None

        # Convert dataframe to list of dictionaries
        # Each dictionary = one day's candle
        history = []
        for date, row in df.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })

        return {
            "symbol": symbol.upper(),
            "period": period,
            "total_days": len(history),
            "data": history
        }

    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return None