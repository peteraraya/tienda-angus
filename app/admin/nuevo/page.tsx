'use client'

import { useState, useEffect } from 'react'
// LazyImage for admin previews
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button, Input, LazyImage } from '@/app/components/ui'

const TALLAS_NUMERICAS = ['6', '8', '10', '12', '14', '16']
const TALLAS_LETRAS = ['S', 'M', 'L', 'XL']

interface Variante {
  talla: string
  colegio: string
  stock: number
}

export default function NuevoProducto() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    imagen_url: '',
    descuento_porcentaje: '0',
    en_oferta: false
  })
  const [imagenes, setImagenes] = useState<string[]>([''])
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [colegios, setColegios] = useState<string[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [nuevaVariante, setNuevaVariante] = useState({
    talla: '',
    colegio: '',
    stock: ''
  })

  async function loadColegios() {
    const { data } = await supabase
      .from('colegios')
      .select('nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) {
      setColegios(data.map(c => c.nombre))
    }
  }

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) {
      setCategorias(data.map(c => c.nombre))
    }
  }

  useEffect(() => {
    async function fetchData() {
      await loadColegios()
      await loadCategorias()
    }
    fetchData()
  }, [])

  function agregarImagen() {
    if (imagenes.length < 5) {
      setImagenes([...imagenes, ''])
    }
  }

  function actualizarImagen(index: number, url: string) {
    const nuevasImagenes = [...imagenes]
    nuevasImagenes[index] = url
    setImagenes(nuevasImagenes)
  }

  function eliminarImagen(index: number) {
    setImagenes(imagenes.filter((_, i) => i !== index))
  }

  function agregarVariante() {
    if (!nuevaVariante.talla || !nuevaVariante.colegio || !nuevaVariante.stock) {
      toast.error('Completa todos los campos de la variante')
      return
    }

    const existe = variantes.find(
      v => v.talla === nuevaVariante.talla && v.colegio === nuevaVariante.colegio
    )

    if (existe) {
      toast.error('Ya existe una variante con esa talla y colegio')
      return
    }

    setVariantes([...variantes, {
      talla: nuevaVariante.talla,
      colegio: nuevaVariante.colegio,
      stock: parseInt(nuevaVariante.stock)
    }])

    setNuevaVariante({ talla: '', colegio: '', stock: '' })
  }

  function eliminarVariante(index: number) {
    setVariantes(variantes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (variantes.length === 0) {
      toast.error('Debes agregar al menos una variante (talla/colegio/stock)')
      return
    }

    // Filtrar imágenes vacías
    const imagenesValidas = imagenes.filter(img => img.trim() !== '')

    // Insertar producto
    const { data: producto, error: errorProducto } = await supabase
      .from('productos')
      .insert([{
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        categoria: formData.categoria,
        imagen_url: imagenesValidas[0] || null, // Mantener compatibilidad
        imagenes: imagenesValidas.length > 0 ? imagenesValidas : null,
        descuento_porcentaje: parseInt(formData.descuento_porcentaje) || 0,
        en_oferta: formData.en_oferta
      }])
      .select()
      .single()

    if (errorProducto || !producto) {
      toast.error('Error al crear producto')
      return
    }

    // Insertar variantes
    const variantesConProductoId = variantes.map(v => ({
      producto_id: producto.id,
      talla: v.talla,
      colegio: v.colegio,
      stock: v.stock
    }))

    const { error: errorVariantes } = await supabase
      .from('variantes')
      .insert(variantesConProductoId)

    if (errorVariantes) {
      toast.error('Error al crear variantes')
      return
    }

    toast.success('Producto creado exitosamente')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Nuevo Producto</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Nombre del Producto</label>
            <Input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Camisa Polo Clásica"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder="Describe las características del producto..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Precio (CLP)</label>
              <Input
                type="number"
                step="1"
                value={formData.precio}
                onChange={(e) => setFormData({...formData, precio: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="10000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Sin decimales. Ej: 10000 = $10.000</p>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Categoría</label>
              <div className="flex gap-2">
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button
                  variant="info"
                  onClick={() => router.push('/admin/categorias')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold whitespace-nowrap"
                  title="Gestionar Categorías"
                >
                  ⚙️
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Selecciona una categoría o gestiona las categorías disponibles</p>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Imágenes del Producto (1-5)</label>
            <div className="space-y-3">
              {imagenes.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={img}
                    onChange={(e) => actualizarImagen(index, e.target.value)}
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={`URL de imagen ${index + 1}`}
                  />
                  {imagenes.length > 1 && (
                    <Button
                      variant="danger"
                      onClick={() => eliminarImagen(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              {imagenes.length < 5 && (
                <Button
                  variant='ghost'
                  onClick={agregarImagen}
                  className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
                >
                  + Agregar otra imagen
                </Button>
              )}
            </div>
            {imagenes.some(img => img) && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                {imagenes.filter(img => img).map((img, index) => (
                  <div key={index} className="relative group">
                    <LazyImage
                      src={img}
                      alt={`Preview ${index + 1}`}
                      width={300}
                      height={300}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-gray-300"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      unoptimized
                    />
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ofertas y Descuentos (Opcional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Descuento (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.descuento_porcentaje}
                  onChange={(e) => setFormData({...formData, descuento_porcentaje: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Porcentaje de descuento (0-100)</p>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Estado de Oferta</label>
                <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.en_oferta}
                    onChange={(e) => setFormData({...formData, en_oferta: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-900 dark:text-white font-medium">Marcar como producto en oferta</span>
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Se mostrará con badge especial</p>
              </div>
            </div>

            {formData.descuento_porcentaje && parseInt(formData.descuento_porcentaje) > 0 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Precio con descuento: {formatPrice(parseFloat(formData.precio || '0') * (1 - parseInt(formData.descuento_porcentaje) / 100))}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Ahorro: {formatPrice(parseFloat(formData.precio || '0') * (parseInt(formData.descuento_porcentaje) / 100))}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Variantes (Tallas y Colegios)</h2>
              <Button
                type="button"
                variant='info'
                onClick={() => router.push('/admin/colegios')}
                className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Gestionar Colegios
              </Button>
            </div>
            
            <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">Talla</label>
                  <select
                    value={nuevaVariante.talla}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, talla: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">Colegio</label>
                  <select
                    value={nuevaVariante.colegio}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, colegio: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar</option>
                    {colegios.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300 text-sm">Stock</label>
                  <Input
                    type="number"
                    value={nuevaVariante.stock}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, stock: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="success"
                    onClick={agregarVariante}
                    className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {variantes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-sm font-bold text-gray-900 dark:text-white">Talla</th>
                      <th className="p-3 text-left text-sm font-bold text-gray-900 dark:text-white">Colegio</th>
                      <th className="p-3 text-left text-sm font-bold text-gray-900 dark:text-white">Stock</th>
                      <th className="p-3 text-left text-sm font-bold text-gray-900 dark:text-white">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantes.map((v, index) => (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">{v.talla}</td>
                        <td className="p-3 text-gray-900 dark:text-white">{v.colegio}</td>
                        <td className="p-3 font-semibold text-green-600 dark:text-green-400">{v.stock}</td>
                        <td className="p-3">
                          <Button
                            variant="danger"
                            onClick={() => eliminarVariante(index)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {variantes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay variantes agregadas</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-linear-to-br from-green-600 to-green-700 text-white p-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
            >
              Crear Producto
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/admin')}
              className="flex-1 bg-gray-600 text-white p-4 rounded-lg font-semibold hover:bg-gray-700 transition-all"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
