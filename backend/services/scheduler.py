from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from backend.services.alerter import check_portfolio_alerts, is_market_open

scheduler = BackgroundScheduler()


def run_alert_check():
    """
    Runs every 3 hours during market hours.
    Checks portfolio alerts and sends WhatsApp + Email if triggered.
    """
    if is_market_open():
        print(f"[{datetime.now().strftime('%H:%M')}] Market open — running alert check")
        results = check_portfolio_alerts()
        if results["total_alerts"] > 0:
            print(f"🚨 Alerts found: {results['total_alerts']}")
        else:
            print("✅ All clear — no alerts")
    else:
        print(f"[{datetime.now().strftime('%H:%M')}] Market closed — skipping check")


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            func=run_alert_check,
            trigger=IntervalTrigger(hours=3),
            id="portfolio_alert_check",
            name="Portfolio Alert Check",
            replace_existing=True
        )
        scheduler.start()
        print("✅ Alert scheduler started — checking every 3 hours during market hours")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped")