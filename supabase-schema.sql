-- ============================================================================
-- SCHEMA CANÓNICO — confecciones-angus
-- ============================================================================
-- Archivo consolidado a partir de supabase/*.sql y supabase/migrations/*.sql.
-- Para instalar desde cero, ejecutar este archivo y luego
-- supabase/34-idempotent-admin-operations.sql para índices y funciones RPC.
--
-- Se ejecuta de forma idempotente sobre una base vacía (CREATE TABLE IF NOT
-- EXISTS). Para bases existentes, usa los archivos numerados en orden.
--
-- Las tablas de administración usan políticas RLS para usuarios autenticados.
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- TABLAS
-- ============================================================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT,
  imagenes TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  descuento_porcentaje INTEGER DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  en_oferta BOOLEAN DEFAULT FALSE,
  notas TEXT,
  idempotency_key UUID UNIQUE,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes (tallas y colegios con stock)
CREATE TABLE IF NOT EXISTS variantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  precio NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de colegios
CREATE TABLE IF NOT EXISTS colegios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  insignia_url TEXT,
  activo BOOLEAN DEFAULT true,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  telefono TEXT NOT NULL,
  red_social TEXT,
  direccion TEXT,
  notas TEXT,
  total_compras INTEGER DEFAULT 0,
  cantidad_compras INTEGER DEFAULT 0,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  descuento_total INTEGER DEFAULT 0,
  cantidad_items INTEGER NOT NULL,
  notas TEXT,
  vendedor TEXT,
  cliente_id UUID REFERENCES clientes(id),
  cliente_nombre TEXT,
  cliente_telefono TEXT,
  cliente_contacto TEXT,
  idempotency_key UUID UNIQUE,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de venta (items individuales)
CREATE TABLE IF NOT EXISTS venta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  variante_id UUID NOT NULL REFERENCES variantes(id),
  producto_nombre TEXT NOT NULL,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL,
  descuento_porcentaje INTEGER DEFAULT 0,
  precio_final INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  direccion TEXT,
  rut TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  total_pedidos INTEGER DEFAULT 0,
  cantidad_pedidos INTEGER DEFAULT 0,
  ultimo_pedido TIMESTAMP WITH TIME ZONE,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos (órdenes de compra)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  proveedor_nombre TEXT NOT NULL,
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_esperada TIMESTAMP WITH TIME ZONE,
  fecha_recepcion TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  total INTEGER NOT NULL,
  cantidad_items INTEGER NOT NULL,
  notas TEXT,
  usuario TEXT,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pedidos_estado_check CHECK (estado IN ('pendiente', 'recibido', 'cancelado'))
);

-- Tabla de items de pedido (soporta productos e insumos)
CREATE TABLE IF NOT EXISTS pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  variante_id UUID REFERENCES variantes(id),
  producto_nombre TEXT,
  talla TEXT,
  colegio TEXT,
  cantidad INTEGER NOT NULL,
  precio_unitario INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  recibido BOOLEAN DEFAULT false,
  cantidad_recibida INTEGER DEFAULT 0,
  insumo_id UUID,
  insumo_nombre TEXT,
  unidad_medida TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de insumos
CREATE TABLE IF NOT EXISTS insumos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida TEXT NOT NULL,
  precio_referencia DECIMAL(10, 2) DEFAULT 0,
  stock_actual DECIMAL(10, 2) DEFAULT 0,
  stock_minimo DECIMAL(10, 2) DEFAULT 0,
  imagen_url TEXT,
  categoria TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  idempotency_key UUID,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pedido_items_insumo_id_fkey'
      AND conrelid = 'pedido_items'::regclass
  ) THEN
    ALTER TABLE pedido_items
      ADD CONSTRAINT pedido_items_insumo_id_fkey
      FOREIGN KEY (insumo_id) REFERENCES insumos(id);
  END IF;
END;
$$;

-- Tabla de mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  from_number TEXT,
  to_number TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  message_body TEXT,
  media_url TEXT,
  media_id TEXT,
  timestamp TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent',
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de plantillas de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'APPROVED',
  components JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================
INSERT INTO colegios (nombre, insignia_url) VALUES
  ('Simón Bolívar', 'https://example.com/insignias/simon-bolivar.png'),
  ('San Miguel', 'https://example.com/insignias/san-miguel.png'),
  ('Liceo de Aplicación', 'https://example.com/insignias/liceo-aplicacion.png'),
  ('Instituto Nacional', 'https://example.com/insignias/instituto-nacional.png'),
  ('Carmela Carvajal', 'https://example.com/insignias/carmela-carvajal.png')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Pantalones', 'Pantalones escolares y deportivos'),
  ('Camisas', 'Camisas y blusas escolares'),
  ('Buzos', 'Buzos y chaquetas'),
  ('Poleras', 'Poleras y polos'),
  ('Faldas', 'Faldas escolares'),
  ('Chalecos', 'Chalecos y sweaters'),
  ('Accesorios', 'Corbatas, cinturones y otros')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

-- PostgreSQL no admite CREATE POLICY IF NOT EXISTS. Eliminar las políticas
-- canónicas antes de recrearlas permite volver a ejecutar este bloque.
DROP POLICY IF EXISTS "Productos son visibles públicamente" ON productos;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden insertar productos" ON productos;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden actualizar productos" ON productos;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden eliminar productos" ON productos;
DROP POLICY IF EXISTS "Variantes son visibles públicamente" ON variantes;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden insertar variantes" ON variantes;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden actualizar variantes" ON variantes;
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden eliminar variantes" ON variantes;
DROP POLICY IF EXISTS "Permitir lectura de colegios a todos" ON colegios;
DROP POLICY IF EXISTS "Permitir inserción de colegios a usuarios autenticados" ON colegios;
DROP POLICY IF EXISTS "Permitir actualización de colegios a usuarios autenticados" ON colegios;
DROP POLICY IF EXISTS "Permitir eliminación de colegios a usuarios autenticados" ON colegios;
DROP POLICY IF EXISTS "Permitir lectura de categorias a todos" ON categorias;
DROP POLICY IF EXISTS "Permitir inserción de categorias a usuarios autenticados" ON categorias;
DROP POLICY IF EXISTS "Permitir actualización de categorias a usuarios autenticados" ON categorias;
DROP POLICY IF EXISTS "Permitir eliminación de categorias a usuarios autenticados" ON categorias;
DROP POLICY IF EXISTS "Permitir lectura pública de insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir inserción autenticada de insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir actualización autenticada de insumos" ON insumos;
DROP POLICY IF EXISTS "Permitir eliminación autenticada de insumos" ON insumos;
DROP POLICY IF EXISTS "Administración autenticada de clientes" ON clientes;
DROP POLICY IF EXISTS "Administración autenticada de ventas" ON ventas;
DROP POLICY IF EXISTS "Administración autenticada de items de venta" ON venta_items;
DROP POLICY IF EXISTS "Administración autenticada de proveedores" ON proveedores;
DROP POLICY IF EXISTS "Administración autenticada de pedidos" ON pedidos;
DROP POLICY IF EXISTS "Administración autenticada de items de pedido" ON pedido_items;
DROP POLICY IF EXISTS "Permitir lectura de mensajes a usuarios autenticados" ON whatsapp_messages;
DROP POLICY IF EXISTS "Permitir inserción de mensajes a usuarios autenticados" ON whatsapp_messages;
DROP POLICY IF EXISTS "Permitir actualización de mensajes a usuarios autenticados" ON whatsapp_messages;
DROP POLICY IF EXISTS "Permitir lectura de plantillas a usuarios autenticados" ON whatsapp_templates;
DROP POLICY IF EXISTS "Permitir lectura de configuración a usuarios autenticados" ON whatsapp_config;

-- Productos: lectura pública, escritura autenticada
CREATE POLICY "Productos son visibles públicamente"
  ON productos FOR SELECT USING (true);

CREATE POLICY "Solo usuarios autenticados pueden insertar productos"
  ON productos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden actualizar productos"
  ON productos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden eliminar productos"
  ON productos FOR DELETE USING (auth.role() = 'authenticated');

-- Variantes: lectura pública, escritura autenticada
CREATE POLICY "Variantes son visibles públicamente"
  ON variantes FOR SELECT USING (true);

CREATE POLICY "Solo usuarios autenticados pueden insertar variantes"
  ON variantes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden actualizar variantes"
  ON variantes FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Solo usuarios autenticados pueden eliminar variantes"
  ON variantes FOR DELETE USING (auth.role() = 'authenticated');

-- Colegios: lectura pública, escritura autenticada
CREATE POLICY "Permitir lectura de colegios a todos"
  ON colegios FOR SELECT TO public USING (true);

CREATE POLICY "Permitir inserción de colegios a usuarios autenticados"
  ON colegios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir actualización de colegios a usuarios autenticados"
  ON colegios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir eliminación de colegios a usuarios autenticados"
  ON colegios FOR DELETE TO authenticated USING (true);

-- Categorías: lectura pública, escritura autenticada
CREATE POLICY "Permitir lectura de categorias a todos"
  ON categorias FOR SELECT TO public USING (true);

CREATE POLICY "Permitir inserción de categorias a usuarios autenticados"
  ON categorias FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir actualización de categorias a usuarios autenticados"
  ON categorias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir eliminación de categorias a usuarios autenticados"
  ON categorias FOR DELETE TO authenticated USING (true);

-- Insumos: lectura pública, escritura autenticada
CREATE POLICY "Permitir lectura pública de insumos"
  ON insumos FOR SELECT USING (true);

CREATE POLICY "Permitir inserción autenticada de insumos"
  ON insumos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización autenticada de insumos"
  ON insumos FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación autenticada de insumos"
  ON insumos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Administración autenticada de clientes"
  ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Administración autenticada de ventas"
  ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Administración autenticada de items de venta"
  ON venta_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Administración autenticada de proveedores"
  ON proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Administración autenticada de pedidos"
  ON pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Administración autenticada de items de pedido"
  ON pedido_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WhatsApp: lectura/escritura para usuarios autenticados (webhook usa service role)
CREATE POLICY "Permitir lectura de mensajes a usuarios autenticados"
  ON whatsapp_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserción de mensajes a usuarios autenticados"
  ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir actualización de mensajes a usuarios autenticados"
  ON whatsapp_messages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Permitir lectura de plantillas a usuarios autenticados"
  ON whatsapp_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir lectura de configuración a usuarios autenticados"
  ON whatsapp_config FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_en_oferta ON productos(en_oferta) WHERE en_oferta = true;
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_colegio ON variantes(colegio);
CREATE INDEX IF NOT EXISTS idx_variantes_stock ON variantes(stock);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_colegio ON variantes(producto_id, colegio);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_variante_id ON venta_items(variante_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_contacto ON clientes(contacto);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_compra ON clientes(ultima_compra DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor_id ON pedidos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_esperada ON pedidos(fecha_esperada);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id ON pedido_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_variante_id ON pedido_items(variante_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_insumo_id ON pedido_items(insumo_id);
CREATE INDEX IF NOT EXISTS idx_insumos_nombre ON insumos(nombre);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_activo ON insumos(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_insumos_stock_bajo ON insumos(stock_actual) WHERE stock_actual <= stock_minimo;
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_created_at ON proveedores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_colegios_activo ON colegios(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_colegios_nombre ON colegios(nombre);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON categorias(nombre);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_productos_search ON productos
  USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));
CREATE INDEX IF NOT EXISTS idx_clientes_search ON clientes
  USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(contacto, '') || ' ' || COALESCE(telefono, '')));
CREATE INDEX IF NOT EXISTS idx_insumos_search ON insumos
  USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- ============================================================================
-- TRIGGERS (updated_at automático)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clientes_updated_at ON clientes;
CREATE TRIGGER trigger_update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_clientes_updated_at();

CREATE OR REPLACE FUNCTION update_proveedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_proveedores_updated_at ON proveedores;
CREATE TRIGGER trigger_update_proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION update_proveedores_updated_at();

CREATE OR REPLACE FUNCTION update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pedidos_updated_at ON pedidos;
CREATE TRIGGER trigger_update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_pedidos_updated_at();

CREATE OR REPLACE FUNCTION update_insumos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_insumos_updated_at ON insumos;
CREATE TRIGGER trigger_update_insumos_updated_at
  BEFORE UPDATE ON insumos
  FOR EACH ROW EXECUTE FUNCTION update_insumos_updated_at();

CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_whatsapp_messages_updated_at ON whatsapp_messages;
CREATE TRIGGER trigger_update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_messages_updated_at();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON TABLE ventas IS 'Registro de ventas realizadas por administradores';
COMMENT ON TABLE venta_items IS 'Detalle de productos vendidos en cada venta';
COMMENT ON COLUMN ventas.total IS 'Total de la venta en pesos chilenos';
COMMENT ON COLUMN venta_items.precio_unitario IS 'Precio original del producto al momento de la venta';
COMMENT ON COLUMN venta_items.precio_final IS 'Precio después de aplicar descuento';
COMMENT ON TABLE clientes IS 'Registro de clientes para el sistema de ventas';
COMMENT ON TABLE proveedores IS 'Registro de proveedores para gestión de compras';
COMMENT ON TABLE pedidos IS 'Órdenes de compra a proveedores';
COMMENT ON TABLE pedido_items IS 'Detalle de productos en cada pedido';
COMMENT ON COLUMN pedidos.estado IS 'Estado del pedido: pendiente, recibido, cancelado';
COMMENT ON TABLE whatsapp_messages IS 'Almacena todos los mensajes de WhatsApp entrantes y salientes';
COMMENT ON TABLE whatsapp_templates IS 'Almacena las plantillas de mensajes de WhatsApp aprobadas';
COMMENT ON TABLE whatsapp_config IS 'Configuración de la integración de WhatsApp Business API';
COMMENT ON INDEX idx_productos_categoria IS 'Optimiza filtrado por categoría';
COMMENT ON INDEX idx_variantes_producto_colegio IS 'Optimiza búsqueda de variantes por producto y colegio';
COMMENT ON INDEX idx_ventas_fecha IS 'Optimiza consultas de ventas por fecha';
COMMENT ON INDEX idx_productos_search IS 'Búsqueda full-text en productos';
