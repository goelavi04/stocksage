from datetime import datetime
from backend.services.yahoo_client import chart


def _ns_then_bo(symbol: str, **kwargs):
    """Try NSE (.NS) first, fall back to BSE (.BO)."""
    result = chart(f"{symbol.upper()}.NS", **kwargs)
    if not result:
        result = chart(f"{symbol.upper()}.BO", **kwargs)
    return result


def fetch_stock_quote(symbol: str):
    try:
        result = _ns_then_bo(symbol, interval='1d', range_='5d')
        if not result:
            return None

        meta = result['meta']
        current = meta.get('regularMarketPrice') or meta.get('previousClose') or 0
        prev    = meta.get('previousClose') or meta.get('chartPreviousClose') or current

        change  = round(current - prev, 2)
        pct     = round((change / prev) * 100, 2) if prev else 0.0

        return {
            "symbol":         symbol.upper(),
            "company_name":   meta.get('shortName') or meta.get('longName') or symbol.upper(),
            "current_price":  round(current, 2),
            "change":         change,
            "percent_change": pct,
            "open":           round(meta.get('regularMarketOpen', current), 2),
            "high":           round(meta.get('regularMarketDayHigh', current), 2),
            "low":            round(meta.get('regularMarketDayLow', current), 2),
            "previous_close": round(prev, 2),
            "volume":         meta.get('regularMarketVolume', 0),
            "52_week_high":   round(meta.get('fiftyTwoWeekHigh', 0), 2),
            "52_week_low":    round(meta.get('fiftyTwoWeekLow', 0), 2),
            "market_cap":     meta.get('marketCap', 0),
            "pe_ratio":       round(meta.get('trailingPE', 0) or 0, 2),
            "source":         "Yahoo Finance",
            "last_updated":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    except Exception as e:
        print(f"[fetch_stock_quote] {symbol}: {e}")
        return None


def fetch_stock_history(symbol: str, period: str = "1y"):
    try:
        range_map = {
            '1mo': '1mo', '3mo': '3mo', '6mo': '6mo',
            '1y': '1y', '2y': '2y', '5y': '5y',
        }
        range_ = range_map.get(period, '1y')

        result = _ns_then_bo(symbol, interval='1d', range_=range_)
        if not result:
            return None

        timestamps = result.get('timestamp', [])
        q = result.get('indicators', {}).get('quote', [{}])[0]
        opens   = q.get('open',   [None] * len(timestamps))
        highs   = q.get('high',   [None] * len(timestamps))
        lows    = q.get('low',    [None] * len(timestamps))
        closes  = q.get('close',  [None] * len(timestamps))
        volumes = q.get('volume', [None] * len(timestamps))

        history = []
        for i, ts in enumerate(timestamps):
            if closes[i] is None:
                continue
            history.append({
                "date":   datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
                "open":   round(opens[i]   or 0, 2),
                "high":   round(highs[i]   or 0, 2),
                "low":    round(lows[i]    or 0, 2),
                "close":  round(closes[i],     2),
                "volume": int(volumes[i]   or 0),
            })

        return {
            "symbol":     symbol.upper(),
            "period":     period,
            "total_days": len(history),
            "data":       history,
        }

    except Exception as e:
        print(f"[fetch_stock_history] {symbol}: {e}")
        return None
