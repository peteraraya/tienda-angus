-- Índices para optimizar consultas frecuentes
-- Ejecutar después de crear todas las tablas

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_en_oferta ON productos(en_oferta) WHERE en_oferta = true;
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at DESC);

-- Índices para variantes (consultas más frecuentes)
CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_colegio ON variantes(colegio);
CREATE INDEX IF NOT EXISTS idx_variantes_stock ON variantes(stock);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_colegio ON variantes(producto_id, colegio);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at DESC);

-- Índices para venta_items
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_variante_id ON venta_items(variante_id);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_ultima_compra ON clientes(ultima_compra DESC);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor_id ON pedidos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_esperada ON pedidos(fecha_esperada);

-- Índices para pedido_items
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_insumo_id ON pedido_items(insumo_id);

-- Índices para insumos
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_stock_bajo ON insumos(stock_actual) WHERE stock_actual <= stock_minimo;
CREATE INDEX IF NOT EXISTS idx_insumos_activo ON insumos(activo) WHERE activo = true;

-- Índices para proveedores
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);

-- Índices para colegios y categorías
CREATE INDEX IF NOT EXISTS idx_colegios_activo ON colegios(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_colegios_nombre ON colegios(nombre);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON categorias(nombre);

-- Índice de búsqueda full-text para productos (español)
CREATE INDEX IF NOT EXISTS idx_productos_search ON productos 
USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- Índice de búsqueda full-text para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_search ON clientes 
USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(contacto, '') || ' ' || COALESCE(telefono, '')));

-- Índice de búsqueda full-text para insumos
CREATE INDEX IF NOT EXISTS idx_insumos_search ON insumos 
USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

COMMENT ON INDEX idx_productos_categoria IS 'Optimiza filtrado por categoría';
COMMENT ON INDEX idx_variantes_producto_colegio IS 'Optimiza búsqueda de variantes por producto y colegio';
COMMENT ON INDEX idx_ventas_fecha IS 'Optimiza consultas de ventas por fecha';
COMMENT ON INDEX idx_productos_search IS 'Búsqueda full-text en productos';
