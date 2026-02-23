-- Política para actualización de variantes (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden actualizar variantes"
  ON variantes FOR UPDATE
  USING (auth.role() = 'authenticated');
