// Script para poblar la base de datos con datos dummy
// Ejecutar con: npx tsx scripts/seedDummyData.ts

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  dummyColegios,
  dummyCategorias,
  dummyProductos,
  dummyVariantes,
  dummyProveedores,
  dummyInsumos,
  dummyClientes,
  dummyPedidos,
  dummyVentas,
} from '../lib/dummyData'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n📝 Para usar este script necesitas agregar SUPABASE_SERVICE_ROLE_KEY a tu .env.local')
  console.error('   Puedes encontrarla en: Supabase Dashboard > Project Settings > API > service_role key')
  console.error('   ⚠️  IMPORTANTE: Esta key NO debe usarse en el frontend, solo en scripts de servidor\n')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log('🌱 Iniciando población de datos dummy...\n')

  try {
    // 1. Colegios
    console.log('📚 Insertando colegios...')
    const { error: colegiosError } = await supabase
      .from('colegios')
      .upsert(dummyColegios, { onConflict: 'id' })
    if (colegiosError) throw colegiosError
    console.log(`✅ ${dummyColegios.length} colegios insertados\n`)

    // 2. Categorías
    console.log('📁 Insertando categorías...')
    const { error: categoriasError } = await supabase
      .from('categorias')
      .upsert(dummyCategorias, { onConflict: 'id' })
    if (categoriasError) throw categoriasError
    console.log(`✅ ${dummyCategorias.length} categorías insertadas\n`)

    // 3. Productos
    console.log('👕 Insertando productos...')
    const { error: productosError } = await supabase
      .from('productos')
      .upsert(dummyProductos, { onConflict: 'id' })
    if (productosError) throw productosError
    console.log(`✅ ${dummyProductos.length} productos insertados\n`)

    // 4. Variantes
    console.log('📦 Insertando variantes...')
    const { error: variantesError } = await supabase
      .from('variantes')
      .upsert(dummyVariantes, { onConflict: 'id' })
    if (variantesError) throw variantesError
    console.log(`✅ ${dummyVariantes.length} variantes insertadas\n`)

    // 5. Proveedores
    console.log('🏭 Insertando proveedores...')
    const { error: proveedoresError } = await supabase
      .from('proveedores')
      .upsert(dummyProveedores, { onConflict: 'id' })
    if (proveedoresError) throw proveedoresError
    console.log(`✅ ${dummyProveedores.length} proveedores insertados\n`)

    // 6. Insumos
    console.log('🧵 Insertando insumos...')
    const { error: insumosError } = await supabase
      .from('insumos')
      .upsert(dummyInsumos, { onConflict: 'id' })
    if (insumosError) throw insumosError
    console.log(`✅ ${dummyInsumos.length} insumos insertados\n`)

    // 7. Clientes
    console.log('👥 Insertando clientes...')
    const { error: clientesError } = await supabase
      .from('clientes')
      .upsert(dummyClientes, { onConflict: 'id' })
    if (clientesError) throw clientesError
    console.log(`✅ ${dummyClientes.length} clientes insertados\n`)

    // 8. Pedidos
    console.log('📋 Insertando pedidos...')
    const { error: pedidosError } = await supabase
      .from('pedidos')
      .upsert(dummyPedidos, { onConflict: 'id' })
    if (pedidosError) throw pedidosError
    console.log(`✅ ${dummyPedidos.length} pedidos insertados\n`)

    // 9. Ventas
    console.log('💰 Insertando ventas...')
    const { error: ventasError } = await supabase
      .from('ventas')
      .upsert(dummyVentas, { onConflict: 'id' })
    if (ventasError) throw ventasError
    console.log(`✅ ${dummyVentas.length} ventas insertadas\n`)

    console.log('🎉 ¡Datos dummy insertados exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`   - ${dummyColegios.length} colegios`)
    console.log(`   - ${dummyCategorias.length} categorías`)
    console.log(`   - ${dummyProductos.length} productos`)
    console.log(`   - ${dummyVariantes.length} variantes`)
    console.log(`   - ${dummyProveedores.length} proveedores`)
    console.log(`   - ${dummyInsumos.length} insumos`)
    console.log(`   - ${dummyClientes.length} clientes`)
    console.log(`   - ${dummyPedidos.length} pedidos`)
    console.log(`   - ${dummyVentas.length} ventas`)

  } catch (error) {
    console.error('❌ Error al insertar datos:', error)
    process.exit(1)
  }
}

seedData()
