-- Políticas RLS para tabla categorias

-- Política SELECT: Permitir lectura a todos
CREATE POLICY "Permitir lectura de categorias a todos"
ON categorias FOR SELECT
TO public
USING (true);

-- Política INSERT: Permitir inserción a usuarios autenticados
CREATE POLICY "Permitir inserción de categorias a usuarios autenticados"
ON categorias FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política UPDATE: Permitir actualización a usuarios autenticados
CREATE POLICY "Permitir actualización de categorias a usuarios autenticados"
ON categorias FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir eliminación a usuarios autenticados
CREATE POLICY "Permitir eliminación de categorias a usuarios autenticados"
ON categorias FOR DELETE
TO authenticated
USING (true);
