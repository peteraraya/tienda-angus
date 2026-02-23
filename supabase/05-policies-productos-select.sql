-- Política para lectura pública de productos
CREATE POLICY "Productos son visibles públicamente"
  ON productos FOR SELECT
  USING (true);
