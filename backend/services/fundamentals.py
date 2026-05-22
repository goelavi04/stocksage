import yfinance as yf


def fetch_fundamental_data(symbol: str):
    """
    Fetches fundamental/financial data for a stock.
    This data forms 40% of the Recommendation Engine score.

    Args:
        symbol: NSE stock symbol e.g. "TCS", "RELIANCE"

    Returns:
        Dictionary with fundamental metrics and their interpretations
    """
    try:
        ticker = yf.Ticker(f"{symbol.upper()}.NS")
        info = ticker.info

        if not info:
            return None

        # ── Extract raw values ────────────────────────────────
        pe_ratio        = info.get("trailingPE", None)
        forward_pe      = info.get("forwardPE", None)
        eps             = info.get("trailingEps", None)
        revenue         = info.get("totalRevenue", None)
        profit_margin   = info.get("profitMargins", None)
        debt_to_equity  = info.get("debtToEquity", None)
        roe             = info.get("returnOnEquity", None)
        dividend_yield  = info.get("dividendYield", None)
        book_value      = info.get("bookValue", None)
        price_to_book   = info.get("priceToBook", None)
        current_ratio   = info.get("currentRatio", None)
        sector          = info.get("sector", "Unknown")
        industry        = info.get("industry", "Unknown")
        employee_count  = info.get("fullTimeEmployees", None)
        company_summary = info.get("longBusinessSummary", "")

        # ── Score each metric ─────────────────────────────────
        # Each metric gets a score: "good", "neutral", or "bad"
        # This feeds into the Recommendation Engine

        # PE Ratio scoring
        # Lower PE = cheaper stock relative to earnings
        if pe_ratio is None:
            pe_signal = "unavailable"
        elif pe_ratio < 15:
            pe_signal = "good — undervalued"
        elif pe_ratio < 25:
            pe_signal = "neutral — fairly valued"
        elif pe_ratio < 40:
            pe_signal = "caution — moderately expensive"
        else:
            pe_signal = "bad — very expensive"

        # Profit margin scoring
        # Higher margin = more efficient business
        if profit_margin is None:
            margin_signal = "unavailable"
        elif profit_margin > 0.20:
            margin_signal = "good — highly profitable"
        elif profit_margin > 0.10:
            margin_signal = "neutral — decent margins"
        elif profit_margin > 0:
            margin_signal = "caution — thin margins"
        else:
            margin_signal = "bad — loss making"

        # Debt to Equity scoring
        # Lower D/E = less debt = safer company
        if debt_to_equity is None:
            debt_signal = "unavailable"
        elif debt_to_equity < 30:
            debt_signal = "good — very low debt"
        elif debt_to_equity < 100:
            debt_signal = "neutral — manageable debt"
        elif debt_to_equity < 200:
            debt_signal = "caution — high debt"
        else:
            debt_signal = "bad — dangerously high debt"

        # ROE scoring
        # Higher ROE = management using money efficiently
        if roe is None:
            roe_signal = "unavailable"
        elif roe > 0.20:
            roe_signal = "good — excellent returns"
        elif roe > 0.12:
            roe_signal = "neutral — decent returns"
        elif roe > 0:
            roe_signal = "caution — low returns"
        else:
            roe_signal = "bad — destroying shareholder value"

        # Dividend yield scoring
        if dividend_yield is None or dividend_yield == 0:
            div_signal = "no dividend — growth focused"
        elif dividend_yield < 0.02:
            div_signal = "low dividend yield"
        elif dividend_yield < 0.05:
            div_signal = "good — healthy dividend"
        else:
            div_signal = "caution — very high yield may signal distress"

        # ── Calculate fundamental score (0-100) ──────────────
        # Used by Recommendation Engine
        score = 50  # start neutral

        if pe_ratio:
            if pe_ratio < 15:   score += 15
            elif pe_ratio < 25: score += 8
            elif pe_ratio > 40: score -= 15

        if profit_margin:
            if profit_margin > 0.20:   score += 15
            elif profit_margin > 0.10: score += 8
            elif profit_margin < 0:    score -= 20

        if debt_to_equity:
            if debt_to_equity < 30:    score += 10
            elif debt_to_equity > 200: score -= 15

        if roe:
            if roe > 0.20:   score += 10
            elif roe < 0:    score -= 10

        # Clamp score between 0 and 100
        score = max(0, min(100, score))

        return {
            "symbol": symbol.upper(),
            "company_info": {
                "sector": sector,
                "industry": industry,
                "employees": employee_count,
                "summary": company_summary[:300] + "..." if len(company_summary) > 300 else company_summary
            },
            "valuation": {
                "pe_ratio": round(pe_ratio, 2) if pe_ratio else None,
                "forward_pe": round(forward_pe, 2) if forward_pe else None,
                "price_to_book": round(price_to_book, 2) if price_to_book else None,
                "book_value": round(book_value, 2) if book_value else None,
                "pe_signal": pe_signal
            },
            "profitability": {
                "eps": round(eps, 2) if eps else None,
                "profit_margin": f"{round(profit_margin * 100, 2)}%" if profit_margin else None,
                "roe": f"{round(roe * 100, 2)}%" if roe else None,
                "margin_signal": margin_signal,
                "roe_signal": roe_signal
            },
            "financial_health": {
                "debt_to_equity": round(debt_to_equity, 2) if debt_to_equity else None,
                "current_ratio": round(current_ratio, 2) if current_ratio else None,
                "debt_signal": debt_signal
            },
            "dividends": {
                "dividend_yield": f"{round(dividend_yield * 100, 2)}%" if dividend_yield and dividend_yield < 1 else f"{round(dividend_yield, 2)}%" if dividend_yield else None,
                "div_signal": div_signal
            },
            "fundamental_score": score
        }

    except Exception as e:
        print(f"Error fetching fundamentals for {symbol}: {e}")
        return None