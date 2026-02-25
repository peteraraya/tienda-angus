-- Agregar campo de notas a la tabla productos

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Comentario: Campo para que el administrador pueda agregar notas personales sobre cada producto
-- Ejemplo: "Pedir más tela azul", "Revisar stock el viernes", etc.
