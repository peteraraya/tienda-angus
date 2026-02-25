-- Tabla de pedidos (órdenes de compra)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  proveedor_nombre TEXT NOT NULL, -- Guardamos el nombre por si el proveedor se elimina
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_esperada TIMESTAMP WITH TIME ZONE, -- Fecha estimada de entrega
  fecha_recepcion TIMESTAMP WITH TIME ZONE, -- Fecha real de recepción
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, recibido, cancelado
  total INTEGER NOT NULL, -- Total del pedido en pesos
  cantidad_items INTEGER NOT NULL, -- Cantidad total de items
  notas TEXT,
  usuario TEXT, -- Email o nombre del admin que creó el pedido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para validar estados
  CONSTRAINT pedidos_estado_check CHECK (estado IN ('pendiente', 'recibido', 'cancelado'))
);

-- Tabla de items de pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id), -- Puede ser NULL si es un producto nuevo
  variante_id UUID REFERENCES variantes(id), -- Puede ser NULL si es un producto nuevo
  producto_nombre TEXT NOT NULL,
  talla TEXT,
  colegio TEXT,
  cantidad INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL, -- Precio de compra al proveedor
  subtotal INTEGER NOT NULL, -- precio_unitario * cantidad
  recibido BOOLEAN DEFAULT false, -- Indica si este item fue recibido
  cantidad_recibida INTEGER DEFAULT 0, -- Cantidad realmente recibida
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor_id ON pedidos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id ON pedido_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_variante_id ON pedido_items(variante_id);

-- Función para actualizar updated_at en pedidos
CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_pedidos_updated_at();

-- Comentarios
COMMENT ON TABLE pedidos IS 'Órdenes de compra a proveedores';
COMMENT ON TABLE pedido_items IS 'Detalle de productos en cada pedido';
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: pendiente, recibido, cancelado';
COMMENT ON COLUMN pedidos.fecha_esperada IS 'Fecha estimada de entrega';
COMMENT ON COLUMN pedidos.fecha_recepcion IS 'Fecha real en que se recibió el pedido';
COMMENT ON COLUMN pedido_items.recibido IS 'Indica si el item fue recibido';
COMMENT ON COLUMN pedido_items.cantidad_recibida IS 'Cantidad realmente recibida (puede diferir de la pedida)';
