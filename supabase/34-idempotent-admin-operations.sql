-- Keep multi-row administrative operations atomic and safe to retry.
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE colegios
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE insumos
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS idempotency_key UUID,
  ADD COLUMN IF NOT EXISTS idempotency_payload TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_idempotency_key
  ON productos (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_idempotency_key
  ON ventas (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_idempotency_key
  ON categorias (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_colegios_idempotency_key
  ON colegios (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_insumos_idempotency_key
  ON insumos (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proveedores_idempotency_key
  ON proveedores (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_idempotency_key
  ON clientes (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_idempotency_key
  ON pedidos (idempotency_key);

ALTER TABLE variantes
  ADD COLUMN IF NOT EXISTS update_request_key UUID,
  ADD COLUMN IF NOT EXISTS stock_at_last_update INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_variantes_update_request_key
  ON variantes (update_request_key);

CREATE OR REPLACE FUNCTION crear_producto_con_variantes(
  p_request_key UUID,
  p_data JSONB,
  p_variantes JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_producto_id UUID;
  v_existing_payload TEXT;
  v_payload JSONB;
  v_payload_hash TEXT;
BEGIN
  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;

  IF jsonb_typeof(COALESCE(p_variantes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Las variantes deben ser una lista';
  END IF;

  IF (p_data->>'precio')::NUMERIC < 0
     OR EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
         AS v(stock INTEGER, precio NUMERIC)
       WHERE v.stock IS NULL OR v.stock < 0 OR v.precio < 0
     ) THEN
    RAISE EXCEPTION 'El precio y el stock no pueden ser negativos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
      AS v(talla TEXT, colegio TEXT)
    GROUP BY v.talla, v.colegio
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'No se permiten variantes duplicadas para la misma talla y colegio';
  END IF;

  v_payload := jsonb_build_object(
    'producto', p_data,
    'variantes', COALESCE(p_variantes, '[]'::jsonb)
  );
  v_payload_hash := encode(digest(v_payload::TEXT, 'sha256'), 'hex');

  INSERT INTO productos (
    nombre,
    descripcion,
    precio,
    categoria,
    imagen_url,
    imagenes,
    descuento_porcentaje,
    en_oferta,
    notas,
    activo,
    idempotency_key,
    idempotency_payload
  )
  VALUES (
    p_data->>'nombre',
    p_data->>'descripcion',
    (p_data->>'precio')::NUMERIC,
    p_data->>'categoria',
    p_data->>'imagen_url',
    CASE
      WHEN jsonb_typeof(p_data->'imagenes') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'imagenes'))
      ELSE NULL
    END,
    COALESCE((p_data->>'descuento_porcentaje')::INTEGER, 0),
    COALESCE((p_data->>'en_oferta')::BOOLEAN, false),
    p_data->>'notas',
    COALESCE((p_data->>'activo')::BOOLEAN, true),
    p_request_key,
    v_payload_hash
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_producto_id;

  IF v_producto_id IS NULL THEN
    SELECT id, idempotency_payload
      INTO v_producto_id, v_existing_payload
    FROM productos
    WHERE idempotency_key = p_request_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se pudo recuperar el producto asociado a la solicitud';
    END IF;

    IF v_existing_payload IS DISTINCT FROM v_payload_hash THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;

    RETURN v_producto_id;
  END IF;

  INSERT INTO variantes (producto_id, talla, colegio, stock, precio)
  SELECT v_producto_id, v.talla, v.colegio, v.stock, v.precio
  FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
    AS v(talla TEXT, colegio TEXT, stock INTEGER, precio NUMERIC);

  RETURN v_producto_id;
END;
$$;

CREATE OR REPLACE FUNCTION actualizar_producto_con_variantes(
  p_producto_id UUID,
  p_data JSONB,
  p_variantes JSONB,
  p_request_key UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_input RECORD;
  v_existing RECORD;
  v_variante_id UUID;
  v_actual_stock INTEGER;
  v_update_request_key UUID;
  v_stock_at_last_update INTEGER;
  v_variant_found BOOLEAN;
BEGIN
  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;

  IF jsonb_typeof(COALESCE(p_variantes, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Las variantes deben ser una lista';
  END IF;

  IF (p_data->>'precio')::NUMERIC < 0
     OR EXISTS (
       SELECT 1
       FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
         AS v(stock INTEGER, precio NUMERIC)
       WHERE v.stock IS NULL OR v.stock < 0 OR v.precio < 0
     ) THEN
    RAISE EXCEPTION 'El precio y el stock no pueden ser negativos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
      AS v(talla TEXT, colegio TEXT)
    GROUP BY v.talla, v.colegio
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'No se permiten variantes duplicadas para la misma talla y colegio';
  END IF;

  UPDATE productos
  SET nombre = p_data->>'nombre',
      descripcion = p_data->>'descripcion',
      precio = (p_data->>'precio')::NUMERIC,
      categoria = p_data->>'categoria',
      imagen_url = p_data->>'imagen_url',
      imagenes = CASE
        WHEN jsonb_typeof(p_data->'imagenes') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'imagenes'))
        ELSE NULL
      END,
      descuento_porcentaje = COALESCE((p_data->>'descuento_porcentaje')::INTEGER, 0),
      en_oferta = COALESCE((p_data->>'en_oferta')::BOOLEAN, false),
      notas = p_data->>'notas',
      activo = COALESCE((p_data->>'activo')::BOOLEAN, true)
  WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el producto %', p_producto_id;
  END IF;

  FOR v_input IN
    SELECT v.id, v.stock_original, v.talla, v.colegio, v.stock, v.precio
    FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
      AS v(id UUID, stock_original INTEGER, talla TEXT, colegio TEXT, stock INTEGER, precio NUMERIC)
  LOOP
    IF v_input.id IS NOT NULL THEN
      SELECT id, stock, update_request_key, stock_at_last_update
        INTO v_variante_id, v_actual_stock, v_update_request_key, v_stock_at_last_update
      FROM variantes
      WHERE id = v_input.id AND producto_id = p_producto_id
      FOR UPDATE;
      v_variant_found := FOUND;
    ELSE
      v_variante_id := NULL;
      v_variant_found := false;
    END IF;

    IF v_variant_found THEN
      IF v_update_request_key = p_request_key
         AND v_stock_at_last_update IS NOT DISTINCT FROM v_input.stock THEN
        CONTINUE;
      END IF;

      IF v_input.stock_original IS NOT NULL
         AND v_actual_stock IS DISTINCT FROM v_input.stock_original THEN
        RAISE EXCEPTION 'El stock de la variante cambió desde que se cargó el formulario. Recarga el producto antes de guardar';
      END IF;

      UPDATE variantes
      SET stock = v_input.stock,
          precio = v_input.precio,
          update_request_key = p_request_key,
          stock_at_last_update = v_input.stock
      WHERE id = v_variante_id;
    ELSE
      INSERT INTO variantes (id, producto_id, talla, colegio, stock, precio, update_request_key, stock_at_last_update)
      VALUES (COALESCE(v_input.id, gen_random_uuid()), p_producto_id, v_input.talla, v_input.colegio, v_input.stock, v_input.precio, p_request_key, v_input.stock);
    END IF;
  END LOOP;

  FOR v_existing IN
    SELECT id, talla, colegio
    FROM variantes
    WHERE producto_id = p_producto_id
    FOR UPDATE
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM jsonb_to_recordset(COALESCE(p_variantes, '[]'::jsonb))
        AS v(talla TEXT, colegio TEXT)
      WHERE v.talla = v_existing.talla
        AND v.colegio = v_existing.colegio
    ) THEN
      IF EXISTS (SELECT 1 FROM venta_items WHERE variante_id = v_existing.id)
         OR EXISTS (SELECT 1 FROM pedido_items WHERE variante_id = v_existing.id) THEN
        UPDATE variantes SET stock = 0 WHERE id = v_existing.id;
      ELSE
        DELETE FROM variantes WHERE id = v_existing.id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION crear_venta_atomica(
  p_request_key UUID,
  p_payload JSONB,
  p_vendedor TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_venta_id UUID;
  v_existing_payload TEXT;
  v_requested RECORD;
BEGIN
  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;

  IF jsonb_typeof(p_payload->'items') <> 'array'
     OR jsonb_array_length(p_payload->'items') = 0 THEN
    RAISE EXCEPTION 'La venta debe contener al menos un producto';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items') AS i(cantidad INTEGER)
    WHERE i.cantidad IS NULL OR i.cantidad <= 0
  ) THEN
    RAISE EXCEPTION 'Las cantidades de venta deben ser mayores que cero';
  END IF;

  INSERT INTO ventas (
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
    (p_payload->>'total')::INTEGER,
    (p_payload->>'subtotal')::INTEGER,
    COALESCE((p_payload->>'descuento_total')::INTEGER, 0),
    (p_payload->>'cantidad_items')::INTEGER,
    p_payload->>'notas',
    p_vendedor,
    (p_payload->>'cliente_id')::UUID,
    p_payload->>'cliente_nombre',
    p_payload->>'cliente_telefono',
    p_payload->>'cliente_contacto',
    p_request_key,
    encode(digest(p_payload::TEXT, 'sha256'), 'hex')
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_venta_id;

  IF v_venta_id IS NULL THEN
    SELECT id, idempotency_payload
      INTO v_venta_id, v_existing_payload
    FROM ventas
    WHERE idempotency_key = p_request_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se pudo recuperar la venta asociada a la solicitud';
    END IF;

    IF v_existing_payload IS DISTINCT FROM encode(digest(p_payload::TEXT, 'sha256'), 'hex') THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;

    RETURN v_venta_id;
  END IF;

  FOR v_requested IN
    SELECT (item->>'variante_id')::UUID AS variante_id,
           SUM((item->>'cantidad')::INTEGER)::INTEGER AS cantidad
    FROM jsonb_array_elements(p_payload->'items') AS items(item)
    GROUP BY (item->>'variante_id')::UUID
  LOOP
    UPDATE variantes
    SET stock = stock - v_requested.cantidad
    WHERE id = v_requested.variante_id
      AND stock >= v_requested.cantidad;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock insuficiente o variante inexistente: %',
        v_requested.variante_id;
    END IF;
  END LOOP;

  INSERT INTO venta_items (
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
  FROM jsonb_to_recordset(p_payload->'items') AS i(
    producto_id UUID,
    variante_id UUID,
    producto_nombre TEXT,
    talla TEXT,
    colegio TEXT,
    precio_unitario INTEGER,
    descuento_porcentaje INTEGER,
    precio_final INTEGER,
    cantidad INTEGER,
    subtotal INTEGER
  );

  UPDATE clientes
  SET total_compras = COALESCE(total_compras, 0) + (p_payload->>'total')::INTEGER,
      cantidad_compras = COALESCE(cantidad_compras, 0) + 1,
      ultima_compra = NOW()
  WHERE id = (p_payload->>'cliente_id')::UUID;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el cliente de la venta';
  END IF;

  RETURN v_venta_id;
END;
$$;

CREATE OR REPLACE FUNCTION crear_pedido_atomico(
  p_request_key UUID,
  p_payload JSONB,
  p_usuario TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_existing_payload TEXT;
BEGIN
  IF p_request_key IS NULL THEN
    RAISE EXCEPTION 'La clave de idempotencia es obligatoria';
  END IF;

  IF jsonb_typeof(p_payload->'items') <> 'array'
     OR jsonb_array_length(p_payload->'items') = 0 THEN
    RAISE EXCEPTION 'El pedido debe contener al menos un insumo';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_payload->'items')
      AS i(insumo_id UUID, cantidad NUMERIC, precio_unitario NUMERIC)
    WHERE i.insumo_id IS NULL OR i.cantidad <= 0 OR i.precio_unitario <= 0
  ) THEN
    RAISE EXCEPTION 'El pedido contiene insumos, cantidades o precios inválidos';
  END IF;

  INSERT INTO pedidos (
    proveedor_id,
    proveedor_nombre,
    fecha_pedido,
    fecha_esperada,
    estado,
    total,
    cantidad_items,
    notas,
    usuario,
    idempotency_key,
    idempotency_payload
  )
  VALUES (
    (p_payload->>'proveedor_id')::UUID,
    p_payload->>'proveedor_nombre',
    COALESCE((p_payload->>'fecha_pedido')::TIMESTAMPTZ, NOW()),
    (p_payload->>'fecha_esperada')::TIMESTAMPTZ,
    'pendiente',
    (p_payload->>'total')::INTEGER,
    (p_payload->>'cantidad_items')::INTEGER,
    p_payload->>'notas',
    p_usuario,
    p_request_key,
    encode(digest(p_payload::TEXT, 'sha256'), 'hex')
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_pedido_id;

  IF v_pedido_id IS NULL THEN
    SELECT id, idempotency_payload
      INTO v_pedido_id, v_existing_payload
    FROM pedidos
    WHERE idempotency_key = p_request_key;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No se pudo recuperar el pedido asociado a la solicitud';
    END IF;

    IF v_existing_payload IS DISTINCT FROM encode(digest(p_payload::TEXT, 'sha256'), 'hex') THEN
      RAISE EXCEPTION 'La clave de idempotencia ya fue usada con otros datos';
    END IF;

    RETURN v_pedido_id;
  END IF;

  INSERT INTO pedido_items (
    pedido_id,
    insumo_id,
    insumo_nombre,
    unidad_medida,
    precio_unitario,
    cantidad,
    subtotal,
    recibido,
    cantidad_recibida
  )
  SELECT
    v_pedido_id,
    i.insumo_id,
    i.insumo_nombre,
    i.unidad_medida,
    i.precio_unitario,
    i.cantidad,
    i.subtotal,
    false,
    0
  FROM jsonb_to_recordset(p_payload->'items') AS i(
    insumo_id UUID,
    insumo_nombre TEXT,
    unidad_medida TEXT,
    precio_unitario INTEGER,
    cantidad INTEGER,
    subtotal INTEGER
  );

  RETURN v_pedido_id;
END;
$$;

CREATE OR REPLACE FUNCTION recibir_pedido_atomico(p_pedido_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_pedido RECORD;
  v_item RECORD;
  v_cantidad INTEGER;
BEGIN
  SELECT id, estado, proveedor_id, total
    INTO v_pedido
  FROM pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el pedido %', p_pedido_id;
  END IF;

  IF v_pedido.estado = 'recibido' THEN
    RETURN false;
  END IF;

  IF v_pedido.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Solo se pueden recibir pedidos pendientes';
  END IF;

  UPDATE pedidos
  SET estado = 'recibido',
      fecha_recepcion = NOW()
  WHERE id = p_pedido_id;

  FOR v_item IN
    SELECT id, variante_id, insumo_id, cantidad, cantidad_recibida
    FROM pedido_items
    WHERE pedido_id = p_pedido_id
    FOR UPDATE
  LOOP
    v_cantidad := COALESCE(NULLIF(v_item.cantidad_recibida, 0), v_item.cantidad);

    IF v_item.variante_id IS NOT NULL THEN
      UPDATE variantes
      SET stock = stock + v_cantidad
      WHERE id = v_item.variante_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró la variante %', v_item.variante_id;
      END IF;
    END IF;

    IF v_item.insumo_id IS NOT NULL THEN
      UPDATE insumos
      SET stock_actual = COALESCE(stock_actual, 0) + v_cantidad
      WHERE id = v_item.insumo_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró el insumo %', v_item.insumo_id;
      END IF;
    END IF;

    UPDATE pedido_items
    SET recibido = true,
        cantidad_recibida = v_cantidad
    WHERE id = v_item.id;
  END LOOP;

  UPDATE proveedores
  SET total_pedidos = COALESCE(total_pedidos, 0) + v_pedido.total,
      cantidad_pedidos = COALESCE(cantidad_pedidos, 0) + 1,
      ultimo_pedido = NOW()
  WHERE id = v_pedido.proveedor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el proveedor del pedido';
  END IF;

  RETURN true;
END;
$$;

-- Administrative/customer records must not remain writable through anon RLS.
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de clientes a todos" ON clientes;
DROP POLICY IF EXISTS "Permitir inserción de clientes a todos" ON clientes;
DROP POLICY IF EXISTS "Permitir actualización de clientes a todos" ON clientes;
DROP POLICY IF EXISTS "Permitir eliminación de clientes a todos" ON clientes;
DROP POLICY IF EXISTS "Administración autenticada de clientes" ON clientes;
CREATE POLICY "Administración autenticada de clientes"
  ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de ventas a todos" ON ventas;
DROP POLICY IF EXISTS "Permitir inserción de ventas a todos" ON ventas;
DROP POLICY IF EXISTS "Permitir actualización de ventas a todos" ON ventas;
DROP POLICY IF EXISTS "Permitir eliminación de ventas a todos" ON ventas;
DROP POLICY IF EXISTS "Administración autenticada de ventas" ON ventas;
CREATE POLICY "Administración autenticada de ventas"
  ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de items de venta a todos" ON venta_items;
DROP POLICY IF EXISTS "Permitir inserción de items de venta a todos" ON venta_items;
DROP POLICY IF EXISTS "Permitir actualización de items de venta a todos" ON venta_items;
DROP POLICY IF EXISTS "Permitir eliminación de items de venta a todos" ON venta_items;
DROP POLICY IF EXISTS "Administración autenticada de items de venta" ON venta_items;
CREATE POLICY "Administración autenticada de items de venta"
  ON venta_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de proveedores a todos" ON proveedores;
DROP POLICY IF EXISTS "Permitir inserción de proveedores a todos" ON proveedores;
DROP POLICY IF EXISTS "Permitir actualización de proveedores a todos" ON proveedores;
DROP POLICY IF EXISTS "Permitir eliminación de proveedores a todos" ON proveedores;
DROP POLICY IF EXISTS "Administración autenticada de proveedores" ON proveedores;
CREATE POLICY "Administración autenticada de proveedores"
  ON proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de pedidos a todos" ON pedidos;
DROP POLICY IF EXISTS "Permitir inserción de pedidos a todos" ON pedidos;
DROP POLICY IF EXISTS "Permitir actualización de pedidos a todos" ON pedidos;
DROP POLICY IF EXISTS "Permitir eliminación de pedidos a todos" ON pedidos;
DROP POLICY IF EXISTS "Administración autenticada de pedidos" ON pedidos;
CREATE POLICY "Administración autenticada de pedidos"
  ON pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de items de pedido a todos" ON pedido_items;
DROP POLICY IF EXISTS "Permitir inserción de items de pedido a todos" ON pedido_items;
DROP POLICY IF EXISTS "Permitir actualización de items de pedido a todos" ON pedido_items;
DROP POLICY IF EXISTS "Permitir eliminación de items de pedido a todos" ON pedido_items;
DROP POLICY IF EXISTS "Administración autenticada de items de pedido" ON pedido_items;
CREATE POLICY "Administración autenticada de items de pedido"
  ON pedido_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON FUNCTION crear_producto_con_variantes(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION actualizar_producto_con_variantes(UUID, JSONB, JSONB, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION crear_venta_atomica(UUID, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION crear_pedido_atomico(UUID, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION recibir_pedido_atomico(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION crear_producto_con_variantes(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_producto_con_variantes(UUID, JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION crear_venta_atomica(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION crear_pedido_atomico(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION recibir_pedido_atomico(UUID) TO authenticated;
