from backend.services.indicators import fetch_technical_indicators
from backend.services.fundamentals import fetch_fundamental_data


def calculate_technical_score(indicators: dict) -> tuple:
    """
    Scores the technical analysis dimension (0-100).
    Returns score and list of reasons.
    """
    score = 50  # start neutral
    reasons = []

    ind = indicators["indicators"]

    # ── RSI Score ─────────────────────────────────────────
    rsi = ind["rsi"]["value"]
    if rsi < 35:
        score += 20
        reasons.append(f"RSI at {rsi} — oversold, potential bounce incoming")
    elif rsi < 50:
        score += 10
        reasons.append(f"RSI at {rsi} — slightly oversold, mild positive")
    elif rsi < 65:
        score += 0
        reasons.append(f"RSI at {rsi} — neutral zone")
    elif rsi < 75:
        score -= 10
        reasons.append(f"RSI at {rsi} — getting overbought, caution")
    else:
        score -= 20
        reasons.append(f"RSI at {rsi} — overbought, avoid buying here")

    # ── Moving Average Score ───────────────────────────────
    price  = indicators["current_price"]
    ma50   = ind["moving_averages"]["ma50"]
    ma200  = ind["moving_averages"]["ma200"]

    if price > ma50:
        score += 15
        reasons.append(f"Price ₹{price} above MA50 ₹{ma50} — uptrend confirmed")
    else:
        score -= 15
        reasons.append(f"Price ₹{price} below MA50 ₹{ma50} — downtrend in place")

    if price > ma200:
        score += 10
        reasons.append(f"Price above MA200 ₹{ma200} — long term bullish")
    else:
        score -= 10
        reasons.append(f"Price below MA200 ₹{ma200} — long term bearish")

    # ── MACD Score ────────────────────────────────────────
    macd      = ind["macd"]["macd"]
    macd_sig  = ind["macd"]["signal_line"]
    macd_hist = ind["macd"]["histogram"]

    if macd > macd_sig:
        score += 10
        reasons.append(f"MACD bullish crossover — momentum is positive")
    else:
        score -= 10
        reasons.append(f"MACD bearish — momentum is negative")

    # ── Bollinger Band Score ──────────────────────────────
    bb_signal = ind["bollinger_bands"]["signal"]
    if "below lower" in bb_signal:
        score += 10
        reasons.append("Price at lower Bollinger Band — oversold extreme")
    elif "above upper" in bb_signal:
        score -= 10
        reasons.append("Price at upper Bollinger Band — overbought extreme")

    # Clamp between 0 and 100
    score = max(0, min(100, score))
    return score, reasons


def calculate_fundamental_score(fundamentals: dict) -> tuple:
    """
    Scores the fundamental analysis dimension (0-100).
    Returns score and list of reasons.
    """
    score = fundamentals.get("fundamental_score", 50)
    reasons = []

    # Build reasons from signals
    pe_signal     = fundamentals["valuation"]["pe_signal"]
    margin_signal = fundamentals["profitability"]["margin_signal"]
    debt_signal   = fundamentals["financial_health"]["debt_signal"]
    roe_signal    = fundamentals["profitability"]["roe_signal"]

    pe = fundamentals["valuation"]["pe_ratio"]
    if pe:
        reasons.append(f"PE ratio {pe} — {pe_signal}")

    margin = fundamentals["profitability"]["profit_margin"]
    if margin:
        reasons.append(f"Profit margin {margin} — {margin_signal}")

    debt = fundamentals["financial_health"]["debt_to_equity"]
    if debt:
        reasons.append(f"Debt to equity {debt} — {debt_signal}")

    roe = fundamentals["profitability"]["roe"]
    if roe:
        reasons.append(f"ROE {roe} — {roe_signal}")

    return score, reasons


def generate_recommendation(symbol: str) -> dict:
    """
    Main function — generates Buy/Hold/Sell recommendation
    by combining technical and fundamental scores.

    Args:
        symbol: NSE stock symbol

    Returns:
        Complete recommendation with signal, score, reasoning,
        and Father Mode Hindi-English explanation
    """
    # ── Fetch all data ────────────────────────────────────
    indicators   = fetch_technical_indicators(symbol)
    if not indicators:
        return None

    fundamentals = fetch_fundamental_data(symbol)  # may be None (non-fatal)

    # ── Calculate dimension scores ────────────────────────
    tech_score, tech_reasons = calculate_technical_score(indicators)

    if fundamentals:
        fund_score, fund_reasons = calculate_fundamental_score(fundamentals)
        fund_weight = 0.40
        tech_weight = 0.40
    else:
        fund_score   = 50
        fund_reasons = ["Fundamental data temporarily unavailable — using neutral score"]
        fund_weight  = 0.0
        tech_weight  = 0.80

    # ML score defaults to 50 (neutral) until LSTM is built
    ml_score    = 50
    ml_reasons  = ["ML forecast not yet available — defaulting to neutral"]

    # ── Weighted final score ──────────────────────────────
    final_score = round(
        (tech_score * tech_weight) +
        (fund_score * fund_weight) +
        (ml_score   * 0.20),
        1
    )

    # ── Generate signal ───────────────────────────────────
    if final_score >= 75:
        signal   = "STRONG BUY"
        emoji    = "🟢"
        summary  = "All signals aligned positive. Strong entry opportunity."
    elif final_score >= 60:
        signal   = "BUY"
        emoji    = "🟢"
        summary  = "Technical and fundamental signals mostly positive. Good entry."
    elif final_score >= 45:
        signal   = "HOLD"
        emoji    = "🟡"
        summary  = "Mixed signals. No strong reason to buy or sell right now."
    elif final_score >= 35:
        signal   = "WATCH"
        emoji    = "🟠"
        summary  = "Weak signals. Monitor closely before making any decision."
    else:
        signal   = "SELL / AVOID"
        emoji    = "🔴"
        summary  = "Multiple negative signals. Consider reducing exposure."

    # ── Father Mode explanation ───────────────────────────
    # Simple Hindi-English explanation without jargon
    father_mode = generate_father_mode(
        symbol, signal, final_score,
        indicators, fundamentals
    )

    return {
        "symbol": symbol.upper(),
        "company_name": (fundamentals or {}).get("company_info", {}).get("sector", ""),
        "current_price": indicators["current_price"],
        "recommendation": {
            "signal": signal,
            "emoji": emoji,
            "final_score": final_score,
            "summary": summary
        },
        "score_breakdown": {
            "technical_score": tech_score,
            "technical_weight": "40%",
            "fundamental_score": fund_score,
            "fundamental_weight": "40%",
            "ml_score": ml_score,
            "ml_weight": "20%",
            "final_score": final_score
        },
        "technical_reasons": tech_reasons,
        "fundamental_reasons": fund_reasons,
        "ml_reasons": ml_reasons,
        "father_mode": father_mode
    }


def generate_father_mode(
    symbol: str,
    signal: str,
    score: float,
    indicators: dict,
    fundamentals: dict
) -> dict:
    """
    Generates simple Hindi-English explanation for non-technical users.
    Designed specifically for Aviral's father.
    """

    price       = indicators["current_price"]
    pe          = (fundamentals or {}).get("valuation", {}).get("pe_ratio")
    debt_signal = (fundamentals or {}).get("financial_health", {}).get("debt_signal", "unavailable")
    rsi         = indicators["indicators"]["rsi"]["value"]

    # Simple action advice based on signal
    if signal in ["STRONG BUY", "BUY"]:
        action      = "Kharid sakte hain ✅"
        action_eng  = "Good time to buy"
        color       = "green"
    elif signal == "HOLD":
        action      = "Abhi rakho, mat becho ⏳"
        action_eng  = "Hold what you have, don't sell"
        color       = "yellow"
    elif signal == "WATCH":
        action      = "Thoda wait karo 👀"
        action_eng  = "Wait and watch for now"
        color       = "orange"
    else:
        action      = "Abhi mat kharido ❌"
        action_eng  = "Avoid buying right now"
        color       = "red"

    # Build simple explanation
    debt_simple = "Company par zyada karz nahi hai" if "good" in debt_signal else "Company par thoda karz hai"
    rsi_simple  = "Price thoda neeche aaya hai" if rsi < 45 else "Price upar chal raha hai"

    pe_str = f"PE ratio {pe} hai. " if pe else ""
    explanation = (
        f"{symbol} ka score aaj {score}/100 hai. "
        f"{rsi_simple}. "
        f"{debt_simple}. "
        f"{pe_str}"
        f"Is waqt recommendation hai: {action}"
    )

    return {
        "action": action,
        "action_english": action_eng,
        "color": color,
        "simple_explanation": explanation,
        "score": f"{score}/100"
    }