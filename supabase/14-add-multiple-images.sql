-- Agregar campos para múltiples imágenes
-- Renombrar imagen_url a imagenes y cambiar tipo a array de texto

ALTER TABLE productos 
ADD COLUMN imagenes TEXT[] DEFAULT '{}';

-- Migrar datos existentes de imagen_url a imagenes
UPDATE productos 
SET imagenes = ARRAY[imagen_url]
WHERE imagen_url IS NOT NULL AND imagen_url != '';

-- Opcional: eliminar la columna antigua después de verificar la migración
-- ALTER TABLE productos DROP COLUMN imagen_url;
