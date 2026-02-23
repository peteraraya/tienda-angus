-- Política para lectura pública de variantes
CREATE POLICY "Variantes son visibles públicamente"
  ON variantes FOR SELECT
  USING (true);
