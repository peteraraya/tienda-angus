-- Agregar campo cliente_id a la tabla ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Agregar campos de cliente para preservar información
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
ADD COLUMN IF NOT EXISTS cliente_telefono TEXT,
ADD COLUMN IF NOT EXISTS cliente_contacto TEXT;

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);

-- Comentarios
COMMENT ON COLUMN ventas.cliente_id IS 'Referencia al cliente que realizó la compra';
COMMENT ON COLUMN ventas.cliente_nombre IS 'Nombre del cliente al momento de la venta';
COMMENT ON COLUMN ventas.cliente_telefono IS 'Teléfono del cliente al momento de la venta';
COMMENT ON COLUMN ventas.cliente_contacto IS 'Contacto del cliente al momento de la venta';
