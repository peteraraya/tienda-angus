-- Política para eliminación de productos (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden eliminar productos"
  ON productos FOR DELETE
  USING (auth.role() = 'authenticated');
