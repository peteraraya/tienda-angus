-- Crear tabla de colegios
CREATE TABLE IF NOT EXISTS colegios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  insignia_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar colegios iniciales
INSERT INTO colegios (nombre, insignia_url) VALUES
  ('Simón Bolívar', 'https://example.com/insignias/simon-bolivar.png'),
  ('San Miguel', 'https://example.com/insignias/san-miguel.png'),
  ('Liceo de Aplicación', 'https://example.com/insignias/liceo-aplicacion.png'),
  ('Instituto Nacional', 'https://example.com/insignias/instituto-nacional.png'),
  ('Carmela Carvajal', 'https://example.com/insignias/carmela-carvajal.png')
ON CONFLICT (nombre) DO NOTHING;

-- Renombrar columna color a colegio en variantes
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'variantes' AND column_name = 'color'
    ) THEN
        ALTER TABLE variantes RENAME COLUMN color TO colegio;
        RAISE NOTICE 'Columna color renombrada a colegio en variantes';
    END IF;
END $$;

-- Agregar columna insignia_url si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colegios' AND column_name = 'insignia_url'
    ) THEN
        ALTER TABLE colegios ADD COLUMN insignia_url TEXT;
        RAISE NOTICE 'Columna insignia_url agregada a colegios';
    END IF;
END $$;

-- Habilitar RLS en tabla colegios
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;

-- Políticas para colegios
-- Todos pueden ver colegios activos
CREATE POLICY "Colegios visibles para todos"
  ON colegios FOR SELECT
  USING (activo = true);

-- Solo usuarios autenticados pueden insertar
CREATE POLICY "Usuarios autenticados pueden insertar colegios"
  ON colegios FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Usuarios autenticados pueden actualizar colegios"
  ON colegios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Usuarios autenticados pueden eliminar colegios"
  ON colegios FOR DELETE
  TO authenticated
  USING (true);

-- Verificar estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('colegios', 'variantes')
ORDER BY table_name, ordinal_position;
