-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL, -- Nombre de contacto o email
  telefono TEXT NOT NULL,
  email TEXT,
  direccion TEXT,
  rut TEXT, -- RUT del proveedor (Chile)
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  total_pedidos INTEGER DEFAULT 0, -- Total histórico de pedidos
  cantidad_pedidos INTEGER DEFAULT 0, -- Número de pedidos realizados
  ultimo_pedido TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);
CREATE INDEX IF NOT EXISTS idx_proveedores_created_at ON proveedores(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_proveedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER trigger_update_proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_proveedores_updated_at();

-- Comentarios
COMMENT ON TABLE proveedores IS 'Registro de proveedores para gestión de compras';
COMMENT ON COLUMN proveedores.nombre IS 'Nombre del proveedor (obligatorio)';
COMMENT ON COLUMN proveedores.contacto IS 'Nombre de contacto o email (obligatorio)';
COMMENT ON COLUMN proveedores.telefono IS 'Número de teléfono (obligatorio)';
COMMENT ON COLUMN proveedores.rut IS 'RUT del proveedor (opcional)';
COMMENT ON COLUMN proveedores.activo IS 'Indica si el proveedor está activo';
COMMENT ON COLUMN proveedores.total_pedidos IS 'Total histórico de pedidos en pesos';
COMMENT ON COLUMN proveedores.cantidad_pedidos IS 'Número total de pedidos realizados';
