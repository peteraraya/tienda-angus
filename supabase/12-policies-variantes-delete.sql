-- Política para eliminación de variantes (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden eliminar variantes"
  ON variantes FOR DELETE
  USING (auth.role() = 'authenticated');
