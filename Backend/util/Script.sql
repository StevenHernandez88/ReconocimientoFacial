-- database_schema.sql
-- Script para crear la base de datos sin dependencia de pgvector

-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    facial_data_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de laboratorios
CREATE TABLE laboratories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de embeddings faciales
-- Usamos FLOAT8[] (array de doubles) en lugar de VECTOR
CREATE TABLE facial_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    embedding FLOAT8[] NOT NULL, -- Array de 128 floats para el encoding facial
    image_path VARCHAR(500), -- Ruta local de la imagen
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabla de permisos de acceso a laboratorios
CREATE TABLE lab_access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    laboratory_id UUID NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, laboratory_id)
);

-- Tabla de logs de acceso
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    laboratory_id UUID NOT NULL REFERENCES laboratories(id),
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_status VARCHAR(50) NOT NULL CHECK (access_status IN ('granted', 'denied')),
    facial_match_confidence INTEGER,
    reason_denied TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_facial_embeddings_user ON facial_embeddings(user_id);
CREATE INDEX idx_lab_permissions_user ON lab_access_permissions(user_id);
CREATE INDEX idx_lab_permissions_lab ON lab_access_permissions(laboratory_id);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_lab ON access_logs(laboratory_id);
CREATE INDEX idx_access_logs_time ON access_logs(access_time DESC);
CREATE INDEX idx_access_logs_status ON access_logs(access_status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_laboratories_updated_at 
    BEFORE UPDATE ON laboratories
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facial_embeddings_updated_at 
    BEFORE UPDATE ON facial_embeddings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Datos de prueba
-- Contraseña para todos: "password123"
INSERT INTO users (email, full_name, hashed_password, role, status) VALUES
('admin@udal.edu.co', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3NJrjJF.K2', 'admin', 'active'),
('student1@udal.edu.co', 'Juan García', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3NJrjJF.K2', 'student', 'active'),
('student2@udal.edu.co', 'María López', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3NJrjJF.K2', 'student', 'active'),
('instructor@udal.edu.co', 'Prof. Carlos Ruiz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3NJrjJF.K2', 'instructor', 'active'),
('student3@udal.edu.co', 'Ana Martínez', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3NJrjJF.K2', 'student', 'active');

INSERT INTO laboratories (name, location, capacity) VALUES
('Lab A - Electronics', 'Building 2, Floor 3', 30),
('Lab B - Programming', 'Building 1, Floor 2', 25),
('Lab C - Robotics', 'Building 3, Floor 1', 20),
('Lab D - Networks', 'Building 2, Floor 1', 35);

-- Asignar permisos de acceso de ejemplo
-- Los estudiantes tienen acceso a Labs A y B
INSERT INTO lab_access_permissions (user_id, laboratory_id, granted_by)
SELECT 
    u.id, 
    l.id, 
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u
CROSS JOIN laboratories l
WHERE u.email IN ('student1@udal.edu.co', 'student2@udal.edu.co')
AND l.name IN ('Lab A - Electronics', 'Lab B - Programming');

-- El instructor tiene acceso a todos los laboratorios
INSERT INTO lab_access_permissions (user_id, laboratory_id, granted_by)
SELECT 
    u.id, 
    l.id, 
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u
CROSS JOIN laboratories l
WHERE u.email = 'instructor@udal.edu.co';

-- Insertar algunos logs de ejemplo
INSERT INTO access_logs (user_id, laboratory_id, access_status, facial_match_confidence, access_time)
SELECT 
    (SELECT id FROM users WHERE email = 'student1@udal.edu.co'),
    (SELECT id FROM laboratories WHERE name = 'Lab A - Electronics'),
    'granted',
    95,
    CURRENT_TIMESTAMP - INTERVAL '2 hours';

INSERT INTO access_logs (user_id, laboratory_id, access_status, facial_match_confidence, access_time)
SELECT 
    (SELECT id FROM users WHERE email = 'student2@udal.edu.co'),
    (SELECT id FROM laboratories WHERE name = 'Lab B - Programming'),
    'granted',
    92,
    CURRENT_TIMESTAMP - INTERVAL '1 hour';

INSERT INTO access_logs (user_id, laboratory_id, access_status, reason_denied, access_time)
SELECT 
    (SELECT id FROM users WHERE email = 'student3@udal.edu.co'),
    (SELECT id FROM laboratories WHERE name = 'Lab C - Robotics'),
    'denied',
    'No tiene permisos para este laboratorio',
    CURRENT_TIMESTAMP - INTERVAL '30 minutes';

-- Mostrar resumen de la configuración
SELECT 'Base de datos creada exitosamente' AS status;
SELECT COUNT(*) AS total_usuarios FROM users;
SELECT COUNT(*) AS total_laboratorios FROM laboratories;
SELECT COUNT(*) AS total_permisos FROM lab_access_permissions;
SELECT COUNT(*) AS total_logs FROM access_logs;