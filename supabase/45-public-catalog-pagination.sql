-- Public storefront catalog endpoint: bounded page size and public fields only.
CREATE OR REPLACE FUNCTION public.get_public_catalog_page(
  p_search TEXT DEFAULT '',
  p_category TEXT DEFAULT '',
  p_school TEXT DEFAULT '',
  p_size TEXT DEFAULT '',
  p_favorites_only BOOLEAN DEFAULT FALSE,
  p_favorite_ids UUID[] DEFAULT '{}',
  p_offers_only BOOLEAN DEFAULT FALSE,
  p_sort TEXT DEFAULT 'newest',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_page INTEGER := LEAST(GREATEST(COALESCE(p_page, 1), 1), 10000);
  v_page_size INTEGER := LEAST(GREATEST(COALESCE(p_page_size, 12), 1), 24);
  v_search TEXT := TRANSLATE(LEFT(LOWER(BTRIM(COALESCE(p_search, ''))), 100), 'áéíóúüñ', 'aeiouun');
  v_result JSONB;
BEGIN
  WITH public_products AS (
    SELECT
      p.id, p.nombre, p.descripcion, p.precio, p.categoria, p.imagen_url, p.imagenes,
      p.descuento_porcentaje, p.en_oferta, p.created_at,
      COALESCE(SUM(v.stock), 0)::INTEGER AS stock_total,
      MIN(COALESCE(v.precio, p.precio)) FILTER (WHERE v.stock > 0) AS precio_desde
    FROM public.productos p
    LEFT JOIN public.variantes v ON v.producto_id = p.id
    WHERE (p.activo IS NULL OR p.activo = TRUE)
    GROUP BY p.id
  ),
  filtered AS (
    SELECT pp.*
    FROM public_products pp
    WHERE
      (COALESCE(p_category, '') = '' OR pp.categoria = p_category)
      AND (NOT p_favorites_only OR pp.id = ANY(COALESCE(p_favorite_ids, '{}'::UUID[])))
      AND (NOT p_offers_only OR pp.en_oferta = TRUE OR COALESCE(pp.descuento_porcentaje, 0) > 0)
      AND (
        COALESCE(p_school, '') = '' AND COALESCE(p_size, '') = ''
        OR EXISTS (
          SELECT 1 FROM public.variantes fv
          WHERE fv.producto_id = pp.id AND fv.stock > 0
            AND (COALESCE(p_school, '') = '' OR fv.colegio = p_school)
            AND (COALESCE(p_size, '') = '' OR fv.talla = p_size)
        )
      )
      AND (
        v_search = ''
        OR NOT EXISTS (
          SELECT 1
          FROM REGEXP_SPLIT_TO_TABLE(v_search, '\s+') AS terms(token)
          WHERE POSITION(terms.token IN TRANSLATE(LOWER(CONCAT_WS(
            ' ', pp.nombre, pp.descripcion, pp.categoria,
            (SELECT STRING_AGG(CONCAT_WS(' ', sv.talla, sv.colegio), ' ')
             FROM public.variantes sv WHERE sv.producto_id = pp.id AND sv.stock > 0)
          )), 'áéíóúüñ', 'aeiouun')) = 0
        )
      )
  ),
  ordered AS (
    SELECT f.*,
      ROW_NUMBER() OVER (ORDER BY
        CASE WHEN p_sort = 'price-asc' THEN COALESCE(f.precio_desde, f.precio) * (1 - LEAST(GREATEST(COALESCE(f.descuento_porcentaje, 0), 0), 100)::NUMERIC / 100) END ASC,
        CASE WHEN p_sort = 'price-desc' THEN COALESCE(f.precio_desde, f.precio) * (1 - LEAST(GREATEST(COALESCE(f.descuento_porcentaje, 0), 0), 100)::NUMERIC / 100) END DESC,
        CASE WHEN p_sort = 'name-asc' THEN f.nombre END ASC,
        CASE WHEN p_sort = 'name-desc' THEN f.nombre END DESC,
        CASE WHEN p_sort = 'stock-desc' THEN f.stock_total END DESC,
        CASE WHEN p_sort NOT IN ('price-asc', 'price-desc', 'name-asc', 'name-desc', 'stock-desc') THEN f.created_at END DESC,
        f.id ASC
      ) AS row_number
    FROM filtered f
  ),
  page_products AS (
    SELECT * FROM ordered
    WHERE row_number > (v_page - 1) * v_page_size
      AND row_number <= v_page * v_page_size
  ),
  page_with_variants AS (
    SELECT pp.*,
      COALESCE((
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'id', v.id, 'talla', v.talla, 'colegio', v.colegio,
          'stock', v.stock, 'precio', v.precio
        ) ORDER BY v.created_at ASC, v.id ASC)
        FROM public.variantes v WHERE v.producto_id = pp.id
      ), '[]'::JSONB) AS variantes
    FROM page_products pp
  ),
  facets AS (
    SELECT
      COALESCE((SELECT JSONB_AGG(DISTINCT categoria ORDER BY categoria) FROM public_products WHERE NULLIF(categoria, '') IS NOT NULL), '[]'::JSONB) AS categories,
      COALESCE((SELECT JSONB_AGG(DISTINCT v.talla ORDER BY v.talla)
        FROM public.variantes v JOIN public.productos p ON p.id = v.producto_id
        WHERE v.stock > 0 AND v.talla <> 'Única' AND (p.activo IS NULL OR p.activo = TRUE)), '[]'::JSONB) AS sizes,
      COALESCE((SELECT JSONB_AGG(DISTINCT v.colegio ORDER BY v.colegio)
        FROM public.variantes v JOIN public.productos p ON p.id = v.producto_id
        WHERE v.stock > 0 AND v.colegio <> 'General' AND NULLIF(v.colegio, '') IS NOT NULL
          AND (p.activo IS NULL OR p.activo = TRUE)), '[]'::JSONB) AS schools
  )
  SELECT JSONB_BUILD_OBJECT(
    'products', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', id, 'nombre', nombre, 'descripcion', descripcion, 'precio', precio,
      'categoria', categoria, 'imagen_url', imagen_url, 'imagenes', imagenes,
      'descuento_porcentaje', descuento_porcentaje, 'en_oferta', en_oferta,
      'created_at', created_at, 'variantes', variantes,
      'stock_total', stock_total
    ) ORDER BY row_number) FROM page_with_variants), '[]'::JSONB),
    'total', (SELECT COUNT(*) FROM filtered),
    'categories', facets.categories,
    'sizes', facets.sizes,
    'schools', facets.schools
  )
  INTO v_result
  FROM facets;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_catalog_page(TEXT, TEXT, TEXT, TEXT, BOOLEAN, UUID[], BOOLEAN, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_catalog_page(TEXT, TEXT, TEXT, TEXT, BOOLEAN, UUID[], BOOLEAN, TEXT, INTEGER, INTEGER)
  TO anon, authenticated;
