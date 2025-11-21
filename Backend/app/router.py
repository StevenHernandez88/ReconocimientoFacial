# app/router.py
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import face_recognition
import numpy as np
from PIL import Image
import io
import os
from pathlib import Path

from . import crud, schemas, model
from .database import get_db

api_router = APIRouter()

# Directorio para guardar imágenes
UPLOAD_DIR = Path("uploads/facial_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def extract_face_encoding(image_bytes: bytes) -> np.ndarray:
    """Extrae el encoding facial de una imagen"""
    try:
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        face_locations = face_recognition.face_locations(image)
        
        if len(face_locations) == 0:
            raise ValueError("No se detectó ningún rostro en la imagen")
        
        if len(face_locations) > 1:
            raise ValueError("Se detectaron múltiples rostros. Por favor, usa una imagen con un solo rostro")
        
        face_encodings = face_recognition.face_encodings(image, face_locations)
        return face_encodings[0]
    except Exception as e:
        raise ValueError(f"Error al procesar la imagen: {str(e)}")

def save_image(image_bytes: bytes, user_id: UUID) -> str:
    """Guarda la imagen en el sistema de archivos"""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        filename = f"{user_id}.jpg"
        filepath = UPLOAD_DIR / filename
        image.save(filepath, "JPEG", quality=95)
        return str(filepath)
    except Exception as e:
        raise ValueError(f"Error al guardar la imagen: {str(e)}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado"
        )
    return crud.create_user(db=db, user=user)

@api_router.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login con email y contraseña"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    if db_user.status != 'active':
        raise HTTPException(
            status_code=403,
            detail="Usuario inactivo"
        )
    
    return {
        "success": True,
        "user": schemas.UserResponse.from_orm(db_user),
        "message": "Login exitoso"
    }

# ==================== FACIAL RECOGNITION ENDPOINTS ====================

@api_router.post("/face/register", response_model=schemas.FaceRegisterResponse)
async def register_face(
    user_id: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Registrar el rostro de un usuario"""
    try:
        # Verificar que el usuario existe
        user_uuid = UUID(user_id)
        db_user = crud.get_user_by_id(db, user_uuid)
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar si ya tiene datos faciales registrados
        existing_embedding = crud.get_facial_embedding_by_user(db, user_uuid)
        if existing_embedding:
            raise HTTPException(
                status_code=400,
                detail="Este usuario ya tiene datos faciales registrados"
            )
        
        # Leer la imagen
        image_bytes = await image.read()
        
        # Extraer encoding facial
        encoding = extract_face_encoding(image_bytes)
        
        # Guardar imagen en disco
        image_path = save_image(image_bytes, user_uuid)
        
        # Guardar embedding en base de datos
        encoding_list = encoding.tolist()
        crud.create_facial_embedding(
            db=db,
            user_id=user_uuid,
            embedding=encoding_list,
            image_path=image_path
        )
        
        # Actualizar estado del usuario
        crud.update_user_facial_status(db, user_uuid, True)
        
        return schemas.FaceRegisterResponse(
            success=True,
            message="Rostro registrado exitosamente",
            user_id=user_uuid
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar rostro: {str(e)}")

@api_router.post("/face/verify", response_model=schemas.FaceVerifyResponse)
async def verify_face(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verificar un rostro contra la base de datos"""
    try:
        # Leer la imagen
        image_bytes = await image.read()
        
        # Extraer encoding del rostro a verificar
        unknown_encoding = extract_face_encoding(image_bytes)
        
        # Obtener todos los encodings de la base de datos
        all_embeddings = crud.get_all_facial_embeddings(db)
        
        if not all_embeddings:
            return schemas.FaceVerifyResponse(
                success=True,
                match_found=False,
                message="No hay rostros registrados en el sistema"
            )
        
        best_match = None
        best_distance = float('inf')
        threshold = 0.6  # Umbral de distancia (menor = más estricto)
        
        for embedding_record in all_embeddings:
            stored_encoding = np.array(embedding_record.embedding)
            
            # Calcular distancia facial
            distance = face_recognition.face_distance([stored_encoding], unknown_encoding)[0]
            
            if distance < threshold and distance < best_distance:
                best_distance = distance
                best_match = embedding_record
        
        if best_match:
            # Calcular confianza (inversa de la distancia, normalizada a porcentaje)
            confidence = int((1 - best_distance) * 100)
            
            user = crud.get_user_by_id(db, best_match.user_id)
            
            return schemas.FaceVerifyResponse(
                success=True,
                match_found=True,
                user=schemas.UserResponse.from_orm(user),
                confidence=confidence,
                message="Rostro verificado exitosamente"
            )
        else:
            return schemas.FaceVerifyResponse(
                success=True,
                match_found=False,
                message="No se encontró coincidencia facial"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar rostro: {str(e)}")

@api_router.post("/face/check-lab-access", response_model=schemas.AccessCheckResponse)
async def check_lab_access(
    user_id: str = Form(...),
    lab_id: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Verificar acceso a un laboratorio con reconocimiento facial"""
    try:
        user_uuid = UUID(user_id)
        lab_uuid = UUID(lab_id)
        
        # Verificar que el usuario existe
        db_user = crud.get_user_by_id(db, user_uuid)
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que el laboratorio existe
        db_lab = crud.get_laboratory_by_id(db, lab_uuid)
        if not db_lab:
            raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
        
        # Leer la imagen
        image_bytes = await image.read()
        unknown_encoding = extract_face_encoding(image_bytes)
        
        # Obtener embedding del usuario específico
        user_embedding = crud.get_facial_embedding_by_user(db, user_uuid)
        
        if not user_embedding:
            crud.create_access_log(
                db=db,
                user_id=user_uuid,
                lab_id=lab_uuid,
                status="denied",
                reason="Usuario no tiene datos faciales registrados"
            )
            return schemas.AccessCheckResponse(
                status="denied",
                message="Acceso denegado",
                reason="Usuario no tiene datos faciales registrados"
            )
        
        stored_encoding = np.array(user_embedding.embedding)
        distance = face_recognition.face_distance([stored_encoding], unknown_encoding)[0]
        
        if distance < 0.6:  # Match encontrado
            confidence = int((1 - distance) * 100)
            
            # Verificar permisos de acceso al laboratorio
            has_permission = crud.check_lab_access_permission(db, user_uuid, lab_uuid)
            
            if has_permission:
                # Registrar acceso exitoso
                crud.create_access_log(
                    db=db,
                    user_id=user_uuid,
                    lab_id=lab_uuid,
                    status="granted",
                    confidence=confidence
                )
                
                return schemas.AccessCheckResponse(
                    status="granted",
                    confidence=confidence,
                    message="Acceso concedido"
                )
            else:
                # Registrar acceso denegado por permisos
                crud.create_access_log(
                    db=db,
                    user_id=user_uuid,
                    lab_id=lab_uuid,
                    status="denied",
                    confidence=confidence,
                    reason="No tiene permisos para este laboratorio"
                )
                
                return schemas.AccessCheckResponse(
                    status="denied",
                    confidence=confidence,
                    message="Acceso denegado",
                    reason="No tiene permisos para este laboratorio"
                )
        else:
            # Verificación facial fallida
            crud.create_access_log(
                db=db,
                user_id=user_uuid,
                lab_id=lab_uuid,
                status="denied",
                reason="La verificación facial no coincide"
            )
            
            return schemas.AccessCheckResponse(
                status="denied",
                message="Acceso denegado",
                reason="La verificación facial no coincide"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar acceso: {str(e)}")

# ==================== USER ENDPOINTS ====================

@api_router.get("/users", response_model=List[schemas.UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de usuarios"""
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return users

@api_router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener información de un usuario"""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# ==================== LABORATORY ENDPOINTS ====================

@api_router.post("/laboratories", response_model=schemas.LaboratoryResponse)
def create_lab(lab: schemas.LaboratoryCreate, db: Session = Depends(get_db)):
    """Crear un nuevo laboratorio"""
    return crud.create_laboratory(db=db, lab=lab)

@api_router.get("/laboratories", response_model=List[schemas.LaboratoryResponse])
def get_laboratories(db: Session = Depends(get_db)):
    """Obtener lista de laboratorios"""
    return crud.get_all_laboratories(db)

@api_router.get("/laboratories/{lab_id}", response_model=schemas.LaboratoryResponse)
def get_laboratory(lab_id: UUID, db: Session = Depends(get_db)):
    """Obtener información de un laboratorio"""
    lab = crud.get_laboratory_by_id(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
    return lab

# ==================== ACCESS PERMISSION ENDPOINTS ====================

@api_router.post("/permissions/grant")
def grant_access(
    user_id: UUID,
    lab_id: UUID,
    granted_by: UUID,
    db: Session = Depends(get_db)
):
    """Otorgar permiso de acceso a un laboratorio"""
    # Verificar que el usuario existe
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar que el laboratorio existe
    lab = crud.get_laboratory_by_id(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratorio no encontrado")
    
    # Verificar si ya tiene permiso
    if crud.check_lab_access_permission(db, user_id, lab_id):
        raise HTTPException(status_code=400, detail="El usuario ya tiene permiso para este laboratorio")
    
    permission = crud.grant_lab_access(db, user_id, lab_id, granted_by)
    
    return {
        "success": True,
        "message": "Permiso otorgado exitosamente",
        "permission_id": permission.id
    }

@api_router.get("/permissions/user/{user_id}")
def get_user_permissions(user_id: UUID, db: Session = Depends(get_db)):
    """Obtener permisos de acceso de un usuario"""
    permissions = crud.get_user_lab_permissions(db, user_id)
    
    result = []
    for perm in permissions:
        lab = crud.get_laboratory_by_id(db, perm.laboratory_id)
        result.append({
            "permission_id": perm.id,
            "laboratory_id": perm.laboratory_id,
            "laboratory_name": lab.name,
            "laboratory_location": lab.location,
            "granted_at": perm.granted_at
        })
    
    return result

# ==================== ACCESS LOG ENDPOINTS ====================

@api_router.get("/logs/user/{user_id}", response_model=List[schemas.AccessLogResponse])
def get_user_logs(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener logs de acceso de un usuario"""
    logs = crud.get_user_access_logs(db, user_id, skip, limit)
    
    result = []
    for log in logs:
        lab = crud.get_laboratory_by_id(db, log.laboratory_id)
        result.append(schemas.AccessLogResponse(
            id=log.id,
            user_id=log.user_id,
            laboratory_id=log.laboratory_id,
            laboratory_name=lab.name if lab else "Unknown",
            access_time=log.access_time,
            access_status=log.access_status,
            facial_match_confidence=log.facial_match_confidence,
            reason_denied=log.reason_denied
        ))
    
    return result

@api_router.get("/logs", response_model=List[schemas.AccessLogResponse])
def get_all_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener todos los logs de acceso (admin)"""
    logs = crud.get_all_access_logs(db, skip, limit)
    
    result = []
    for log in logs:
        lab = crud.get_laboratory_by_id(db, log.laboratory_id)
        result.append(schemas.AccessLogResponse(
            id=log.id,
            user_id=log.user_id,
            laboratory_id=log.laboratory_id,
            laboratory_name=lab.name if lab else "Unknown",
            access_time=log.access_time,
            access_status=log.access_status,
            facial_match_confidence=log.facial_match_confidence,
            reason_denied=log.reason_denied
        ))
    
    return result

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
def health_check():
    """Verificar el estado de la API"""
    return {
        "status": "healthy",
        "message": "API funcionando correctamente"
    }