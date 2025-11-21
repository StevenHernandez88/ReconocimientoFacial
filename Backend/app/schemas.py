# app/schemas.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['student', 'instructor', 'admin']:
            raise ValueError('Role must be student, instructor, or admin')
        return v

class UserResponse(UserBase):
    id: UUID
    status: str
    facial_data_registered: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Laboratory Schemas
class LaboratoryBase(BaseModel):
    name: str
    location: str
    capacity: int

class LaboratoryCreate(LaboratoryBase):
    pass

class LaboratoryResponse(LaboratoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Facial Recognition Schemas
class FaceRegisterResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[UUID] = None

class FaceVerifyResponse(BaseModel):
    success: bool
    match_found: bool
    user: Optional[UserResponse] = None
    confidence: Optional[int] = None
    message: str

class AccessCheckResponse(BaseModel):
    status: str
    confidence: Optional[int] = None
    message: str
    reason: Optional[str] = None

# Access Log Schemas
class AccessLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    laboratory_id: UUID
    laboratory_name: str
    access_time: datetime
    access_status: str
    facial_match_confidence: Optional[int]
    reason_denied: Optional[str]

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None