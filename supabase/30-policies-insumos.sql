-- Habilitar RLS en insumos
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Políticas para insumos (acceso público para lectura, autenticado para escritura)
CREATE POLICY "Permitir lectura pública de insumos"
  ON insumos FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción autenticada de insumos"
  ON insumos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización autenticada de insumos"
  ON insumos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación autenticada de insumos"
  ON insumos FOR DELETE
  USING (auth.role() = 'authenticated');
