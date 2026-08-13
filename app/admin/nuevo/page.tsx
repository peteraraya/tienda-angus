'use client'

import { useState, useEffect } from 'react'
// LazyImage for admin previews
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button, Input, LazyImage } from '@/app/components/ui'
import { useColegios, useCategorias } from '@/app/hooks/useStaticData'
import AdminHeader from '../components/AdminHeader'

const TALLAS_NUMERICAS = ['4', '6', '8', '10', '12', '14', '16', '18']
const TALLAS_LETRAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

interface Variante {
  talla: string
  colegio: string
  stock: number
  precio?: number | null
}

export default function NuevoProducto() {
  const router = useRouter()
  const toast = useToast()
  const { colegios, loading: loadingColegios } = useColegios()
  const { categorias, loading: loadingCategorias } = useCategorias()
  
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
  const [uploadingIndexes, setUploadingIndexes] = useState<number[]>([])
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [nuevaVariante, setNuevaVariante] = useState({
    talla: '',
    colegio: '',
    stock: '',
    precio: ''
  })

  // Ya no necesitamos cargar colegios y categorías manualmente
  // Los hooks useColegios y useCategorias lo hacen automáticamente

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

  async function handleFileUpload(index: number, file: File) {
    if (!file) return

    setUploadingIndexes(prev => [...prev, index])
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.secure_url) {
        actualizarImagen(index, data.secure_url)
        toast.success('Imagen subida con éxito')
      } else {
        toast.error(data.error || 'Error al subir la imagen')
      }
    } catch (error) {
      toast.error('Error de red al subir la imagen')
    } finally {
      setUploadingIndexes(prev => prev.filter(i => i !== index))
    }
  }

  async function handleUrlUpload(index: number, url: string) {
    if (!url || !url.startsWith('http')) return

    setUploadingIndexes(prev => [...prev, index])
    const formData = new FormData()
    formData.append('url', url)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.secure_url) {
        actualizarImagen(index, data.secure_url)
        toast.success('URL optimizada en Cloudinary')
      } else {
        toast.error(data.error || 'Error al procesar la URL')
      }
    } catch (error) {
      toast.error('Error de red al procesar la URL')
    } finally {
      setUploadingIndexes(prev => prev.filter(i => i !== index))
    }
  }

  function agregarVariante() {
    const tallaFinal = nuevaVariante.talla || 'Única'
    const colegioFinal = nuevaVariante.colegio || 'General'

    let tallasAAgregar = [tallaFinal]
    if (tallaFinal === 'TODAS_NUMERICAS') {
      tallasAAgregar = TALLAS_NUMERICAS
    } else if (tallaFinal === 'TODAS_LETRAS') {
      tallasAAgregar = TALLAS_LETRAS
    } else {
      if (!nuevaVariante.stock) {
        toast.error('Completa el stock')
        return
      }
    }

    const nuevas = tallasAAgregar.map(t => ({
      talla: t,
      colegio: colegioFinal,
      stock: parseInt(nuevaVariante.stock) || 0,
      precio: nuevaVariante.precio ? parseFloat(nuevaVariante.precio) : null
    })).filter(nv => !variantes.some(v => v.talla === nv.talla && v.colegio === nv.colegio))

    if (nuevas.length === 0) {
      toast.error('Las variantes seleccionadas ya existen para este colegio')
      return
    }

    setVariantes([...variantes, ...nuevas])
    setNuevaVariante({ talla: '', colegio: nuevaVariante.colegio, stock: '', precio: '' })
    toast.success(`${nuevas.length} variante(s) agregada(s)`)
  }

  function eliminarVariante(index: number) {
    setVariantes(variantes.filter((_, i) => i !== index))
  }

  function actualizarVarianteInline(index: number, campo: 'stock' | 'precio', valor: string) {
    const nuevasVariantes = [...variantes];
    if (campo === 'stock') {
      nuevasVariantes[index].stock = parseInt(valor) || 0;
    } else if (campo === 'precio') {
      nuevasVariantes[index].precio = valor ? parseFloat(valor) : null;
    }
    setVariantes(nuevasVariantes);
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
      stock: v.stock,
      precio: v.precio
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <AdminHeader 
        title="Nuevo Producto" 
        subtitle="Crea un nuevo producto con variantes y stock"
      />

      <div className="w-full max-w-6xl mx-auto mt-8 bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN: Información Básica */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Información Básica
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  placeholder="Ej: Polera Piqué Blanca"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors resize-none"
                  rows={4}
                  placeholder="Describe las características de la prenda, material, calce, etc..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Categoría</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="flex-1 p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors cursor-pointer"
                      required
                    >
                      <option value="" disabled>Selecciona una categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="info"
                      onClick={() => router.push('/admin/categorias')}
                      className="px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
                      title="Gestionar Categorías"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Precio Base (CLP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold">$</span>
                    </div>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: e.target.value})}
                      className="w-full pl-8 p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors font-mono font-bold text-lg"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">Sin puntos ni comas (Ej: 15990)</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Imágenes */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Galería de Imágenes
            </h2>
            
            <div className="space-y-4">
              {imagenes.map((img, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm">
                    {uploadingIndexes.includes(index) ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Subiendo a Cloudinary...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="url"
                            value={img}
                            onChange={(e) => actualizarImagen(index, e.target.value)}
                            className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-sm"
                            placeholder={`Pegar URL de imagen ${index + 1}`}
                          />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => handleUrlUpload(index, img)}
                            disabled={!img || !img.startsWith('http') || img.includes('cloudinary.com')}
                            className="text-xs px-3 py-2 disabled:opacity-50"
                            title="Guardar URL externa en Cloudinary para optimización"
                          >
                            Optimizar URL
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-bold uppercase">o subir archivo local:</span>
                          <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(index, file)
                            }}
                            className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {imagenes.length > 1 && (
                    <Button
                      variant="danger"
                      onClick={() => eliminarImagen(index)}
                      className="px-3 py-3 mt-1 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 rounded-xl transition-colors"
                      title="Eliminar imagen"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              {imagenes.length < 5 && (
                <button
                  type="button"
                  onClick={agregarImagen}
                  className="w-full py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex flex-col items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Añadir otra imagen ({imagenes.length}/5)</span>
                </button>
              )}
            </div>
            
            {imagenes.some(img => img.trim() !== '') && (
              <div className="mt-6">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Vista Previa</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagenes.filter(img => img.trim() !== '').map((img, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 aspect-square bg-white dark:bg-gray-800">
                      <LazyImage
                        src={img}
                        alt={`Preview ${index + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        unoptimized
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Ofertas */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ofertas y Descuentos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Descuento (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.descuento_porcentaje}
                    onChange={(e) => setFormData({...formData, descuento_porcentaje: e.target.value})}
                    className="w-full p-3.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors font-mono font-bold"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">%</span>
                  </div>
                </div>
                
                {formData.descuento_porcentaje && parseInt(formData.descuento_porcentaje) > 0 ? (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 flex justify-between">
                      <span>Precio final:</span>
                      <span className="font-mono">{formatPrice(parseFloat(formData.precio || '0') * (1 - parseInt(formData.descuento_porcentaje) / 100))}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2 ml-1">Dejar en 0 si no hay descuento</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Destacar en Catálogo</label>
                <label className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.en_oferta}
                      onChange={(e) => setFormData({...formData, en_oferta: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${formData.en_oferta ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.en_oferta ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                  <div>
                    <span className={`font-bold transition-colors ${formData.en_oferta ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Marcar como "OFERTA 🔥"
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">Se mostrará con un badge animado</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Inventario y Variantes */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventario (Variantes)
              </h2>
              <Button
                type="button"
                variant='info'
                onClick={() => router.push('/admin/colegios')}
                className="text-sm bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 transition-all font-bold flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Gestionar Colegios
              </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-blue-100 dark:border-gray-600 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Agregar Variante</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">Talla / Grupo</label>
                  <select
                    value={nuevaVariante.talla}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, talla: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white font-bold"
                  >
                    <option value="">Única / Sin Talla</option>
                    <optgroup label="⚡ Generación Rápida">
                      <option value="TODAS_NUMERICAS">Todas Numéricas (4 al 18)</option>
                      <option value="TODAS_LETRAS">Todas Letras (XS a XXL)</option>
                    </optgroup>
                    <optgroup label="Tallas Individuales (Numéricas)">
                      {TALLAS_NUMERICAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="Tallas Individuales (Letras)">
                      {TALLAS_LETRAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">Colegio</label>
                  <select
                    value={nuevaVariante.colegio}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, colegio: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white font-bold"
                  >
                    <option value="">General / Sin Colegio</option>
                    {colegios.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase" title="Precio distinto al base">Precio Específico</label>
                  <Input
                    type="number"
                    value={nuevaVariante.precio}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, precio: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white font-mono"
                    placeholder="Opcional"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">Unids. Stock</label>
                  <Input
                    type="number"
                    value={nuevaVariante.stock}
                    onChange={(e) => setNuevaVariante({...nuevaVariante, stock: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white font-mono font-bold"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    variant="success"
                    onClick={agregarVariante}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-sm hover:shadow"
                  >
                    + Añadir
                  </Button>
                </div>
              </div>
            </div>

            {variantes.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Talla</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Colegio</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Esp.</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Stock</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {variantes.map((v, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-8 bg-gray-100 dark:bg-gray-700 rounded-md font-bold text-white text-sm">
                              {v.talla}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{v.colegio}</td>
                          <td className="px-4 py-3">
                            <div className="relative w-24">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-xs">$</span>
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={v.precio || ''}
                                onChange={(e) => actualizarVarianteInline(index, 'precio', e.target.value)}
                                placeholder="Base"
                                className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors font-mono"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`flex items-center justify-between w-28 mx-auto rounded-lg border overflow-hidden transition-colors ${v.stock > 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 focus-within:border-green-500' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 focus-within:border-red-500'}`}>
                              <button
                                type="button"
                                onClick={() => actualizarVarianteInline(index, 'stock', Math.max(0, v.stock - 1).toString())}
                                className={`px-2.5 py-1.5 text-lg font-bold transition-colors ${v.stock > 0 ? 'text-green-600 hover:bg-green-200 dark:text-green-400 dark:hover:bg-green-800' : 'text-red-600 hover:bg-red-200 dark:text-red-400 dark:hover:bg-red-800'}`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => actualizarVarianteInline(index, 'stock', e.target.value)}
                                className={`w-10 text-center p-0 border-none focus:ring-0 text-sm font-bold bg-transparent ${v.stock > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
                              />
                              <button
                                type="button"
                                onClick={() => actualizarVarianteInline(index, 'stock', (v.stock + 1).toString())}
                                className={`px-2.5 py-1.5 text-lg font-bold transition-colors ${v.stock > 0 ? 'text-green-600 hover:bg-green-200 dark:text-green-400 dark:hover:bg-green-800' : 'text-red-600 hover:bg-red-200 dark:text-red-400 dark:hover:bg-red-800'}`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => eliminarVariante(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Eliminar variante"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Sin variantes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Agrega al menos una talla y colegio para este producto.
                </p>
              </div>
            )}
          </div>

          {/* Barra de acciones flotante (Sticky Bottom Bar) */}
          <div className="sticky bottom-4 z-50 mt-8 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex gap-4 transition-all">
            <Button
              variant="secondary"
              onClick={() => router.push('/admin')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1  transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5"
            >
              💾 Crear Producto
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
