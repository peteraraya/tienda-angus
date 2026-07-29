-- Agregar columna precio a la tabla de variantes
ALTER TABLE variantes ADD COLUMN precio NUMERIC;

-- Crear una política o simplemente es opcional
-- Si precio es null, se usará el precio base del producto
