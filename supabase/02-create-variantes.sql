-- Crear tabla de variantes (tallas y colores con stock)
CREATE TABLE variantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
