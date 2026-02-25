-- Modificar pedido_items para soportar insumos en lugar de productos
-- Agregar columnas para insumos
ALTER TABLE pedido_items 
  ADD COLUMN IF NOT EXISTS insumo_id UUID REFERENCES insumos(id),
  ADD COLUMN IF NOT EXISTS insumo_nombre TEXT,
  ADD COLUMN IF NOT EXISTS unidad_medida TEXT;

-- Hacer opcionales las columnas de productos (para compatibilidad)
ALTER TABLE pedido_items 
  ALTER COLUMN producto_id DROP NOT NULL,
  ALTER COLUMN producto_nombre DROP NOT NULL;

-- Índice para búsqueda por insumo
CREATE INDEX IF NOT EXISTS idx_pedido_items_insumo_id ON pedido_items(insumo_id);
