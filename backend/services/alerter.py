from datetime import datetime
from backend.services.data_fetcher import fetch_stock_quote
from backend.services.indicators import fetch_technical_indicators
from backend.database import SessionLocal
from backend.models.portfolio import Portfolio

# ── Alert Thresholds ──────────────────────────────────
PRICE_DROP_THRESHOLD     = -3.0
PRICE_RISE_THRESHOLD     =  3.0
RSI_OVERSOLD_THRESHOLD   = 35
RSI_OVERBOUGHT_THRESHOLD = 70
PNL_LOSS_THRESHOLD       = -10.0


# ── Check Market Hours ────────────────────────────────
def is_market_open() -> bool:
    now = datetime.now()
    if now.weekday() >= 5:
        return False
    market_open  = now.replace(hour=9,  minute=15, second=0)
    market_close = now.replace(hour=15, minute=30, second=0)
    return market_open <= now <= market_close


# ── Generate Alerts for One Stock ────────────────────
def check_stock_alerts(symbol: str, quantity: float,
                        buy_price: float) -> list:
    alerts = []

    try:
        quote      = fetch_stock_quote(symbol)
        indicators = fetch_technical_indicators(symbol)

        if not quote:
            return alerts

        current_price  = quote["current_price"]
        percent_change = quote["percent_change"]
        invested       = round(quantity * buy_price, 2)
        current_value  = round(quantity * current_price, 2)
        pnl_percent    = round(((current_value - invested) / invested) * 100, 2)

        # Alert 1: Big price drop today
        if percent_change <= PRICE_DROP_THRESHOLD:
            alerts.append({
                "type"    : "PRICE_DROP",
                "severity": "HIGH",
                "emoji"   : "🔴",
                "symbol"  : symbol,
                "message" : f"{symbol} aaj {percent_change}% gira hai",
                "detail"  : f"Current: Rs.{current_price} | Your P&L: {pnl_percent}%",
                "action"  : "Ghabrao mat — fundamentals check karo pehle",
                "english" : f"{symbol} dropped {percent_change}% today. Check if news driven or market wide."
            })

        # Alert 2: Big price rise today
        if percent_change >= PRICE_RISE_THRESHOLD:
            alerts.append({
                "type"    : "PRICE_RISE",
                "severity": "MEDIUM",
                "emoji"   : "🟢",
                "symbol"  : symbol,
                "message" : f"{symbol} aaj {percent_change}% upar hai",
                "detail"  : f"Current: Rs.{current_price} | Your P&L: {pnl_percent}%",
                "action"  : "Profit book karne ka sochein ya hold karein",
                "english" : f"{symbol} rose {percent_change}% today. Consider partial profit booking."
            })

        # Alert 3: RSI oversold
        if indicators:
            rsi = indicators["indicators"]["rsi"]["value"]

            if rsi <= RSI_OVERSOLD_THRESHOLD:
                alerts.append({
                    "type"    : "RSI_OVERSOLD",
                    "severity": "MEDIUM",
                    "emoji"   : "📉",
                    "symbol"  : symbol,
                    "message" : f"{symbol} ka RSI {rsi} hai — oversold zone",
                    "detail"  : f"RSI below 35 means stock may bounce back soon",
                    "action"  : "Average down karne ka consider karein",
                    "english" : f"{symbol} RSI at {rsi} — oversold. Historical bounce zone."
                })

            # Alert 4: RSI overbought
            if rsi >= RSI_OVERBOUGHT_THRESHOLD:
                alerts.append({
                    "type"    : "RSI_OVERBOUGHT",
                    "severity": "MEDIUM",
                    "emoji"   : "📈",
                    "symbol"  : symbol,
                    "message" : f"{symbol} ka RSI {rsi} hai — overbought zone",
                    "detail"  : f"RSI above 70 means stock may pull back soon",
                    "action"  : "Partial profit book karne ka sochein",
                    "english" : f"{symbol} RSI at {rsi} — overbought. Consider taking some profits."
                })

        # Alert 5: Heavy overall loss
        if pnl_percent <= PNL_LOSS_THRESHOLD:
            alerts.append({
                "type"    : "HEAVY_LOSS",
                "severity": "HIGH",
                "emoji"   : "⚠️",
                "symbol"  : symbol,
                "message" : f"{symbol} mein {pnl_percent}% ka loss hai",
                "detail"  : f"Invested: Rs.{invested} | Current: Rs.{current_value}",
                "action"  : "Review karo — hold ya cut loss decide karo",
                "english" : f"{symbol} showing {pnl_percent}% loss. Review your thesis for holding."
            })

    except Exception as e:
        print(f"Error checking alerts for {symbol}: {e}")

    return alerts


# ── Check Full Portfolio ──────────────────────────────
def check_portfolio_alerts() -> dict:
    """
    Runs alert checks on entire portfolio.
    Saves to DB and sends WhatsApp + Email notifications.
    """
    # Import here to avoid circular imports
    from backend.services.notifications import send_all_notifications

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Checking portfolio alerts...")

    db = SessionLocal()
    try:
        holdings = db.query(Portfolio).all()
    finally:
        db.close()

    if not holdings:
        return {"alerts": [], "message": "Portfolio is empty"}

    all_alerts = []

    for holding in holdings:
        alerts = check_stock_alerts(
            symbol    = holding.symbol,
            quantity  = holding.quantity,
            buy_price = holding.buy_price
        )
        all_alerts.extend(alerts)

    # Send all notifications — WhatsApp + Email + Save to DB
    print(f"Sending {len(all_alerts)} notifications...")
    notification_result = send_all_notifications(all_alerts)
    print(f"Notification result: {notification_result}")

    # Separate by severity
    high_alerts   = [a for a in all_alerts if a["severity"] == "HIGH"]
    medium_alerts = [a for a in all_alerts if a["severity"] == "MEDIUM"]

    if high_alerts:
        summary       = f"⚠️ {len(high_alerts)} urgent alerts need your attention!"
        hindi_summary = f"Aapke portfolio mein {len(high_alerts)} zaroori alerts hain!"
    elif medium_alerts:
        summary       = f"📊 {len(medium_alerts)} portfolio updates available"
        hindi_summary = f"Aapke portfolio ke baare mein {len(medium_alerts)} updates hain"
    else:
        summary       = "✅ Portfolio looks stable — no urgent alerts"
        hindi_summary = "Aapka portfolio theek hai — koi zaroori alert nahi"

    return {
        "checked_at"     : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_alerts"   : len(all_alerts),
        "high_priority"  : len(high_alerts),
        "medium_priority": len(medium_alerts),
        "summary"        : summary,
        "hindi_summary"  : hindi_summary,
        "alerts"         : all_alerts
    }