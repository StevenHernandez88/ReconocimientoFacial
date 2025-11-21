# app/model.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, ARRAY, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default='active')
    facial_data_registered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    facial_embedding = relationship("FacialEmbedding", back_populates="user", uselist=False, cascade="all, delete-orphan")
    access_permissions = relationship("LabAccessPermission", back_populates="user", cascade="all, delete-orphan")
    access_logs = relationship("AccessLog", back_populates="user")


class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    access_permissions = relationship("LabAccessPermission", back_populates="laboratory", cascade="all, delete-orphan")
    access_logs = relationship("AccessLog", back_populates="laboratory")


class FacialEmbedding(Base):
    __tablename__ = "facial_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    embedding = Column(ARRAY(Float), nullable=False)
    image_path = Column(String(500))
    registered_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="facial_embedding")


class LabAccessPermission(Base):
    __tablename__ = "lab_access_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id", ondelete="CASCADE"), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Relaciones
    user = relationship("User", back_populates="access_permissions", foreign_keys=[user_id])
    laboratory = relationship("Laboratory", back_populates="access_permissions")


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    laboratory_id = Column(UUID(as_uuid=True), ForeignKey("laboratories.id"), nullable=False)
    access_time = Column(DateTime, default=datetime.utcnow, index=True)
    access_status = Column(String(50), nullable=False)
    facial_match_confidence = Column(Integer)
    reason_denied = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User", back_populates="access_logs")
    laboratory = relationship("Laboratory", back_populates="access_logs")