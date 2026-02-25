-- Crear tabla de insumos
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT NOT NULL, -- metros, unidades, kilos, etc.
  precio_referencia DECIMAL(10, 2) DEFAULT 0,
  stock_actual DECIMAL(10, 2) DEFAULT 0,
  stock_minimo DECIMAL(10, 2) DEFAULT 0,
  imagen_url TEXT,
  categoria TEXT, -- telas, botones, hilos, cierres, etc.
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_insumos_nombre ON insumos(nombre);
CREATE INDEX idx_insumos_categoria ON insumos(categoria);
CREATE INDEX idx_insumos_activo ON insumos(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_insumos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_insumos_updated_at
  BEFORE UPDATE ON insumos
  FOR EACH ROW
  EXECUTE FUNCTION update_insumos_updated_at();
