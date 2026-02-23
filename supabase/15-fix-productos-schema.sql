-- Script para corregir el esquema de la tabla productos
-- Eliminar columnas que no deberían existir en productos

-- Las columnas talla, color y stock solo deben estar en la tabla variantes
-- NO en la tabla productos

-- Verificar si existen columnas incorrectas y eliminarlas
DO $$ 
BEGIN
    -- Eliminar columna talla si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'talla'
    ) THEN
        ALTER TABLE productos DROP COLUMN talla;
        RAISE NOTICE 'Columna talla eliminada de productos';
    END IF;

    -- Eliminar columna color si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'color'
    ) THEN
        ALTER TABLE productos DROP COLUMN color;
        RAISE NOTICE 'Columna color eliminada de productos';
    END IF;

    -- Eliminar columna stock si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'stock'
    ) THEN
        ALTER TABLE productos DROP COLUMN stock;
        RAISE NOTICE 'Columna stock eliminada de productos';
    END IF;
END $$;

-- Verificar que la tabla productos tenga la estructura correcta
-- Columnas esperadas:
-- - id (UUID)
-- - nombre (TEXT)
-- - descripcion (TEXT)
-- - precio (DECIMAL o NUMERIC)
-- - categoria (TEXT)
-- - imagen_url (TEXT, nullable)
-- - imagenes (TEXT[], nullable)
-- - descuento_porcentaje (INTEGER, nullable)
-- - en_oferta (BOOLEAN, nullable)
-- - created_at (TIMESTAMP)

-- Agregar columnas faltantes si no existen
DO $$ 
BEGIN
    -- Agregar descuento_porcentaje si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'descuento_porcentaje'
    ) THEN
        ALTER TABLE productos ADD COLUMN descuento_porcentaje INTEGER DEFAULT 0;
        RAISE NOTICE 'Columna descuento_porcentaje agregada';
    END IF;

    -- Agregar en_oferta si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'en_oferta'
    ) THEN
        ALTER TABLE productos ADD COLUMN en_oferta BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna en_oferta agregada';
    END IF;

    -- Agregar imagenes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'imagenes'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagenes TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Columna imagenes agregada';
    END IF;
END $$;

-- Mostrar estructura final de la tabla productos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;
