'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TALLAS_NUMERICAS = ['6', '8', '10', '12', '14', '16']
const TALLAS_LETRAS = ['S', 'M', 'L', 'XL']
const COLORES_DISPONIBLES = ['Blanco', 'Negro', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Rosa', 'Gris', 'Beige', 'Morado']

interface Variante {
  id?: string
  talla: string
  color: string
  stock: number
}

export default function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [productoId, setProductoId] = useState<string>('')
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    imagen_url: ''
  })
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [nuevaVariante, setNuevaVariante] = useState({
    talla: '',
    color: '',
    stock: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setProductoId(p.id)
      loadProducto(p.id)
    })
  }, [])

  async function loadProducto(id: string) {
    const { data: producto } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()

    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio.toString(),
        categoria: producto.categoria,
        imagen_url: producto.imagen_url || ''
      })
    }

    const { data: variantesData } = await supabase
      .from('variantes')
      .select('*')
      .eq('producto_id', id)

    if (variantesData) {
      setVariantes(variantesData)
    }

    setLoading(false)
  }

  function agregarVariante() {
    if (!nuevaVariante.talla || !nuevaVariante.color || !nuevaVariante.stock) {
      alert('Completa todos los campos de la variante')
      return
    }

    const existe = variantes.find(
      v => v.talla === nuevaVariante.talla && v.color === nuevaVariante.color
    )

    if (existe) {
      alert('Ya existe una variante con esa talla y color')
      return
    }

    setVariantes([...variantes, {
      talla: nuevaVariante.talla,
      color: nuevaVariante.color,
      stock: parseInt(nuevaVariante.stock)
    }])

    setNuevaVariante({ talla: '', color: '', stock: '' })
  }

  function eliminarVariante(index: number) {
    setVariantes(variantes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (variantes.length === 0) {
      alert('Debes tener al menos una variante')
      return
    }

    // Actualizar producto
    const { error: errorProducto } = await supabase
      .from('productos')
      .update({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: formData.categoria,
        imagen_url: formData.imagen_url || null
      })
      .eq('id', productoId)

    if (errorProducto) {
      alert('Error al actualizar producto')
      return
    }

    // Eliminar variantes antiguas
    await supabase.from('variantes').delete().eq('producto_id', productoId)

    // Insertar nuevas variantes
    const variantesConProductoId = variantes.map(v => ({
      producto_id: productoId,
      talla: v.talla,
      color: v.color,
      stock: v.stock
    }))

    const { error: errorVariantes } = await supabase
      .from('variantes')
      .insert(variantesConProductoId)

    if (errorVariantes) {
      alert('Error al actualizar variantes')
      return
    }

    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando producto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Editar Producto</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Nombre del Producto</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">Precio ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) => setFormData({...formData, precio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">Categoría</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">URL de Imagen</label>
            <input
              type="url"
              value={formData.imagen_url}
              onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.imagen_url && (
              <div className="mt-4">
                <img 
                  src={formData.imagen_url} 
                  alt="Preview" 
                  className="w-48 h-48 object-cover rounded-lg border"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Variantes (Tallas y Colores)</h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700 text-sm">Talla</label>
                  <select
                    value={nuevaVariante.talla}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, talla: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar</option>
                    <optgroup label="Tallas Numéricas">
                      {TALLAS_NUMERICAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="Tallas Letras">
                      {TALLAS_LETRAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700 text-sm">Color</label>
                  <select
                    value={nuevaVariante.color}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, color: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar</option>
                    {COLORES_DISPONIBLES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700 text-sm">Stock</label>
                  <input
                    type="number"
                    value={nuevaVariante.stock}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, stock: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={agregarVariante}
                    className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {variantes.length > 0 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left text-sm font-bold">Talla</th>
                      <th className="p-3 text-left text-sm font-bold">Color</th>
                      <th className="p-3 text-left text-sm font-bold">Stock</th>
                      <th className="p-3 text-left text-sm font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantes.map((v, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-semibold">{v.talla}</td>
                        <td className="p-3">{v.color}</td>
                        <td className="p-3 font-semibold text-green-600">{v.stock}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => eliminarVariante(index)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              Actualizar Producto
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="flex-1 bg-gray-600 text-white p-4 rounded-lg font-semibold hover:bg-gray-700 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
