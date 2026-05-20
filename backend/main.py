from fastapi import FastAPI
from backend.routes.stock import router as stock_router

app = FastAPI(
    title="StockSage API",
    description="AI-Powered Investment & Learning Platform for Indian Stock Market",
    version="1.0.0"
)

# Connect the stock router to the main app
app.include_router(stock_router)


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