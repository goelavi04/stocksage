from backend.services.yahoo_client import summary, chart


def _raw(obj) -> float | None:
    """Extract .raw from a Yahoo Finance quoteSummary value dict."""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get('raw')
    return float(obj) if obj else None


def fetch_fundamental_data(symbol: str):
    try:
        ticker = f"{symbol.upper()}.NS"
        modules = 'summaryDetail,financialData,defaultKeyStatistics,assetProfile'
        result = summary(ticker, modules)

        if not result:
            result = summary(f"{symbol.upper()}.BO", modules)
        if not result:
            return _basic_from_chart(symbol)

        sd  = result.get('summaryDetail', {})
        fd  = result.get('financialData', {})
        ks  = result.get('defaultKeyStatistics', {})
        ap  = result.get('assetProfile', {})

        pe_ratio       = _raw(sd.get('trailingPE'))
        forward_pe     = _raw(sd.get('forwardPE'))
        dividend_yield = _raw(sd.get('dividendYield'))
        eps            = _raw(ks.get('trailingEps'))
        book_value     = _raw(ks.get('bookValue'))
        price_to_book  = _raw(ks.get('priceToBook'))
        profit_margin  = _raw(fd.get('profitMargins'))
        debt_to_equity = _raw(fd.get('debtToEquity'))
        roe            = _raw(fd.get('returnOnEquity'))
        current_ratio  = _raw(fd.get('currentRatio'))
        revenue        = _raw(fd.get('totalRevenue'))
        sector         = ap.get('sector', 'Unknown')
        industry       = ap.get('industry', 'Unknown')
        employee_count = ap.get('fullTimeEmployees')
        company_summary = ap.get('longBusinessSummary', '')

        # ── Signals ───────────────────────────────────────────
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

        # Yahoo Finance returns debtToEquity already in percentage (50 = 50%)
        de_val = debt_to_equity  # keep as-is for scoring
        if de_val is None:
            debt_signal = "unavailable"
        elif de_val < 30:
            debt_signal = "good — very low debt"
        elif de_val < 100:
            debt_signal = "neutral — manageable debt"
        elif de_val < 200:
            debt_signal = "caution — high debt"
        else:
            debt_signal = "bad — dangerously high debt"

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

        if not dividend_yield:
            div_signal = "no dividend — growth focused"
        elif dividend_yield < 0.02:
            div_signal = "low dividend yield"
        elif dividend_yield < 0.05:
            div_signal = "good — healthy dividend"
        else:
            div_signal = "caution — very high yield may signal distress"

        # ── Score ─────────────────────────────────────────────
        score = 50
        if pe_ratio:
            if pe_ratio < 15:   score += 15
            elif pe_ratio < 25: score += 8
            elif pe_ratio > 40: score -= 15
        if profit_margin:
            if profit_margin > 0.20:   score += 15
            elif profit_margin > 0.10: score += 8
            elif profit_margin < 0:    score -= 20
        if de_val:
            if de_val < 30:    score += 10
            elif de_val > 200: score -= 15
        if roe:
            if roe > 0.20: score += 10
            elif roe < 0:  score -= 10
        score = max(0, min(100, score))

        return {
            "symbol": symbol.upper(),
            "company_info": {
                "sector":    sector,
                "industry":  industry,
                "employees": employee_count,
                "summary":   company_summary[:300] + "..." if len(company_summary) > 300 else company_summary,
            },
            "valuation": {
                "pe_ratio":      round(pe_ratio, 2) if pe_ratio else None,
                "forward_pe":    round(forward_pe, 2) if forward_pe else None,
                "price_to_book": round(price_to_book, 2) if price_to_book else None,
                "book_value":    round(book_value, 2) if book_value else None,
                "pe_signal":     pe_signal,
            },
            "profitability": {
                "eps":           round(eps, 2) if eps else None,
                "profit_margin": f"{round(profit_margin * 100, 2)}%" if profit_margin else None,
                "roe":           f"{round(roe * 100, 2)}%" if roe else None,
                "margin_signal": margin_signal,
                "roe_signal":    roe_signal,
            },
            "financial_health": {
                "debt_to_equity": round(de_val, 2) if de_val else None,
                "current_ratio":  round(current_ratio, 2) if current_ratio else None,
                "debt_signal":    debt_signal,
            },
            "dividends": {
                "dividend_yield": f"{round(dividend_yield * 100, 2)}%" if dividend_yield and dividend_yield < 1 else None,
                "div_signal":     div_signal,
            },
            "fundamental_score": score,
        }

    except Exception as e:
        print(f"[fetch_fundamental_data] {symbol}: {e}")
        return _basic_from_chart(symbol)


def _basic_from_chart(symbol: str) -> dict | None:
    """Return a minimal fundamentals dict using only the chart API (no crumb needed)."""
    try:
        result = chart(f"{symbol.upper()}.NS", interval='1d', range_='5d')
        if not result:
            result = chart(f"{symbol.upper()}.BO", interval='1d', range_='5d')
        if not result:
            return None

        meta = result.get('meta', {})
        name = meta.get('longName') or meta.get('shortName') or symbol.upper()

        return {
            "symbol": symbol.upper(),
            "company_info": {
                "sector":    "N/A",
                "industry":  "N/A",
                "employees": None,
                "summary":   f"Detailed fundamentals temporarily unavailable for {name}. "
                             "Financial ratios require extended data access.",
            },
            "valuation": {
                "pe_ratio":      None,
                "forward_pe":    None,
                "price_to_book": None,
                "book_value":    None,
                "pe_signal":     "unavailable",
            },
            "profitability": {
                "eps":           None,
                "profit_margin": None,
                "roe":           None,
                "margin_signal": "unavailable",
                "roe_signal":    "unavailable",
            },
            "financial_health": {
                "debt_to_equity": None,
                "current_ratio":  None,
                "debt_signal":    "unavailable",
            },
            "dividends": {
                "dividend_yield": None,
                "div_signal":     "unavailable",
            },
            "fundamental_score": 50,
            "data_status": "partial — financial ratios temporarily unavailable",
        }
    except Exception as e:
        print(f"[_basic_from_chart] {symbol}: {e}")
        return None
