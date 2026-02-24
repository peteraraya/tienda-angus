-- Agregar campos de descuento a la tabla productos
ALTER TABLE productos 
ADD COLUMN descuento_porcentaje INTEGER DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
ADD COLUMN en_oferta BOOLEAN DEFAULT FALSE;

-- Comentarios para documentación
COMMENT ON COLUMN productos.descuento_porcentaje IS 'Porcentaje de descuento (0-100)';
COMMENT ON COLUMN productos.en_oferta IS 'Indica si el producto está en oferta';
