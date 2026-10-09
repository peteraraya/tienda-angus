-- Restrict private administrative data and writes to the single designated admin.
-- Set app_metadata.role = "admin" only for the administrator in Supabase Auth.

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
        'pedido_items', 'whatsapp_messages', 'whatsapp_templates', 'whatsapp_config'
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
    'stockBajo', (
      SELECT COALESCE(SUM(stock), 0)
      FROM public.variantes WHERE stock BETWEEN 1 AND 6
    ),
    'pedidosPendientes', (
      SELECT COUNT(*) FROM public.pedidos WHERE estado = 'pendiente'
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
