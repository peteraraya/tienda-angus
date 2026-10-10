-- Recalculate sale amounts from locked product and variant rows.
BEGIN;

CREATE OR REPLACE FUNCTION public.crear_venta_atomica(
  p_request_key UUID,
  p_payload JSONB,
  p_vendedor TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_venta_id UUID;
  v_existing_payload TEXT;
  v_request_payload JSONB;
  v_payload_hash TEXT;
  v_items JSONB;
  v_cliente_id UUID;
  v_cliente_nombre TEXT;
  v_cliente_telefono TEXT;
  v_cliente_contacto TEXT;
  v_notas TEXT;
  v_vendedor TEXT;
  v_subtotal BIGINT;
  v_descuento_total BIGINT;
  v_cantidad_items BIGINT;
  v_requested RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso restringido al administrador'
      USING ERRCODE = '42501';
  END IF;

  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Los datos de la venta no son válidos';
  END IF;
  IF jsonb_typeof(p_payload->'items') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'La venta debe incluir una lista de productos';
  END IF;
  IF jsonb_array_length(p_payload->'items') NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'La venta debe contener entre 1 y 100 productos';
  END IF;

  v_cliente_id := NULLIF(p_payload->>'cliente_id', '')::UUID;
  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Debes seleccionar un cliente';
  END IF;
  v_notas := NULLIF(BTRIM(p_payload->>'notas'), '');
  IF (p_payload ? 'notas' AND jsonb_typeof(p_payload->'notas') NOT IN ('string', 'null'))
     OR LENGTH(v_notas) > 2000 THEN
    RAISE EXCEPTION 'Las notas de la venta no pueden superar 2000 caracteres';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(
      producto_id UUID,
      variante_id UUID,
      precio_unitario NUMERIC,
      descuento_porcentaje INTEGER,
      precio_final NUMERIC,
      cantidad INTEGER
    )
    WHERE i.producto_id IS NULL
       OR i.variante_id IS NULL
       OR i.precio_unitario IS NULL
       OR i.descuento_porcentaje IS NULL
       OR i.precio_final IS NULL
       OR i.cantidad IS NULL
       OR i.cantidad < 1
       OR i.cantidad > 100000
  ) THEN
    RAISE EXCEPTION 'Los productos, cantidades o precios esperados no son válidos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(variante_id UUID)
    GROUP BY i.variante_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'La venta contiene variantes duplicadas';
  END IF;

  v_request_payload := jsonb_build_object(
    'cliente_id', v_cliente_id,
    'notas', v_notas,
    'items', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'producto_id', i.producto_id,
          'variante_id', i.variante_id,
          'precio_unitario', i.precio_unitario,
          'descuento_porcentaje', i.descuento_porcentaje,
          'precio_final', i.precio_final,
          'cantidad', i.cantidad
        )
        ORDER BY i.variante_id
      )
      FROM jsonb_to_recordset(p_payload->'items') AS i(
        producto_id UUID,
        variante_id UUID,
        precio_unitario NUMERIC,
        descuento_porcentaje INTEGER,
        precio_final NUMERIC,
        cantidad INTEGER
      )
    )
  );
  v_payload_hash := encode(public.digest(v_request_payload::TEXT, 'sha256'), 'hex');

  PERFORM pg_advisory_xact_lock(hashtext(p_request_key::TEXT));

  SELECT id, idempotency_payload
    INTO v_venta_id, v_existing_payload
  FROM public.ventas
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;
    RETURN v_venta_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(producto_id UUID, variante_id UUID)
    LEFT JOIN public.variantes AS v ON v.id = i.variante_id
    WHERE v.id IS NULL OR v.producto_id IS DISTINCT FROM i.producto_id
  ) THEN
    RAISE EXCEPTION 'Una o más variantes no corresponden a los productos seleccionados';
  END IF;

  PERFORM p.id
  FROM public.productos AS p
  JOIN public.variantes AS v ON v.producto_id = p.id
  JOIN jsonb_to_recordset(p_payload->'items') AS i(producto_id UUID, variante_id UUID)
    ON i.producto_id = p.id AND i.variante_id = v.id
  ORDER BY p.id
  FOR SHARE OF p;

  PERFORM v.id
  FROM public.variantes AS v
  JOIN jsonb_to_recordset(p_payload->'items') AS i(producto_id UUID, variante_id UUID)
    ON i.producto_id = v.producto_id AND i.variante_id = v.id
  ORDER BY v.id
  FOR UPDATE OF v;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(producto_id UUID, variante_id UUID)
    LEFT JOIN public.variantes AS v ON v.id = i.variante_id
    WHERE v.id IS NULL OR v.producto_id IS DISTINCT FROM i.producto_id
  ) THEN
    RAISE EXCEPTION 'Una o más variantes cambiaron mientras se procesaba la venta';
  END IF;

  SELECT nombre, telefono, contacto
    INTO v_cliente_nombre, v_cliente_telefono, v_cliente_contacto
  FROM public.clientes
  WHERE id = v_cliente_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el cliente de la venta';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(
      producto_id UUID,
      variante_id UUID,
      precio_unitario NUMERIC,
      descuento_porcentaje INTEGER,
      precio_final NUMERIC,
      cantidad INTEGER
    )
    JOIN public.variantes AS v ON v.id = i.variante_id
    JOIN public.productos AS p ON p.id = v.producto_id
    WHERE COALESCE(v.precio, p.precio) < 0
       OR COALESCE(p.descuento_porcentaje, 0) NOT BETWEEN 0 AND 100
       OR v.stock < i.cantidad
       OR i.precio_unitario IS DISTINCT FROM ROUND(COALESCE(v.precio, p.precio))
       OR i.descuento_porcentaje IS DISTINCT FROM COALESCE(p.descuento_porcentaje, 0)
       OR i.precio_final IS DISTINCT FROM ROUND(
         ROUND(COALESCE(v.precio, p.precio))
         * (100 - COALESCE(p.descuento_porcentaje, 0)) / 100
       )
  ) THEN
    RAISE EXCEPTION 'El precio, descuento o stock cambió. Actualiza el carrito antes de confirmar';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'producto_id', p.id,
      'variante_id', v.id,
      'producto_nombre', p.nombre,
      'talla', v.talla,
      'colegio', v.colegio,
      'precio_unitario', ROUND(COALESCE(v.precio, p.precio))::INTEGER,
      'descuento_porcentaje', COALESCE(p.descuento_porcentaje, 0),
      'precio_final', ROUND(
        ROUND(COALESCE(v.precio, p.precio))
        * (100 - COALESCE(p.descuento_porcentaje, 0)) / 100
      )::INTEGER,
      'cantidad', i.cantidad,
      'subtotal', (
        ROUND(
          ROUND(COALESCE(v.precio, p.precio))
          * (100 - COALESCE(p.descuento_porcentaje, 0)) / 100
        )::BIGINT * i.cantidad
      )
    )
    ORDER BY v.id
  )
  INTO v_items
  FROM jsonb_to_recordset(p_payload->'items') AS i(
    producto_id UUID,
    variante_id UUID,
    cantidad INTEGER
  )
  JOIN public.variantes AS v ON v.id = i.variante_id
  JOIN public.productos AS p ON p.id = v.producto_id;

  SELECT
    SUM((item->>'subtotal')::BIGINT),
    SUM(
      (
        (item->>'precio_unitario')::BIGINT
        - (item->>'precio_final')::BIGINT
      ) * (item->>'cantidad')::BIGINT
    ),
    SUM((item->>'cantidad')::BIGINT)
  INTO v_subtotal, v_descuento_total, v_cantidad_items
  FROM jsonb_array_elements(v_items) AS items(item);

  IF v_subtotal > 2147483647
     OR v_descuento_total > 2147483647
     OR v_cantidad_items > 2147483647 THEN
    RAISE EXCEPTION 'Los montos o cantidades de la venta superan el máximo permitido';
  END IF;

  v_vendedor := COALESCE(
    NULLIF(auth.jwt()->>'email', ''),
    NULLIF(BTRIM(p_vendedor), ''),
    'Administrador'
  );

  INSERT INTO public.ventas (
    total,
    subtotal,
    descuento_total,
    cantidad_items,
    notas,
    vendedor,
    cliente_id,
    cliente_nombre,
    cliente_telefono,
    cliente_contacto,
    idempotency_key,
    idempotency_payload
  )
  VALUES (
    v_subtotal::INTEGER,
    v_subtotal::INTEGER,
    v_descuento_total::INTEGER,
    v_cantidad_items::INTEGER,
    v_notas,
    v_vendedor,
    v_cliente_id,
    v_cliente_nombre,
    v_cliente_telefono,
    v_cliente_contacto,
    p_request_key,
    v_payload_hash
  )
  RETURNING id INTO v_venta_id;

  FOR v_requested IN
    SELECT (item->>'variante_id')::UUID AS variante_id,
           (item->>'cantidad')::INTEGER AS cantidad
    FROM jsonb_array_elements(v_items) AS items(item)
    ORDER BY (item->>'variante_id')::UUID
  LOOP
    UPDATE public.variantes
    SET stock = stock - v_requested.cantidad
    WHERE id = v_requested.variante_id
      AND stock >= v_requested.cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente para la variante %', v_requested.variante_id;
    END IF;
  END LOOP;

  INSERT INTO public.venta_items (
    venta_id,
    producto_id,
    variante_id,
    producto_nombre,
    talla,
    colegio,
    precio_unitario,
    descuento_porcentaje,
    precio_final,
    cantidad,
    subtotal
  )
  SELECT
    v_venta_id,
    i.producto_id,
    i.variante_id,
    i.producto_nombre,
    i.talla,
    i.colegio,
    i.precio_unitario,
    i.descuento_porcentaje,
    i.precio_final,
    i.cantidad,
    i.subtotal
  FROM jsonb_to_recordset(v_items) AS i(
    producto_id UUID,
    variante_id UUID,
    producto_nombre TEXT,
    talla TEXT,
    colegio TEXT,
    precio_unitario INTEGER,
    descuento_porcentaje INTEGER,
    precio_final INTEGER,
    cantidad INTEGER,
    subtotal BIGINT
  );

  UPDATE public.clientes
  SET total_compras = COALESCE(total_compras, 0) + v_subtotal::INTEGER,
      cantidad_compras = COALESCE(cantidad_compras, 0) + 1,
      ultima_compra = NOW()
  WHERE id = v_cliente_id;

  RETURN v_venta_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_venta_atomica(UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crear_venta_atomica(UUID, JSONB, TEXT) TO authenticated;

COMMIT;
