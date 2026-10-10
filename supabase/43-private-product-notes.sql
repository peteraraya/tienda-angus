-- Move administrator-only product notes out of the publicly readable catalog.
-- Existing databases should apply this migration instead of rerunning the full schema.
BEGIN;

CREATE TABLE IF NOT EXISTS public.producto_notas (
  producto_id UUID PRIMARY KEY REFERENCES public.productos(id) ON DELETE CASCADE,
  notas TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.producto_notas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.producto_notas FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.producto_notas TO authenticated;

DROP POLICY IF EXISTS "Administrador único de notas de productos" ON public.producto_notas;
CREATE POLICY "Administrador único de notas de productos"
  ON public.producto_notas FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.producto_notas (producto_id, notas)
SELECT id, BTRIM(notas)
FROM public.productos
WHERE NULLIF(BTRIM(notas), '') IS NOT NULL
ON CONFLICT (producto_id) DO NOTHING;

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

UPDATE public.productos
SET notas = NULL
WHERE notas IS NOT NULL;

DROP TRIGGER IF EXISTS sync_legacy_product_notes ON public.productos;
CREATE TRIGGER sync_legacy_product_notes
  BEFORE INSERT OR UPDATE OF notas ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.sync_legacy_product_notes();

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
    SELECT
      p.id,
      COALESCE(SUM(v.stock), 0)::INTEGER AS stock_total,
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
          SELECT 1
          FROM public.variantes AS vf
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
          SELECT 1
          FROM public.variantes AS vs
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
    SELECT fp.*
    FROM filtered_products AS fp
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
    SELECT
      COALESCE(SUM(v.stock), 0)::INTEGER AS total_stock,
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

COMMIT;
