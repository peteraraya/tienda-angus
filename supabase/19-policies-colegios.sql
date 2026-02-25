-- Políticas RLS para tabla colegios

-- Política SELECT: Permitir lectura a todos
CREATE POLICY "Permitir lectura de colegios a todos"
ON colegios FOR SELECT
TO public
USING (true);

-- Política INSERT: Permitir inserción a usuarios autenticados
CREATE POLICY "Permitir inserción de colegios a usuarios autenticados"
ON colegios FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política UPDATE: Permitir actualización a usuarios autenticados
CREATE POLICY "Permitir actualización de colegios a usuarios autenticados"
ON colegios FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir eliminación a usuarios autenticados
CREATE POLICY "Permitir eliminación de colegios a usuarios autenticados"
ON colegios FOR DELETE
TO authenticated
USING (true);
