from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.database import engine
from backend.models import portfolio as portfolio_models
from backend.routes.stock import router as stock_router
from backend.routes.portfolio import router as portfolio_router
from backend.routes.news import router as news_router
from backend.routes.alerts import router as alerts_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.chat import router as chat_router
from backend.routes.users import router as users_router
from backend.services.scheduler import start_scheduler, stop_scheduler
from backend.persistence import start_persistence, save_db
from backend.models.user import User  # noqa: F401 — registers model with Base
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting StockSage API...")
    start_persistence()
    portfolio_models.Base.metadata.create_all(bind=engine)
    _migrate()
    start_scheduler()
    yield
    stop_scheduler()
    save_db()
    print("StockSage API stopped")


def _migrate():
    with engine.connect() as conn:
        for tbl in ["portfolio", "sips"]:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN user_id INTEGER DEFAULT 1"))
                conn.commit()
                print(f"[migrate] Added user_id to {tbl}")
            except Exception:
                pass
        count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        if count == 0:
            conn.execute(text("INSERT INTO users (name, color) VALUES ('Me', '#3b82f6')"))
            conn.commit()
            print("[migrate] Created default user")

app = FastAPI(
    title="StockSage API",
    description="AI-Powered Investment & Learning Platform for Indian Stock Market",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS — allows frontend to call backend ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175",
        "https://stocksage-aviral-goels-projects-b3ad9f58.vercel.app",
        "https://stocksage-goelavi04-aviral-goels-projects-b3ad9f58.vercel.app",
        "https://goelavi04-stocksage-backend.hf.space",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(stock_router)
app.include_router(portfolio_router)
app.include_router(news_router)
app.include_router(alerts_router)
app.include_router(recommendations_router)
app.include_router(chat_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to StockSage API", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "StockSage Backend"}
