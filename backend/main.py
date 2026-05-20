from fastapi import FastAPI

# Create the FastAPI application instance
app = FastAPI(
    title="StockSage API",
    description="AI-Powered Investment & Learning Platform for Indian Stock Market",
    version="1.0.0"
)

# Root endpoint — the "hello world" of our API
@app.get("/")
def read_root():
    return {
        "message": "Welcome to StockSage API",
        "status": "running",
        "version": "1.0.0"
    }

# Health check endpoint — used to verify the server is alive
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "StockSage Backend"
    }