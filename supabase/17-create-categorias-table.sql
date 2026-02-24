-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Pantalones', 'Pantalones escolares y deportivos'),
  ('Camisas', 'Camisas y blusas escolares'),
  ('Buzos', 'Buzos y chaquetas'),
  ('Poleras', 'Poleras y polos'),
  ('Faldas', 'Faldas escolares'),
  ('Chalecos', 'Chalecos y sweaters'),
  ('Accesorios', 'Corbatas, cinturones y otros')
ON CONFLICT (nombre) DO NOTHING;

-- Habilitar RLS en tabla categorias
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
-- Todos pueden ver categorías activas
CREATE POLICY "Categorias visibles para todos"
  ON categorias FOR SELECT
  USING (activo = true);

-- Solo usuarios autenticados pueden insertar
CREATE POLICY "Usuarios autenticados pueden insertar categorias"
  ON categorias FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Usuarios autenticados pueden actualizar categorias"
  ON categorias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Solo usuarios autenticados pueden eliminar
CREATE POLICY "Usuarios autenticados pueden eliminar categorias"
  ON categorias FOR DELETE
  TO authenticated
  USING (true);

-- Verificar estructura
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'categorias'
ORDER BY ordinal_position;
