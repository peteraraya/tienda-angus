-- Política para inserción de productos (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden insertar productos"
  ON productos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
