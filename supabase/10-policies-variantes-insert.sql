-- Política para inserción de variantes (solo usuarios autenticados)
CREATE POLICY "Solo usuarios autenticados pueden insertar variantes"
  ON variantes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
