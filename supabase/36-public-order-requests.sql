CREATE TABLE IF NOT EXISTS public.solicitudes_pedido (
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

CREATE TABLE IF NOT EXISTS public.solicitud_pedido_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL
    REFERENCES public.solicitudes_pedido(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  variante_id UUID REFERENCES public.variantes(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_pedido_estado_created
  ON public.solicitudes_pedido (estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitudes_pedido_telefono_created
  ON public.solicitudes_pedido (cliente_telefono, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitud_pedido_items_solicitud
  ON public.solicitud_pedido_items (solicitud_id);

ALTER TABLE public.solicitudes_pedido
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
UPDATE public.solicitudes_pedido SET consent_at = created_at WHERE consent_at IS NULL;
ALTER TABLE public.solicitudes_pedido ALTER COLUMN consent_at SET NOT NULL;
ALTER TABLE public.solicitudes_pedido ALTER COLUMN consent_at DROP DEFAULT;

ALTER TABLE public.solicitudes_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitud_pedido_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administrador único de solicitudes de pedido"
  ON public.solicitudes_pedido;
CREATE POLICY "Administrador único de solicitudes de pedido"
  ON public.solicitudes_pedido FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Administrador único de items de solicitud"
  ON public.solicitud_pedido_items;
CREATE POLICY "Administrador único de items de solicitud"
  ON public.solicitud_pedido_items FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.solicitudes_pedido FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.solicitud_pedido_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.solicitudes_pedido TO authenticated;
GRANT SELECT ON public.solicitud_pedido_items TO authenticated;

CREATE OR REPLACE FUNCTION public.crear_solicitud_pedido_publica(
  p_request_key UUID,
  p_cliente_nombre TEXT,
  p_cliente_telefono TEXT,
  p_consent BOOLEAN,
  p_items JSONB,
  p_website TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_nombre TEXT := NULLIF(BTRIM(p_cliente_nombre), '');
  v_telefono TEXT := regexp_replace(COALESCE(p_cliente_telefono, ''), '[^0-9]', '', 'g');
  v_payload JSONB;
  v_payload_hash TEXT;
  v_existing_payload TEXT;
  v_solicitud_id UUID;
  v_input RECORD;
  v_producto RECORD;
  v_snapshot JSONB := '[]'::JSONB;
  v_total NUMERIC(12, 2) := 0;
  v_cantidad_items INTEGER := 0;
  v_rate_count INTEGER;
  v_result JSONB;
BEGIN
  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_website, '')), '') IS NOT NULL THEN
    RAISE EXCEPTION 'No se pudo procesar la solicitud';
  END IF;

  IF v_nombre IS NULL OR LENGTH(v_nombre) < 2 OR LENGTH(v_nombre) > 100 THEN
    RAISE EXCEPTION 'Ingresa un nombre válido (2 a 100 caracteres)';
  END IF;

  IF LENGTH(v_telefono) < 8 OR LENGTH(v_telefono) > 15 THEN
    RAISE EXCEPTION 'Ingresa un teléfono válido';
  END IF;

  IF p_consent IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Debes autorizar el uso de tus datos para gestionar esta solicitud';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_items) < 1
     OR jsonb_array_length(p_items) > 20 THEN
    RAISE EXCEPTION 'El pedido debe contener entre 1 y 20 productos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS i(variante_id UUID, cantidad INTEGER)
    WHERE i.variante_id IS NULL OR i.cantidad IS NULL
       OR i.cantidad < 1 OR i.cantidad > 99
  ) THEN
    RAISE EXCEPTION 'La cantidad solicitada no es válida';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS i(variante_id UUID, cantidad INTEGER)
    GROUP BY i.variante_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'El pedido contiene variantes duplicadas';
  END IF;

  v_payload := jsonb_build_object(
    'nombre', v_nombre,
    'telefono', v_telefono,
    'items', p_items
  );
  v_payload_hash := encode(digest(v_payload::TEXT, 'sha256'), 'hex');

  SELECT id, idempotency_payload
    INTO v_solicitud_id, v_existing_payload
  FROM public.solicitudes_pedido
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;

    SELECT jsonb_build_object(
      'id', o.id,
      'total', o.total,
      'items', COALESCE(jsonb_agg(jsonb_build_object(
        'nombre', i.producto_nombre,
        'talla', i.talla,
        'colegio', i.colegio,
        'cantidad', i.cantidad,
        'precio_unitario', i.precio_unitario,
        'subtotal', i.subtotal
      ) ORDER BY i.created_at), '[]'::JSONB)
    )
    INTO v_result
    FROM public.solicitudes_pedido o
    LEFT JOIN public.solicitud_pedido_items i ON i.solicitud_id = o.id
    WHERE o.id = v_solicitud_id
    GROUP BY o.id;

    RETURN v_result;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('public-order:' || v_telefono, 0));

  SELECT id, idempotency_payload
    INTO v_solicitud_id, v_existing_payload
  FROM public.solicitudes_pedido
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;

    SELECT jsonb_build_object(
      'id', o.id,
      'total', o.total,
      'items', COALESCE(jsonb_agg(jsonb_build_object(
        'nombre', i.producto_nombre,
        'talla', i.talla,
        'colegio', i.colegio,
        'cantidad', i.cantidad,
        'precio_unitario', i.precio_unitario,
        'subtotal', i.subtotal
      ) ORDER BY i.created_at), '[]'::JSONB)
    )
    INTO v_result
    FROM public.solicitudes_pedido o
    LEFT JOIN public.solicitud_pedido_items i ON i.solicitud_id = o.id
    WHERE o.id = v_solicitud_id
    GROUP BY o.id;

    RETURN v_result;
  END IF;

  SELECT COUNT(*) INTO v_rate_count
  FROM public.solicitudes_pedido
  WHERE cliente_telefono = v_telefono
    AND created_at >= NOW() - INTERVAL '1 hour';

  IF v_rate_count >= 5 THEN
    RAISE EXCEPTION 'Se alcanzó el límite temporal de solicitudes para este teléfono';
  END IF;

  FOR v_input IN
    SELECT i.variante_id, i.cantidad
    FROM jsonb_to_recordset(p_items) AS i(variante_id UUID, cantidad INTEGER)
    ORDER BY i.variante_id
  LOOP
    SELECT
      p.id AS producto_id,
      v.id AS variante_id,
      p.nombre,
      v.talla,
      v.colegio,
      v.stock,
      ROUND(
        COALESCE(NULLIF(v.precio, 0), p.precio)
        * (100 - COALESCE(p.descuento_porcentaje, 0)) / 100
      , 0) AS precio_unitario
    INTO v_producto
    FROM public.variantes v
    JOIN public.productos p ON p.id = v.producto_id
    WHERE v.id = v_input.variante_id
      AND (p.activo IS NULL OR p.activo = TRUE)
    FOR SHARE OF v, p;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Una variante ya no está disponible en la cantidad solicitada';
    END IF;

    IF v_producto.stock < v_input.cantidad THEN
      RAISE EXCEPTION 'Una variante ya no está disponible en la cantidad solicitada';
    END IF;

    v_cantidad_items := v_cantidad_items + v_input.cantidad;
    IF v_cantidad_items > 99 THEN
      RAISE EXCEPTION 'El pedido supera la cantidad máxima permitida';
    END IF;

    v_total := v_total + v_producto.precio_unitario * v_input.cantidad;
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'producto_id', v_producto.producto_id,
      'variante_id', v_producto.variante_id,
      'nombre', v_producto.nombre,
      'talla', v_producto.talla,
      'colegio', v_producto.colegio,
      'cantidad', v_input.cantidad,
      'precio_unitario', v_producto.precio_unitario,
      'subtotal', v_producto.precio_unitario * v_input.cantidad
    ));
  END LOOP;

  INSERT INTO public.solicitudes_pedido (
    idempotency_key,
    idempotency_payload,
    cliente_nombre,
    cliente_telefono,
    consent_at,
    total,
    cantidad_items
  )
  VALUES (
    p_request_key,
    v_payload_hash,
    v_nombre,
    v_telefono,
    NOW(),
    v_total,
    v_cantidad_items
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_solicitud_id;

  IF v_solicitud_id IS NULL THEN
    SELECT id, idempotency_payload
      INTO v_solicitud_id, v_existing_payload
    FROM public.solicitudes_pedido
    WHERE idempotency_key = p_request_key;

    IF NOT FOUND OR v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;
  ELSE
    INSERT INTO public.solicitud_pedido_items (
      solicitud_id,
      producto_id,
      variante_id,
      producto_nombre,
      talla,
      colegio,
      cantidad,
      precio_unitario,
      subtotal
    )
    SELECT
      v_solicitud_id,
      i.producto_id,
      i.variante_id,
      i.nombre,
      i.talla,
      i.colegio,
      i.cantidad,
      i.precio_unitario,
      i.subtotal
    FROM jsonb_to_recordset(v_snapshot) AS i(
      producto_id UUID,
      variante_id UUID,
      nombre TEXT,
      talla TEXT,
      colegio TEXT,
      cantidad INTEGER,
      precio_unitario NUMERIC,
      subtotal NUMERIC
    );
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'total', o.total,
    'items', COALESCE(jsonb_agg(jsonb_build_object(
      'nombre', i.producto_nombre,
      'talla', i.talla,
      'colegio', i.colegio,
      'cantidad', i.cantidad,
      'precio_unitario', i.precio_unitario,
      'subtotal', i.subtotal
    ) ORDER BY i.created_at), '[]'::JSONB)
  )
  INTO v_result
  FROM public.solicitudes_pedido o
  LEFT JOIN public.solicitud_pedido_items i ON i.solicitud_id = o.id
  WHERE o.id = v_solicitud_id
  GROUP BY o.id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_solicitud_pedido_publica(UUID, TEXT, TEXT, BOOLEAN, JSONB, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_pedido_publica(UUID, TEXT, TEXT, BOOLEAN, JSONB, TEXT)
  TO anon, authenticated;
