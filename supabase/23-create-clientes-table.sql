-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL, -- Email o nombre de contacto
  telefono TEXT NOT NULL,
  red_social TEXT, -- Instagram, Facebook, etc.
  direccion TEXT,
  notas TEXT, -- Notas adicionales sobre el cliente
  total_compras INTEGER DEFAULT 0, -- Total gastado histórico
  cantidad_compras INTEGER DEFAULT 0, -- Número de compras realizadas
  ultima_compra TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_contacto ON clientes(contacto);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_clientes_updated_at();

-- Comentarios
COMMENT ON TABLE clientes IS 'Registro de clientes para el sistema de ventas';
COMMENT ON COLUMN clientes.nombre IS 'Nombre completo del cliente (obligatorio)';
COMMENT ON COLUMN clientes.contacto IS 'Email o nombre de contacto (obligatorio)';
COMMENT ON COLUMN clientes.telefono IS 'Número de teléfono (obligatorio)';
COMMENT ON COLUMN clientes.red_social IS 'Usuario de red social (opcional)';
COMMENT ON COLUMN clientes.direccion IS 'Dirección de entrega (opcional)';
COMMENT ON COLUMN clientes.total_compras IS 'Total histórico de compras en pesos';
COMMENT ON COLUMN clientes.cantidad_compras IS 'Número total de compras realizadas';
