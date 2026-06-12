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
from backend.services.scheduler import start_scheduler, stop_scheduler

portfolio_models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting StockSage API...")
    start_scheduler()
    yield
    stop_scheduler()
    print("StockSage API stopped")

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
        "https://frontend-aviral-goels-projects-b3ad9f58.vercel.app",
        "https://frontend-goelavi04-aviral-goels-projects-b3ad9f58.vercel.app",
        "https://frontend-six-xi-f7e07uync5.vercel.app",
        "https://goelavi04-stocksage-backend.hf.space",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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