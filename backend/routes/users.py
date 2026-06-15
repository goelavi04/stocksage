from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.models.user import User
from backend.models.portfolio import Portfolio, SIP
from backend.persistence import save_db

router = APIRouter(prefix="/users", tags=["Users"])


class UserCreate(BaseModel):
    name: str
    photo: Optional[str] = None
    color: Optional[str] = "#3b82f6"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    photo: Optional[str] = None
    color: Optional[str] = None


def _fmt(u: User):
    return {"id": u.id, "name": u.name, "photo": u.photo, "color": u.color}


@router.get("/")
def list_users(db: Session = Depends(get_db)):
    return [_fmt(u) for u in db.query(User).all()]


@router.post("/")
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    user = User(name=body.name, photo=body.photo, color=body.color or "#3b82f6")
    db.add(user)
    db.commit()
    db.refresh(user)
    save_db()
    return _fmt(user)


@router.put("/{user_id}")
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.name is not None:
        user.name = body.name
    if body.photo is not None:
        user.photo = body.photo
    if body.color is not None:
        user.color = body.color
    db.commit()
    db.refresh(user)
    save_db()
    return _fmt(user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(Portfolio).filter(Portfolio.user_id == user_id).delete()
    db.query(SIP).filter(SIP.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    save_db()
    return {"message": f"{user.name}'s profile and portfolio deleted"}
