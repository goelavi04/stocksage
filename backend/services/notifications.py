import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
from dotenv import load_dotenv
from backend.database import SessionLocal
from backend.models.portfolio import Notification
from datetime import datetime

load_dotenv()


# ── Send WhatsApp via Twilio ──────────────────────────
def send_whatsapp(message: str) -> bool:
    """
    Sends WhatsApp message via Twilio.
    """
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token  = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_WHATSAPP_FROM")
        to_number   = os.getenv("TWILIO_WHATSAPP_TO")

        if not all([account_sid, auth_token, from_number, to_number]):
            print("Twilio credentials missing in .env")
            return False

        client = Client(account_sid, auth_token)

        msg = client.messages.create(
            from_=from_number,
            body=message,
            to=to_number
        )

        print(f"✅ WhatsApp sent: {msg.sid}")
        return True

    except Exception as e:
        print(f"WhatsApp send failed: {e}")
        return False


# ── Send Email via Gmail ──────────────────────────────
def send_email(subject: str, body_html: str) -> bool:
    """
    Sends email alert via Gmail SMTP.
    """
    try:
        sender_email    = os.getenv("ALERT_EMAIL")
        sender_password = os.getenv("ALERT_EMAIL_PASSWORD")
        recipient_email = os.getenv("ALERT_EMAIL")

        if not sender_email or not sender_password:
            print("Email credentials missing in .env")
            return False

        # Clean subject
        clean_subject = subject.encode("ascii", "ignore").decode("ascii")

        # Use simple plain text email approach
        # This avoids all encoding issues completely
        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["Subject"] = clean_subject
        msg["From"]    = sender_email
        msg["To"]      = recipient_email

        # Set HTML content directly
        msg.set_content("Please view this email in an HTML compatible client.")
        msg.add_alternative(body_html, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)

        print(f"✅ Email sent to {recipient_email}")
        return True

    except Exception as e:
        print(f"Email send failed: {e}")
        return False

# ── Save Notification to Database ────────────────────
def save_notification(alert: dict,
                      email_sent: bool = False,
                      whatsapp_sent: bool = False) -> Notification:
    """
    Saves a notification to the database permanently.
    This powers the in-app notification center.
    """
    db = SessionLocal()
    try:
        notification = Notification(
            symbol          = alert.get("symbol"),
            alert_type      = alert.get("type"),
            severity        = alert.get("severity"),
            message         = alert.get("message"),
            message_hindi   = alert.get("message"),
            message_english = alert.get("english"),
            action          = alert.get("action"),
            detail          = alert.get("detail"),
            email_sent      = email_sent,
            whatsapp_sent   = whatsapp_sent,
            is_read         = False
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)
        print(f"✅ Notification saved to DB: {alert.get('type')} for {alert.get('symbol')}")
        return notification

    except Exception as e:
        print(f"Failed to save to DB: {e}")
        db.rollback()

    finally:
        db.close()


# ── Clean Alert Text ──────────────────────────────────
def clean_alert(alert: dict) -> dict:
    """
    Removes all non-ASCII characters from alert text fields.
    Prevents SMTP encoding errors with rupee symbol etc.
    """
    cleaned = {}
    for key, value in alert.items():
        if isinstance(value, str):
            cleaned[key] = value.encode("ascii", "ignore").decode("ascii")
        else:
            cleaned[key] = value
    return cleaned


# ── Build WhatsApp Message ────────────────────────────
def build_whatsapp_message(alerts: list) -> str:
    """
    Builds a formatted WhatsApp message from alerts list.
    """
    if not alerts:
        return ""

    now = datetime.now().strftime("%d-%m-%Y %H:%M")

    message  = "StockSage Alert\n"
    message += f"Date: {now}\n"
    message += "-----------------\n\n"

    high_alerts   = [a for a in alerts if a["severity"] == "HIGH"]
    medium_alerts = [a for a in alerts if a["severity"] == "MEDIUM"]

    if high_alerts:
        message += "URGENT ALERTS\n\n"
        for alert in high_alerts:
            message += f"{alert['emoji']} {alert['symbol']}\n"
            message += f"{alert['message']}\n"
            message += f"{alert['detail']}\n"
            message += f"Action: {alert['action']}\n\n"

    if medium_alerts:
        message += "UPDATES\n\n"
        for alert in medium_alerts:
            message += f"{alert['emoji']} {alert['symbol']}\n"
            message += f"{alert['message']}\n"
            message += f"Action: {alert['action']}\n\n"

    message += "-----------------\n"
    message += "StockSage - Aapka Personal Investment Manager"

    return message


# ── Build Email HTML ──────────────────────────────────
def build_email_html(alerts: list) -> str:
    """
    Builds a formatted HTML email from alerts list.
    All text is pre-cleaned to ASCII before this function.
    """
    now = datetime.now().strftime("%d %b %Y, %I:%M %p")

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;
                 max-width: 600px;
                 margin: 0 auto;
                 padding: 20px;
                 background: #f5f5f5;">

        <div style="background: #1B3A6B;
                    padding: 20px;
                    border-radius: 10px 10px 0 0;
                    text-align: center;">
            <h1 style="color: white; margin: 0;">
                StockSage Alert
            </h1>
            <p style="color: #aaa; margin: 5px 0;">
                {now}
            </p>
        </div>

        <div style="background: white;
                    padding: 20px;
                    border-radius: 0 0 10px 10px;">
    """

    for alert in alerts:
        color = "#FF4444" if alert["severity"] == "HIGH" else "#FF8C00"
        bg    = "#FFF5F5" if alert["severity"] == "HIGH" else "#FFF8F0"

        html += f"""
        <div style="border-left: 5px solid {color};
                    background: {bg};
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 5px;">

            <h3 style="color: {color}; margin: 0 0 10px 0;">
                {alert['symbol']} - {alert['type']}
            </h3>

            <p style="margin: 5px 0;">
                <b>Hindi:</b> {alert['message']}
            </p>

            <p style="margin: 5px 0;">
                <b>English:</b> {alert['english']}
            </p>

            <p style="margin: 5px 0;
                      background: white;
                      padding: 8px;
                      border-radius: 3px;">
                {alert['detail']}
            </p>

            <p style="margin: 5px 0;
                      color: #2E6DB4;
                      font-weight: bold;">
                Action: {alert['action']}
            </p>
        </div>
        """

    html += """
        <p style="color: #999;
                  font-size: 12px;
                  text-align: center;
                  margin-top: 20px;">
            StockSage - Your Personal AI Investment Manager<br>
            This alert was automatically generated.
            Make investment decisions based on your own judgment.
        </p>
        </div>
    </body>
    </html>
    """

    return html


# ── Main Function — Send All Notifications ────────────
def send_all_notifications(alerts: list) -> dict:
    """
    Main notification function.
    Saves to DB, sends WhatsApp and Email for all alerts.
    """
    if not alerts:
        return {
            "notifications_saved": 0,
            "whatsapp_sent"      : False,
            "email_sent"         : False
        }

    # Send WhatsApp with original alerts (supports unicode)
    whatsapp_message = build_whatsapp_message(alerts)
    whatsapp_sent    = send_whatsapp(whatsapp_message)

    # Clean all alert text before building email
    clean_alerts = [clean_alert(a) for a in alerts]
    email_html   = build_email_html(clean_alerts)
    subject      = f"StockSage - {len(alerts)} Portfolio Alerts!"
    email_sent   = send_email(subject, email_html)

    # Save each alert to database
    saved_count = 0
    for alert in alerts:
        try:
            save_notification(
                alert         = alert,
                email_sent    = email_sent,
                whatsapp_sent = whatsapp_sent
            )
            saved_count += 1
        except Exception as e:
            print(f"Failed to save notification: {e}")

    print(f"Summary: {saved_count} saved, WhatsApp={whatsapp_sent}, Email={email_sent}")

    return {
        "notifications_saved": saved_count,
        "whatsapp_sent"      : whatsapp_sent,
        "email_sent"         : email_sent,
        "total_alerts"       : len(alerts)
    }