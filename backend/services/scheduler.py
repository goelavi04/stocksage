from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from backend.services.alerter import check_portfolio_alerts, is_market_open

# ── Global Scheduler Instance ─────────────────────────
scheduler = BackgroundScheduler()


def run_alert_check():
    """
    This function runs every 5 minutes.
    Only checks alerts during market hours.
    """
    if is_market_open():
        print(f"[{datetime.now().strftime('%H:%M')}] Market open — running alert check")
        results = check_portfolio_alerts()

        # Log results
        if results["total_alerts"] > 0:
            print(f"🚨 Alerts found: {results['total_alerts']}")
        else:
            print("✅ All clear")
    else:
        print(f"[{datetime.now().strftime('%H:%M')}] Market closed — skipping check")


def start_scheduler():
    """
    Starts the background scheduler.
    Called once when FastAPI server starts.
    """
    if not scheduler.running:
        # Run every 5 minutes
        scheduler.add_job(
            func=run_alert_check,
            trigger=IntervalTrigger(minutes=5),
            id="portfolio_alert_check",
            name="Portfolio Alert Check",
            replace_existing=True
        )
        scheduler.start()
        print("✅ Alert scheduler started — checking every 5 minutes during market hours")


def stop_scheduler():
    """
    Stops the scheduler cleanly.
    Called when FastAPI server shuts down.
    """
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped")