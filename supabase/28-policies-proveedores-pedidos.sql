-- Habilitar RLS en tablas
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;

-- Políticas para proveedores
CREATE POLICY "Permitir lectura de proveedores a todos"
  ON proveedores FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de proveedores a todos"
  ON proveedores FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de proveedores a todos"
  ON proveedores FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de proveedores a todos"
  ON proveedores FOR DELETE USING (true);

-- Políticas para pedidos
CREATE POLICY "Permitir lectura de pedidos a todos"
  ON pedidos FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de pedidos a todos"
  ON pedidos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de pedidos a todos"
  ON pedidos FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de pedidos a todos"
  ON pedidos FOR DELETE USING (true);

-- Políticas para pedido_items
CREATE POLICY "Permitir lectura de items de pedido a todos"
  ON pedido_items FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de items de pedido a todos"
  ON pedido_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de items de pedido a todos"
  ON pedido_items FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de items de pedido a todos"
  ON pedido_items FOR DELETE USING (true);
