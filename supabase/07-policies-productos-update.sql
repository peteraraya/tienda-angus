-- Política para actualización de productos (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden actualizar productos"
  ON productos FOR UPDATE
  USING (auth.role() = 'authenticated');
