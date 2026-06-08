from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ── Database Configuration ────────────────────────────
# SQLite stores everything in a single file — stocksage.db
# This file will be created automatically in your project folder
DATABASE_URL = "sqlite:///./stocksage.db"

# ── Create Engine ─────────────────────────────────────
# Engine = the connection between Python and the database
# check_same_thread=False needed for SQLite with FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# ── Session Factory ───────────────────────────────────
# A session = one conversation with the database
# Like opening a notebook, writing, then closing it
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ── Base Class ────────────────────────────────────────
# All our database models (tables) inherit from this
Base = declarative_base()


# ── Dependency ────────────────────────────────────────
# FastAPI calls this to get a database session
# for each request, then closes it when done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()