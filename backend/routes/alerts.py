from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.services.alerter import check_portfolio_alerts, is_market_open
from backend.services.notifications import send_all_notifications
from backend.database import get_db
from backend.models.portfolio import Notification

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts & Notifications"]
)


@router.get("/check")
def check_alerts():
    """
    Manually trigger alert check on your portfolio.
    Saves to DB and sends WhatsApp + Email if alerts found.
    Example: GET /alerts/check
    """
    results = check_portfolio_alerts()
    return results


@router.get("/market-status")
def market_status():
    """
    Check if Indian stock market is currently open.
    """
    import datetime
    open_status = is_market_open()
    now = datetime.datetime.now()

    return {
        "market_open" : open_status,
        "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "market_hours": "9:15 AM to 3:30 PM IST, Monday to Friday",
        "status"      : "🟢 Market is OPEN" if open_status else "🔴 Market is CLOSED"
    }


@router.get("/notifications")
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all saved notifications from database.
    This powers the in-app notification center.

    Example: GET /alerts/notifications
    Example: GET /alerts/notifications?unread_only=true
    """
    query = db.query(Notification).order_by(
        Notification.created_at.desc()
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.limit(50).all()

    unread_count = db.query(Notification).filter(
        Notification.is_read == False
    ).count()

    return {
        "unread_count"  : unread_count,
        "total"         : len(notifications),
        "notifications" : [
            {
                "id"             : n.id,
                "symbol"         : n.symbol,
                "alert_type"     : n.alert_type,
                "severity"       : n.severity,
                "message"        : n.message,
                "message_english": n.message_english,
                "action"         : n.action,
                "detail"         : n.detail,
                "is_read"        : n.is_read,
                "email_sent"     : n.email_sent,
                "whatsapp_sent"  : n.whatsapp_sent,
                "created_at"     : str(n.created_at)
            }
            for n in notifications
        ]
    }


@router.put("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    Called when user clicks on notification in the app.
    Example: PUT /alerts/notifications/1/read
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        return {"error": "Notification not found"}

    notification.is_read = True
    db.commit()

    return {"message": "Marked as read", "id": notification_id}


@router.put("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    """
    Mark ALL notifications as read.
    Called when user clicks 'Mark all as read' in the app.
    """
    db.query(Notification).filter(
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()

    return {"message": "All notifications marked as read"}


@router.delete("/notifications/clear")
def clear_notifications(db: Session = Depends(get_db)):
    """
    Delete all notifications from database.
    """
    db.query(Notification).delete()
    db.commit()

    return {"message": "All notifications cleared"}