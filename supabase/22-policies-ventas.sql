-- Habilitar RLS en tablas de ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

-- Políticas para ventas (SELECT)
CREATE POLICY "Permitir lectura de ventas a todos"
  ON ventas FOR SELECT
  USING (true);

-- Políticas para ventas (INSERT)
CREATE POLICY "Permitir inserción de ventas a todos"
  ON ventas FOR INSERT
  WITH CHECK (true);

-- Políticas para ventas (UPDATE)
CREATE POLICY "Permitir actualización de ventas a todos"
  ON ventas FOR UPDATE
  USING (true);

-- Políticas para ventas (DELETE)
CREATE POLICY "Permitir eliminación de ventas a todos"
  ON ventas FOR DELETE
  USING (true);

-- Políticas para venta_items (SELECT)
CREATE POLICY "Permitir lectura de items de venta a todos"
  ON venta_items FOR SELECT
  USING (true);

-- Políticas para venta_items (INSERT)
CREATE POLICY "Permitir inserción de items de venta a todos"
  ON venta_items FOR INSERT
  WITH CHECK (true);

-- Políticas para venta_items (UPDATE)
CREATE POLICY "Permitir actualización de items de venta a todos"
  ON venta_items FOR UPDATE
  USING (true);

-- Políticas para venta_items (DELETE)
CREATE POLICY "Permitir eliminación de items de venta a todos"
  ON venta_items FOR DELETE
  USING (true);
