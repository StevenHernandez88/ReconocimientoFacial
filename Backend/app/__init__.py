# app/__init__.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import api_router
from .database import engine
from . import model

# Crear tablas (opcional si usas migraciones)
model.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Control de Acceso Facial",
    description="API para control de acceso a laboratorios con reconocimiento facial",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API de Control de Acceso Facial - v1.0.0"}