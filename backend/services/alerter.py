from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.services.data_fetcher import fetch_stock_quote
from backend.services.indicators import fetch_technical_indicators
from backend.services.news_fetcher import fetch_stock_news
from backend.database import SessionLocal
from backend.models.portfolio import Portfolio
import os
from dotenv import load_dotenv

load_dotenv()

# ── Alert Thresholds ──────────────────────────────────
PRICE_DROP_THRESHOLD    = -3.0   # Alert if stock drops 3% in a day
PRICE_RISE_THRESHOLD    =  3.0   # Alert if stock rises 3% in a day
RSI_OVERSOLD_THRESHOLD  = 35     # Alert if RSI goes below 35
RSI_OVERBOUGHT_THRESHOLD= 70     # Alert if RSI goes above 70
PNL_LOSS_THRESHOLD      = -10.0  # Alert if holding loses 10%


# ── Check Market Hours ────────────────────────────────
def is_market_open() -> bool:
    """
    Returns True if Indian stock market is currently open.
    NSE market hours: 9:15 AM to 3:30 PM, Monday to Friday
    """
    now = datetime.now()

    # Skip weekends
    if now.weekday() >= 5:
        return False

    # Market hours: 9:15 AM to 3:30 PM IST
    market_open  = now.replace(hour=9,  minute=15, second=0)
    market_close = now.replace(hour=15, minute=30, second=0)

    return market_open <= now <= market_close


# ── Generate Alerts for One Stock ────────────────────
def check_stock_alerts(symbol: str, quantity: float,
                        buy_price: float) -> list:
    """
    Checks all alert conditions for a single stock.
    Returns list of triggered alerts.

    Args:
        symbol: NSE stock symbol
        quantity: Number of shares owned
        buy_price: Average buy price

    Returns:
        List of alert dictionaries
    """
    alerts = []

    try:
        # Fetch current data
        quote      = fetch_stock_quote(symbol)
        indicators = fetch_technical_indicators(symbol)

        if not quote:
            return alerts

        current_price   = quote["current_price"]
        percent_change  = quote["percent_change"]
        invested        = round(quantity * buy_price, 2)
        current_value   = round(quantity * current_price, 2)
        pnl_percent     = round(((current_value - invested) / invested) * 100, 2)

        # ── Alert 1: Big price drop today ────────────
        if percent_change <= PRICE_DROP_THRESHOLD:
            alerts.append({
                "type": "PRICE_DROP",
                "severity": "HIGH",
                "emoji": "🔴",
                "symbol": symbol,
                "message": f"{symbol} aaj {percent_change}% gira hai",
                "detail": f"Current: ₹{current_price} | Your P&L: {pnl_percent}%",
                "action": "Ghabrao mat — fundamentals check karo pehle",
                "english": f"{symbol} dropped {percent_change}% today. Check if news driven or market wide."
            })

        # ── Alert 2: Big price rise today ────────────
        if percent_change >= PRICE_RISE_THRESHOLD:
            alerts.append({
                "type": "PRICE_RISE",
                "severity": "MEDIUM",
                "emoji": "🟢",
                "symbol": symbol,
                "message": f"{symbol} aaj {percent_change}% upar hai",
                "detail": f"Current: ₹{current_price} | Your P&L: {pnl_percent}%",
                "action": "Profit book karne ka sochein ya hold karein",
                "english": f"{symbol} rose {percent_change}% today. Consider partial profit booking."
            })

        # ── Alert 3: RSI oversold ────────────────────
        if indicators:
            rsi = indicators["indicators"]["rsi"]["value"]

            if rsi <= RSI_OVERSOLD_THRESHOLD:
                alerts.append({
                    "type": "RSI_OVERSOLD",
                    "severity": "MEDIUM",
                    "emoji": "📉",
                    "symbol": symbol,
                    "message": f"{symbol} ka RSI {rsi} hai — oversold zone",
                    "detail": f"RSI below 35 means stock may bounce back soon",
                    "action": "Average down karne ka consider karein",
                    "english": f"{symbol} RSI at {rsi} — oversold. Historical bounce zone."
                })

            # ── Alert 4: RSI overbought ──────────────
            if rsi >= RSI_OVERBOUGHT_THRESHOLD:
                alerts.append({
                    "type": "RSI_OVERBOUGHT",
                    "severity": "MEDIUM",
                    "emoji": "📈",
                    "symbol": symbol,
                    "message": f"{symbol} ka RSI {rsi} hai — overbought zone",
                    "detail": f"RSI above 70 means stock may pull back soon",
                    "action": "Partial profit book karne ka sochein",
                    "english": f"{symbol} RSI at {rsi} — overbought. Consider taking some profits."
                })

        # ── Alert 5: Heavy overall loss ──────────────
        if pnl_percent <= PNL_LOSS_THRESHOLD:
            alerts.append({
                "type": "HEAVY_LOSS",
                "severity": "HIGH",
                "emoji": "⚠️",
                "symbol": symbol,
                "message": f"{symbol} mein {pnl_percent}% ka loss hai",
                "detail": f"Invested: ₹{invested} | Current: ₹{current_value}",
                "action": "Review karo — hold ya cut loss decide karo",
                "english": f"{symbol} showing {pnl_percent}% loss. Review your thesis for holding."
            })

    except Exception as e:
        print(f"Error checking alerts for {symbol}: {e}")

    return alerts


# ── Check Full Portfolio ──────────────────────────────
def check_portfolio_alerts() -> dict:
    """
    Runs alert checks on your entire portfolio.
    Called by APScheduler every 5 minutes during market hours.

    Returns:
        Dictionary with all triggered alerts
    """
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

    # Separate by severity
    high_alerts   = [a for a in all_alerts if a["severity"] == "HIGH"]
    medium_alerts = [a for a in all_alerts if a["severity"] == "MEDIUM"]

    # Generate summary
    if high_alerts:
        summary = f"⚠️ {len(high_alerts)} urgent alerts need your attention!"
        hindi_summary = f"Aapke portfolio mein {len(high_alerts)} zaroori alerts hain!"
    elif medium_alerts:
        summary = f"📊 {len(medium_alerts)} portfolio updates available"
        hindi_summary = f"Aapke portfolio ke baare mein {len(medium_alerts)} updates hain"
    else:
        summary = "✅ Portfolio looks stable — no urgent alerts"
        hindi_summary = "Aapka portfolio theek hai — koi zaroori alert nahi"

    result = {
        "checked_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_alerts": len(all_alerts),
        "high_priority": len(high_alerts),
        "medium_priority": len(medium_alerts),
        "summary": summary,
        "hindi_summary": hindi_summary,
        "alerts": all_alerts
    }

    # Print to console so you can see in terminal
    if all_alerts:
        print(f"🚨 {len(all_alerts)} alerts triggered!")
        for alert in all_alerts:
            print(f"  {alert['emoji']} {alert['symbol']}: {alert['message']}")
    else:
        print("✅ No alerts triggered")

    return result


# ── Send Email Alert ──────────────────────────────────
def send_email_alert(alerts: list, recipient_email: str):
    """
    Sends email notification for triggered alerts.
    Uses Gmail SMTP — add credentials to .env file.

    Args:
        alerts: List of triggered alerts
        recipient_email: Email address to send to
    """
    if not alerts:
        return

    # Get email credentials from .env
    sender_email    = os.getenv("ALERT_EMAIL")
    sender_password = os.getenv("ALERT_EMAIL_PASSWORD")

    if not sender_email or not sender_password:
        print("Email credentials not configured in .env — skipping email")
        return

    try:
        # Build email content
        subject = f"StockSage Alert — {len(alerts)} portfolio alerts!"

        # HTML email body
        body = """
        <html>
        <body style="font-family: Arial; padding: 20px;">
        <h2 style="color: #1B3A6B;">📊 StockSage Portfolio Alert</h2>
        """

        for alert in alerts:
            color = "#FF4444" if alert["severity"] == "HIGH" else "#FF8C00"
            body += f"""
            <div style="border-left: 4px solid {color};
                        padding: 10px; margin: 10px 0;
                        background: #f9f9f9;">
                <h3>{alert['emoji']} {alert['symbol']} — {alert['type']}</h3>
                <p><b>Hindi:</b> {alert['message']}</p>
                <p><b>English:</b> {alert['english']}</p>
                <p><b>Action:</b> {alert['action']}</p>
                <p style="color: #666;">{alert['detail']}</p>
            </div>
            """

        body += """
        <p style="color: #666; font-size: 12px;">
        This alert was generated by StockSage AI —
        your personal investment manager.
        </p>
        </body></html>
        """

        # Create email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = sender_email
        msg["To"]      = recipient_email
        msg.attach(MIMEText(body, "html"))

        # Send via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())

        print(f"✅ Email alert sent to {recipient_email}")

    except Exception as e:
        print(f"Failed to send email: {e}")