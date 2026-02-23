-- Crear tabla de productos
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de variantes (tallas y colores con stock)
CREATE TABLE variantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes ENABLE ROW LEVEL SECURITY;

-- Políticas para productos
CREATE POLICY "Productos son visibles públicamente"
  ON productos FOR SELECT
  USING (true);

CREATE POLICY "Solo usuarios autenticados pueden insertar productos"
  ON productos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden actualizar productos"
  ON productos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden eliminar productos"
  ON productos FOR DELETE
  USING (auth.role() = 'authenticated');

-- Políticas para variantes
CREATE POLICY "Variantes son visibles públicamente"
  ON variantes FOR SELECT
  USING (true);

CREATE POLICY "Solo usuarios autenticados pueden insertar variantes"
  ON variantes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden actualizar variantes"
  ON variantes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden eliminar variantes"
  ON variantes FOR DELETE
  USING (auth.role() = 'authenticated');
