-- ============================================================================
-- SCHEMA CANÓNICO — confecciones-angus
-- ============================================================================
-- Archivo consolidado a partir de supabase/*.sql y supabase/migrations/*.sql.
-- Para instalar desde cero, ejecutar este archivo y luego las migraciones
-- 34 a 43 en orden.
--
-- Se ejecuta de forma idempotente sobre una base vacía (CREATE TABLE IF NOT
-- EXISTS). Para bases existentes, usa los archivos numerados en orden.
--
-- Las escrituras administrativas requieren app_metadata.role = "admin".
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
  notas TEXT, -- Legacy compatibility only; private notes are stored in producto_notas.
  idempotency_key UUID UNIQUE,
  idempotency_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private product notes. The legacy productos.notas column is kept empty for compatibility.
CREATE TABLE IF NOT EXISTS producto_notas (
  producto_id UUID PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  notas TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

-- Solicitudes públicas de clientes, separadas de las compras a proveedores.
CREATE TABLE IF NOT EXISTS solicitudes_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE,
  idempotency_payload TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmado', 'cancelado')),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  cantidad_items INTEGER NOT NULL CHECK (cantidad_items > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitud_pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_pedido(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  variante_id UUID REFERENCES variantes(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitudes_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE,
  idempotency_payload TEXT NOT NULL,
  tracking_token_hash TEXT,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  prenda TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_deseada DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'cotizada', 'aceptada', 'completada', 'cancelada')),
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ALTER TABLE solicitudes_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitud_pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_reparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', FALSE);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.producto_notas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.producto_notas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.producto_notas TO authenticated;
DROP POLICY IF EXISTS "Administrador único de notas de productos" ON public.producto_notas;
CREATE POLICY "Administrador único de notas de productos"
  ON public.producto_notas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_legacy_product_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NULLIF(BTRIM(NEW.notas), '') IS NOT NULL THEN
      IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acceso restringido al administrador';
      END IF;

      INSERT INTO public.producto_notas (producto_id, notas, updated_at)
      VALUES (NEW.id, BTRIM(NEW.notas), NOW())
      ON CONFLICT (producto_id) DO UPDATE
      SET notas = EXCLUDED.notas, updated_at = EXCLUDED.updated_at;
    END IF;
  ELSIF NEW.notas IS DISTINCT FROM OLD.notas THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Acceso restringido al administrador';
    END IF;

    IF NULLIF(BTRIM(NEW.notas), '') IS NULL THEN
      DELETE FROM public.producto_notas WHERE producto_id = NEW.id;
    ELSE
      INSERT INTO public.producto_notas (producto_id, notas, updated_at)
      VALUES (NEW.id, BTRIM(NEW.notas), NOW())
      ON CONFLICT (producto_id) DO UPDATE
      SET notas = EXCLUDED.notas, updated_at = EXCLUDED.updated_at;
    END IF;
  END IF;

  NEW.notas := NULL;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_legacy_product_notes() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS sync_legacy_product_notes ON public.productos;
CREATE TRIGGER sync_legacy_product_notes
  BEFORE INSERT OR UPDATE OF notas ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_product_notes();

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'productos', 'variantes', 'colegios', 'categorias', 'insumos',
        'clientes', 'ventas', 'venta_items', 'proveedores', 'pedidos',
        'pedido_items', 'solicitudes_pedido', 'solicitud_pedido_items',
        'solicitudes_reparacion',
        'whatsapp_messages', 'whatsapp_templates', 'whatsapp_config'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END;
$$;

CREATE POLICY "Lectura pública de productos"
  ON productos FOR SELECT TO public USING (true);
CREATE POLICY "Administrador único de productos"
  ON productos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Lectura pública de variantes"
  ON variantes FOR SELECT TO public USING (true);
CREATE POLICY "Administrador único de variantes"
  ON variantes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Lectura pública de colegios"
  ON colegios FOR SELECT TO public USING (true);
CREATE POLICY "Administrador único de colegios"
  ON colegios FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Lectura pública de categorías"
  ON categorias FOR SELECT TO public USING (true);
CREATE POLICY "Administrador único de categorías"
  ON categorias FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Administrador único de insumos"
  ON insumos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Administrador único de clientes"
  ON clientes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de ventas"
  ON ventas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de items de venta"
  ON venta_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de proveedores"
  ON proveedores FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de pedidos"
  ON pedidos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de items de pedido"
  ON pedido_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de solicitudes de pedido"
  ON solicitudes_pedido FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de items de solicitud"
  ON solicitud_pedido_items FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Administrador único de solicitudes de reparación"
  ON solicitudes_reparacion FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
REVOKE ALL ON solicitudes_pedido FROM PUBLIC, anon, authenticated;
REVOKE ALL ON solicitud_pedido_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON solicitudes_reparacion FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON solicitudes_pedido TO authenticated;
GRANT SELECT ON solicitud_pedido_items TO authenticated;
GRANT SELECT, UPDATE ON solicitudes_reparacion TO authenticated;
CREATE POLICY "Administrador único de mensajes WhatsApp"
  ON whatsapp_messages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de plantillas WhatsApp"
  ON whatsapp_templates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Administrador único de configuración WhatsApp"
  ON whatsapp_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  today_start TIMESTAMPTZ := date_trunc('day', now());
  week_start TIMESTAMPTZ := now() - INTERVAL '7 days';
  month_start TIMESTAMPTZ := date_trunc('month', now());
  thirty_days_ago TIMESTAMPTZ := now() - INTERVAL '30 days';
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso restringido al administrador'
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'ventasHoy', (
      SELECT jsonb_build_object('total', COALESCE(SUM(total), 0), 'cantidad', COUNT(*))
      FROM public.ventas WHERE fecha >= today_start
    ),
    'ventasSemana', (
      SELECT jsonb_build_object('total', COALESCE(SUM(total), 0), 'cantidad', COUNT(*))
      FROM public.ventas WHERE fecha >= week_start
    ),
    'ventasMes', (
      SELECT jsonb_build_object('total', COALESCE(SUM(total), 0), 'cantidad', COUNT(*))
      FROM public.ventas WHERE fecha >= month_start
    ),
    'pedidosPendientes', (
      SELECT COUNT(*) FROM public.pedidos WHERE estado = 'pendiente'
    ),
    'solicitudesPendientes', (
      SELECT COUNT(*) FROM public.solicitudes_pedido WHERE estado = 'pendiente'
    ),
    'reparacionesPendientes', (
      SELECT COUNT(*) FROM public.solicitudes_reparacion WHERE estado = 'pendiente'
    ),
    'clientesNuevos', (
      SELECT COUNT(*) FROM public.clientes WHERE created_at >= month_start
    ),
    'productosMasVendidos', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object('nombre', producto_nombre, 'cantidad', cantidad)
        ORDER BY cantidad DESC
      )
      FROM (
        SELECT producto_nombre, SUM(cantidad)::INTEGER AS cantidad
        FROM public.venta_items
        WHERE created_at >= thirty_days_ago
        GROUP BY producto_nombre
        ORDER BY SUM(cantidad) DESC
        LIMIT 5
      ) AS top_products
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_product_page(
  p_search TEXT DEFAULT '',
  p_category TEXT DEFAULT '',
  p_school TEXT DEFAULT '',
  p_size TEXT DEFAULT '',
  p_stock_filter TEXT DEFAULT '',
  p_status_filter TEXT DEFAULT '',
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_search TEXT := LOWER(BTRIM(COALESCE(p_search, '')));
  v_category TEXT := NULLIF(BTRIM(COALESCE(p_category, '')), '');
  v_school TEXT := NULLIF(BTRIM(COALESCE(p_school, '')), '');
  v_size TEXT := NULLIF(BTRIM(COALESCE(p_size, '')), '');
  v_stock_filter TEXT := NULLIF(BTRIM(COALESCE(p_stock_filter, '')), '');
  v_status_filter TEXT := NULLIF(BTRIM(COALESCE(p_status_filter, '')), '');
  v_offset INTEGER := COALESCE(p_offset, 0);
  v_limit INTEGER := COALESCE(p_limit, 20);
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso restringido al administrador'
      USING ERRCODE = '42501';
  END IF;
  IF v_offset < 0 OR v_limit < 1 OR v_limit > 100 THEN
    RAISE EXCEPTION 'La paginación solicitada no es válida';
  END IF;
  IF LENGTH(v_search) > 100 THEN
    RAISE EXCEPTION 'La búsqueda no puede superar 100 caracteres';
  END IF;
  IF v_stock_filter IS NOT NULL
     AND v_stock_filter NOT IN ('disponible', 'bajo', 'agotado') THEN
    RAISE EXCEPTION 'El filtro de stock no es válido';
  END IF;
  IF v_status_filter IS NOT NULL
     AND v_status_filter NOT IN ('activo', 'inactivo') THEN
    RAISE EXCEPTION 'El filtro de estado no es válido';
  END IF;

  WITH product_stock AS (
    SELECT p.id, COALESCE(SUM(v.stock), 0)::INTEGER AS stock_total,
      COUNT(v.id)::INTEGER AS variantes_count
    FROM public.productos AS p
    LEFT JOIN public.variantes AS v ON v.producto_id = p.id
    GROUP BY p.id
  ),
  filtered_products AS (
    SELECT p.*, pn.notas AS admin_notas, ps.stock_total, ps.variantes_count
    FROM public.productos AS p
    JOIN product_stock AS ps ON ps.id = p.id
    LEFT JOIN public.producto_notas AS pn ON pn.producto_id = p.id
    WHERE (v_category IS NULL OR p.categoria = v_category)
      AND (
        v_status_filter IS NULL
        OR (v_status_filter = 'activo' AND p.activo IS DISTINCT FROM FALSE)
        OR (v_status_filter = 'inactivo' AND p.activo IS FALSE)
      )
      AND (
        v_stock_filter IS NULL
        OR (v_stock_filter = 'disponible' AND ps.stock_total > 6)
        OR (v_stock_filter = 'bajo' AND ps.stock_total BETWEEN 1 AND 6)
        OR (v_stock_filter = 'agotado' AND ps.stock_total = 0)
      )
      AND (
        (v_school IS NULL AND v_size IS NULL)
        OR EXISTS (
          SELECT 1 FROM public.variantes AS vf
          WHERE vf.producto_id = p.id
            AND (v_school IS NULL OR vf.colegio = v_school)
            AND (v_size IS NULL OR vf.talla = v_size)
        )
      )
      AND (
        v_search = ''
        OR POSITION(v_search IN LOWER(p.nombre)) > 0
        OR POSITION(v_search IN LOWER(p.descripcion)) > 0
        OR POSITION(v_search IN LOWER(p.categoria)) > 0
        OR POSITION(v_search IN p.precio::TEXT) > 0
        OR POSITION(v_search IN LOWER(COALESCE(pn.notas, ''))) > 0
        OR EXISTS (
          SELECT 1 FROM public.variantes AS vs
          WHERE vs.producto_id = p.id
            AND (
              POSITION(v_search IN LOWER(vs.colegio)) > 0
              OR POSITION(v_search IN LOWER(vs.talla)) > 0
              OR POSITION(v_search IN vs.stock::TEXT) > 0
            )
        )
      )
  ),
  page_products AS (
    SELECT fp.* FROM filtered_products AS fp
    ORDER BY fp.created_at DESC NULLS LAST, fp.id
    OFFSET LEAST(
      v_offset,
      GREATEST(0, (((SELECT COUNT(*)::INTEGER FROM filtered_products) - 1) / v_limit) * v_limit)
    )
    LIMIT v_limit
  ),
  page_json AS (
    SELECT COALESCE(jsonb_agg(
      (to_jsonb(pp) - 'variantes') || jsonb_build_object(
        'notas', pp.admin_notas,
        'activo', pp.activo IS DISTINCT FROM FALSE,
        'variantes',
        COALESCE((
          SELECT jsonb_agg(
            to_jsonb(v) || jsonb_build_object('insignia_url', c.insignia_url)
            ORDER BY v.created_at ASC, v.id
          )
          FROM public.variantes AS v
          LEFT JOIN public.colegios AS c
            ON BTRIM(c.nombre) = BTRIM(v.colegio)
          WHERE v.producto_id = pp.id
        ), '[]'::JSONB)
      )
      ORDER BY pp.created_at DESC NULLS LAST, pp.id
    ), '[]'::JSONB) AS items
    FROM page_products AS pp
  ),
  summary AS (
    SELECT
      (SELECT COUNT(*) FROM public.productos) AS total_productos,
      (SELECT COUNT(*) FROM public.variantes) AS total_variantes,
      (SELECT COALESCE(SUM(stock), 0) FROM public.variantes WHERE stock > 6) AS unidades_disponibles,
      (SELECT COALESCE(SUM(stock), 0) FROM public.variantes WHERE stock BETWEEN 1 AND 6) AS unidades_stock_bajo,
      (SELECT COUNT(*) FROM public.variantes WHERE stock = 0) AS variantes_agotadas,
      (
        SELECT COALESCE(SUM(
          (CASE
            WHEN p.descuento_porcentaje IS NOT NULL AND p.descuento_porcentaje <> 0
              THEN p.precio - (p.precio * p.descuento_porcentaje / 100)
            ELSE p.precio
          END) * COALESCE(ps.stock_total, 0)
        ), 0)
        FROM public.productos AS p
        LEFT JOIN product_stock AS ps ON ps.id = p.id
      ) AS valor_inventario
  ),
  stock_specific AS (
    SELECT COALESCE(SUM(v.stock), 0)::INTEGER AS total_stock,
      COUNT(v.id)::INTEGER AS variantes_encontradas
    FROM filtered_products AS fp
    JOIN public.variantes AS v ON v.producto_id = fp.id
    WHERE (v_school IS NULL OR v.colegio = v_school)
      AND (v_size IS NULL OR v.talla = v_size)
  )
  SELECT jsonb_build_object(
    'items', page_json.items,
    'total', (SELECT COUNT(*) FROM filtered_products),
    'facets', jsonb_build_object(
      'categories', COALESCE((
        SELECT jsonb_agg(category ORDER BY category)
        FROM (SELECT DISTINCT categoria AS category FROM public.productos) AS categories
      ), '[]'::JSONB),
      'schools', COALESCE((
        SELECT jsonb_agg(school ORDER BY school)
        FROM (SELECT DISTINCT colegio AS school FROM public.variantes) AS schools
      ), '[]'::JSONB),
      'sizes', COALESCE((
        SELECT jsonb_agg(size ORDER BY size)
        FROM (SELECT DISTINCT talla AS size FROM public.variantes) AS sizes
      ), '[]'::JSONB)
    ),
    'summary', jsonb_build_object(
      'totalProductos', summary.total_productos,
      'totalVariantes', summary.total_variantes,
      'unidadesDisponibles', summary.unidades_disponibles,
      'unidadesStockBajo', summary.unidades_stock_bajo,
      'variantesAgotadas', summary.variantes_agotadas,
      'valorInventario', summary.valor_inventario
    ),
    'stockEspecifico', CASE
      WHEN v_school IS NULL AND v_size IS NULL THEN NULL
      ELSE jsonb_build_object(
        'totalStock', stock_specific.total_stock,
        'variantesEncontradas', stock_specific.variantes_encontradas
      )
    END
  )
  INTO v_result
  FROM page_json, summary, stock_specific;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_product_page(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_product_page(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER)
  TO authenticated;

CREATE INDEX IF NOT EXISTS idx_variantes_producto_colegio_talla
  ON public.variantes (producto_id, colegio, talla);

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
CREATE INDEX IF NOT EXISTS idx_solicitudes_pedido_estado_created
  ON solicitudes_pedido(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_pedido_telefono_created
  ON solicitudes_pedido(cliente_telefono, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitud_pedido_items_solicitud
  ON solicitud_pedido_items(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_reparacion_estado_created
  ON solicitudes_reparacion(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_reparacion_telefono_created
  ON solicitudes_reparacion(cliente_telefono, created_at DESC);
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

-- ============================================================================
-- MÉTRICAS AGREGADAS DEL EMBUDO PÚBLICO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.storefront_metrics (
  event_date DATE NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN (
    'search',
    'no_results',
    'product_view',
    'variant_selected',
    'added_to_order',
    'request_started',
    'request_registered',
    'whatsapp_opened'
  )),
  event_count BIGINT NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  PRIMARY KEY (event_date, metric)
);

ALTER TABLE public.storefront_metrics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.storefront_metrics FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_public_storefront_metric(p_metric TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_metric IS NULL OR p_metric NOT IN (
    'search',
    'no_results',
    'product_view',
    'variant_selected',
    'added_to_order',
    'request_started',
    'request_registered',
    'whatsapp_opened'
  ) THEN
    RAISE EXCEPTION 'La métrica solicitada no está permitida'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.storefront_metrics (event_date, metric, event_count)
  VALUES ((now() AT TIME ZONE 'America/Santiago')::DATE, p_metric, 1)
  ON CONFLICT (event_date, metric)
  DO UPDATE SET event_count = public.storefront_metrics.event_count + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_storefront_metric(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_storefront_metric(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_storefront_funnel_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso restringido al administrador'
      USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object('metric', metrics.metric, 'count', metrics.event_count)
      ORDER BY metrics.metric
    )
    FROM (
      SELECT metric, SUM(event_count)::BIGINT AS event_count
      FROM public.storefront_metrics
      WHERE event_date >= (now() AT TIME ZONE 'America/Santiago')::DATE - 29
      GROUP BY metric
    ) AS metrics
  ), '[]'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_storefront_funnel_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_storefront_funnel_metrics() TO authenticated;
