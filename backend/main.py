from fastapi import FastAPI
from backend.database import engine
from backend.models import portfolio as portfolio_models
from backend.routes.stock import router as stock_router
from backend.routes.portfolio import router as portfolio_router

# Create all database tables on startup
portfolio_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StockSage API",
    description="AI-Powered Investment & Learning Platform for Indian Stock Market",
    version="1.0.0"
)

# Connect routers
app.include_router(stock_router)
app.include_router(portfolio_router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to StockSage API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "StockSage Backend"
    }