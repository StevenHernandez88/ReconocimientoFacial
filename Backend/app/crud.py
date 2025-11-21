# app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from . import model, schemas
from passlib.context import CryptContext
from typing import Optional, List
from uuid import UUID
import numpy as np

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[model.User]:
    return db.query(model.User).filter(model.User.email == email).first()

def get_user_by_id(db: Session, user_id: UUID) -> Optional[model.User]:
    return db.query(model.User).filter(model.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate) -> model.User:
    hashed_password = pwd_context.hash(user.password)
    db_user = model.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role,
        status='active',
        facial_data_registered=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[model.User]:
    return db.query(model.User).offset(skip).limit(limit).all()

def update_user_facial_status(db: Session, user_id: UUID, registered: bool):
    db.query(model.User).filter(model.User.id == user_id).update(
        {"facial_data_registered": registered}
    )
    db.commit()

# Laboratory CRUD
def create_laboratory(db: Session, lab: schemas.LaboratoryCreate) -> model.Laboratory:
    db_lab = model.Laboratory(**lab.dict())
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

def get_all_laboratories(db: Session) -> List[model.Laboratory]:
    return db.query(model.Laboratory).all()

def get_laboratory_by_id(db: Session, lab_id: UUID) -> Optional[model.Laboratory]:
    return db.query(model.Laboratory).filter(model.Laboratory.id == lab_id).first()

# Facial Embedding CRUD
def create_facial_embedding(
    db: Session,
    user_id: UUID,
    embedding: List[float],
    image_path: str
) -> model.FacialEmbedding:
    db_embedding = model.FacialEmbedding(
        user_id=user_id,
        embedding=embedding,
        image_path=image_path
    )
    db.add(db_embedding)
    db.commit()
    db.refresh(db_embedding)
    return db_embedding

def get_facial_embedding_by_user(db: Session, user_id: UUID) -> Optional[model.FacialEmbedding]:
    return db.query(model.FacialEmbedding).filter(
        model.FacialEmbedding.user_id == user_id
    ).first()

def get_all_facial_embeddings(db: Session) -> List[model.FacialEmbedding]:
    return db.query(model.FacialEmbedding).all()

# Lab Access Permission CRUD
def grant_lab_access(
    db: Session,
    user_id: UUID,
    lab_id: UUID,
    granted_by: UUID
) -> model.LabAccessPermission:
    db_permission = model.LabAccessPermission(
        user_id=user_id,
        laboratory_id=lab_id,
        granted_by=granted_by
    )
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def check_lab_access_permission(db: Session, user_id: UUID, lab_id: UUID) -> bool:
    permission = db.query(model.LabAccessPermission).filter(
        and_(
            model.LabAccessPermission.user_id == user_id,
            model.LabAccessPermission.laboratory_id == lab_id
        )
    ).first()
    return permission is not None

def get_user_lab_permissions(db: Session, user_id: UUID) -> List[model.LabAccessPermission]:
    return db.query(model.LabAccessPermission).filter(
        model.LabAccessPermission.user_id == user_id
    ).all()

# Access Log CRUD
def create_access_log(
    db: Session,
    user_id: UUID,
    lab_id: UUID,
    status: str,
    confidence: Optional[int] = None,
    reason: Optional[str] = None
) -> model.AccessLog:
    db_log = model.AccessLog(
        user_id=user_id,
        laboratory_id=lab_id,
        access_status=status,
        facial_match_confidence=confidence,
        reason_denied=reason
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_user_access_logs(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[model.AccessLog]:
    return db.query(model.AccessLog).filter(
        model.AccessLog.user_id == user_id
    ).order_by(model.AccessLog.access_time.desc()).offset(skip).limit(limit).all()

def get_all_access_logs(db: Session, skip: int = 0, limit: int = 100) -> List[model.AccessLog]:
    return db.query(model.AccessLog).order_by(
        model.AccessLog.access_time.desc()
    ).offset(skip).limit(limit).all()