-- Habilitar RLS en tabla de clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes (SELECT)
CREATE POLICY "Permitir lectura de clientes a todos"
  ON clientes FOR SELECT
  USING (true);

-- Políticas para clientes (INSERT)
CREATE POLICY "Permitir inserción de clientes a todos"
  ON clientes FOR INSERT
  WITH CHECK (true);

-- Políticas para clientes (UPDATE)
CREATE POLICY "Permitir actualización de clientes a todos"
  ON clientes FOR UPDATE
  USING (true);

-- Políticas para clientes (DELETE)
CREATE POLICY "Permitir eliminación de clientes a todos"
  ON clientes FOR DELETE
  USING (true);
