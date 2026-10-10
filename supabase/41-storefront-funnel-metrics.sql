-- Agrega conteos diarios anónimos del embudo público, sin consultas,
-- identificadores de producto, IP ni datos de contacto.
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
