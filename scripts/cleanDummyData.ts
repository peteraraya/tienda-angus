// Script para limpiar datos dummy de la base de datos
// Ejecutar con: npx tsx scripts/cleanDummyData.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanData() {
  console.log('🧹 Iniciando limpieza de datos dummy...\n')

  try {
    // Eliminar en orden inverso por dependencias
    // Los IDs dummy tienen el formato: 00000000-0000-4000-8000-xxxNNNNNNNNNNN
    // donde xxx es el prefijo (c01, c02, p00, etc.)
    
    console.log('💰 Eliminando ventas dummy...')
    const { data: ventas } = await supabase.from('ventas').select('id')
    const ventasToDelete = ventas?.filter(v => v.id.startsWith('00000000-0000-4000-8000-vn0')) || []
    if (ventasToDelete.length > 0) {
      const { error: ventasError } = await supabase
        .from('ventas')
        .delete()
        .in('id', ventasToDelete.map(v => v.id))
      if (ventasError) throw ventasError
    }
    console.log(`✅ ${ventasToDelete.length} ventas eliminadas\n`)

    console.log('📋 Eliminando pedidos dummy...')
    const { data: pedidos } = await supabase.from('pedidos').select('id')
    const pedidosToDelete = pedidos?.filter(p => p.id.startsWith('00000000-0000-4000-8000-pe0')) || []
    if (pedidosToDelete.length > 0) {
      const { error: pedidosError } = await supabase
        .from('pedidos')
        .delete()
        .in('id', pedidosToDelete.map(p => p.id))
      if (pedidosError) throw pedidosError
    }
    console.log(`✅ ${pedidosToDelete.length} pedidos eliminados\n`)

    console.log('👥 Eliminando clientes dummy...')
    const { data: clientes } = await supabase.from('clientes').select('id')
    const clientesToDelete = clientes?.filter(c => c.id.startsWith('00000000-0000-4000-8000-cl0')) || []
    if (clientesToDelete.length > 0) {
      const { error: clientesError } = await supabase
        .from('clientes')
        .delete()
        .in('id', clientesToDelete.map(c => c.id))
      if (clientesError) throw clientesError
    }
    console.log(`✅ ${clientesToDelete.length} clientes eliminados\n`)

    console.log('🧵 Eliminando insumos dummy...')
    const { data: insumos } = await supabase.from('insumos').select('id')
    const insumosToDelete = insumos?.filter(i => i.id.startsWith('00000000-0000-4000-8000-i00')) || []
    if (insumosToDelete.length > 0) {
      const { error: insumosError } = await supabase
        .from('insumos')
        .delete()
        .in('id', insumosToDelete.map(i => i.id))
      if (insumosError) throw insumosError
    }
    console.log(`✅ ${insumosToDelete.length} insumos eliminados\n`)

    console.log('🏭 Eliminando proveedores dummy...')
    const { data: proveedores } = await supabase.from('proveedores').select('id')
    const proveedoresToDelete = proveedores?.filter(p => p.id.startsWith('00000000-0000-4000-8000-pr0')) || []
    if (proveedoresToDelete.length > 0) {
      const { error: proveedoresError } = await supabase
        .from('proveedores')
        .delete()
        .in('id', proveedoresToDelete.map(p => p.id))
      if (proveedoresError) throw proveedoresError
    }
    console.log(`✅ ${proveedoresToDelete.length} proveedores eliminados\n`)

    console.log('📦 Eliminando variantes dummy...')
    const { data: variantes } = await supabase.from('variantes').select('id')
    const variantesToDelete = variantes?.filter(v => v.id.startsWith('00000000-0000-4000-8000-v00')) || []
    if (variantesToDelete.length > 0) {
      const { error: variantesError } = await supabase
        .from('variantes')
        .delete()
        .in('id', variantesToDelete.map(v => v.id))
      if (variantesError) throw variantesError
    }
    console.log(`✅ ${variantesToDelete.length} variantes eliminadas\n`)

    console.log('👕 Eliminando productos dummy...')
    const { data: productos } = await supabase.from('productos').select('id')
    const productosToDelete = productos?.filter(p => p.id.startsWith('00000000-0000-4000-8000-p00')) || []
    if (productosToDelete.length > 0) {
      const { error: productosError } = await supabase
        .from('productos')
        .delete()
        .in('id', productosToDelete.map(p => p.id))
      if (productosError) throw productosError
    }
    console.log(`✅ ${productosToDelete.length} productos eliminados\n`)

    console.log('📁 Eliminando categorías dummy...')
    const { data: categorias } = await supabase.from('categorias').select('id')
    const categoriasToDelete = categorias?.filter(c => c.id.startsWith('00000000-0000-4000-8000-c02')) || []
    if (categoriasToDelete.length > 0) {
      const { error: categoriasError } = await supabase
        .from('categorias')
        .delete()
        .in('id', categoriasToDelete.map(c => c.id))
      if (categoriasError) throw categoriasError
    }
    console.log(`✅ ${categoriasToDelete.length} categorías eliminadas\n`)

    console.log('📚 Eliminando colegios dummy...')
    const { data: colegios } = await supabase.from('colegios').select('id')
    const colegiosToDelete = colegios?.filter(c => c.id.startsWith('00000000-0000-4000-8000-c01')) || []
    if (colegiosToDelete.length > 0) {
      const { error: colegiosError } = await supabase
        .from('colegios')
        .delete()
        .in('id', colegiosToDelete.map(c => c.id))
      if (colegiosError) throw colegiosError
    }
    console.log(`✅ ${colegiosToDelete.length} colegios eliminados\n`)

    console.log('🎉 ¡Datos dummy eliminados exitosamente!')

  } catch (error) {
    console.error('❌ Error al eliminar datos:', error)
    process.exit(1)
  }
}

cleanData()
