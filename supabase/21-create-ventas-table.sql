-- Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total INTEGER NOT NULL, -- Total en pesos chilenos
  subtotal INTEGER NOT NULL,
  descuento_total INTEGER DEFAULT 0,
  cantidad_items INTEGER NOT NULL,
  notas TEXT,
  vendedor TEXT, -- Email o nombre del admin que realizó la venta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de venta (items individuales)
CREATE TABLE IF NOT EXISTS venta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  variante_id UUID NOT NULL REFERENCES variantes(id),
  producto_nombre TEXT NOT NULL, -- Guardamos el nombre por si el producto se elimina
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL, -- Precio al momento de la venta
  descuento_porcentaje INTEGER DEFAULT 0,
  precio_final INTEGER NOT NULL, -- Precio después del descuento
  cantidad INTEGER NOT NULL,
  subtotal INTEGER NOT NULL, -- precio_final * cantidad
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_variante_id ON venta_items(variante_id);

-- Comentarios
COMMENT ON TABLE ventas IS 'Registro de ventas realizadas por administradores';
COMMENT ON TABLE venta_items IS 'Detalle de productos vendidos en cada venta';
COMMENT ON COLUMN ventas.total IS 'Total de la venta en pesos chilenos';
COMMENT ON COLUMN venta_items.precio_unitario IS 'Precio original del producto al momento de la venta';
COMMENT ON COLUMN venta_items.precio_final IS 'Precio después de aplicar descuento';
