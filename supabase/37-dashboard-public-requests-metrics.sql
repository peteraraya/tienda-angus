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
