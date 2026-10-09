CREATE TABLE IF NOT EXISTS public.solicitudes_reparacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key UUID NOT NULL UNIQUE,
  idempotency_payload TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_solicitudes_reparacion_estado_created
  ON public.solicitudes_reparacion (estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitudes_reparacion_telefono_created
  ON public.solicitudes_reparacion (cliente_telefono, created_at DESC);

ALTER TABLE public.solicitudes_reparacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administrador único de solicitudes de reparación"
  ON public.solicitudes_reparacion;
CREATE POLICY "Administrador único de solicitudes de reparación"
  ON public.solicitudes_reparacion FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.solicitudes_reparacion FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.solicitudes_reparacion TO authenticated;

CREATE OR REPLACE FUNCTION public.crear_solicitud_reparacion_publica(
  p_request_key UUID,
  p_cliente_nombre TEXT,
  p_cliente_telefono TEXT,
  p_prenda TEXT,
  p_descripcion TEXT,
  p_fecha_deseada DATE,
  p_consent BOOLEAN,
  p_website TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_nombre TEXT := NULLIF(BTRIM(p_cliente_nombre), '');
  v_telefono TEXT := regexp_replace(COALESCE(p_cliente_telefono, ''), '[^0-9]', '', 'g');
  v_prenda TEXT := NULLIF(BTRIM(p_prenda), '');
  v_descripcion TEXT := NULLIF(BTRIM(p_descripcion), '');
  v_payload JSONB;
  v_payload_hash TEXT;
  v_existing_payload TEXT;
  v_request_id UUID;
  v_rate_count INTEGER;
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

  IF v_prenda IS NULL OR LENGTH(v_prenda) > 80 THEN
    RAISE EXCEPTION 'Indica qué prenda necesitas reparar';
  END IF;

  IF v_descripcion IS NULL OR LENGTH(v_descripcion) < 10 OR LENGTH(v_descripcion) > 1000 THEN
    RAISE EXCEPTION 'Describe el arreglo en 10 a 1000 caracteres';
  END IF;

  IF p_fecha_deseada IS NOT NULL AND p_fecha_deseada < CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha deseada no puede estar en el pasado';
  END IF;

  IF p_consent IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Debes autorizar el uso de tus datos para gestionar esta solicitud';
  END IF;

  v_payload := jsonb_build_object(
    'nombre', v_nombre,
    'telefono', v_telefono,
    'prenda', v_prenda,
    'descripcion', v_descripcion,
    'fecha_deseada', p_fecha_deseada
  );
  v_payload_hash := encode(digest(v_payload::TEXT, 'sha256'), 'hex');

  SELECT id, idempotency_payload
    INTO v_request_id, v_existing_payload
  FROM public.solicitudes_reparacion
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;
    RETURN v_request_id;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('repair-request:' || v_telefono, 0));

  SELECT id, idempotency_payload
    INTO v_request_id, v_existing_payload
  FROM public.solicitudes_reparacion
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;
    RETURN v_request_id;
  END IF;

  SELECT COUNT(*) INTO v_rate_count
  FROM public.solicitudes_reparacion
  WHERE cliente_telefono = v_telefono
    AND created_at >= NOW() - INTERVAL '1 hour';

  IF v_rate_count >= 5 THEN
    RAISE EXCEPTION 'Se alcanzó el límite temporal de solicitudes para este teléfono';
  END IF;

  INSERT INTO public.solicitudes_reparacion (
    idempotency_key,
    idempotency_payload,
    cliente_nombre,
    cliente_telefono,
    prenda,
    descripcion,
    fecha_deseada,
    consent_at
  )
  VALUES (
    p_request_key,
    v_payload_hash,
    v_nombre,
    v_telefono,
    v_prenda,
    v_descripcion,
    p_fecha_deseada,
    NOW()
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_request_id;

  IF v_request_id IS NULL THEN
    SELECT id, idempotency_payload
      INTO v_request_id, v_existing_payload
    FROM public.solicitudes_reparacion
    WHERE idempotency_key = p_request_key;

    IF NOT FOUND OR v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;
  END IF;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_solicitud_reparacion_publica(UUID, TEXT, TEXT, TEXT, TEXT, DATE, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_solicitud_reparacion_publica(UUID, TEXT, TEXT, TEXT, TEXT, DATE, BOOLEAN, TEXT)
  TO anon, authenticated;
