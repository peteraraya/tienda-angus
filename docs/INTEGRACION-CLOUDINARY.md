# Guía Técnica: Integración Centralizada de Cloudinary

Esta guía detalla la estrategia y arquitectura recomendada para implementar Cloudinary como servicio centralizado de gestión de imágenes, soportando tanto carga de archivos locales como inserción mediante URL externa.

## 1. Arquitectura de Base de Datos

Para mantener la consistencia y escalabilidad, la base de datos no debe almacenar los archivos binarios, sino únicamente las referencias y metadatos críticos proporcionados por Cloudinary.

### Esquema recomendado (Ejemplo SQL / Supabase)

En lugar de almacenar múltiples columnas para distintas variantes de una imagen, se recomienda usar una tabla centralizada o un campo estructurado (JSONB) si las imágenes pertenecen a una entidad específica (como `productos`).

**Ejemplo de tabla `images` (Gestión centralizada):**
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id VARCHAR(255) NOT NULL UNIQUE, -- ID único de Cloudinary
  url TEXT NOT NULL,                      -- URL segura de entrega (https)
  secure_url TEXT NOT NULL,               -- URL con SSL garantizado
  format VARCHAR(10) NOT NULL,            -- ej: 'webp', 'jpg'
  width INTEGER,
  height INTEGER,
  bytes INTEGER,                          -- Peso en bytes (útil para auditoría)
  resource_type VARCHAR(20) DEFAULT 'image',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Si se usa como campo en una tabla (ej. `productos`):**
En PostgreSQL/Supabase, es muy eficiente guardar un array de referencias o un objeto JSONB:
```sql
ALTER TABLE productos ADD COLUMN cloudinary_images JSONB[] DEFAULT '{}';
-- Ejemplo de payload almacenado:
-- [{"public_id": "productos/abc12", "secure_url": "https://..."}]
```

## 2. Estrategia de Carga (Upload Strategy)

Se requieren dos flujos de entrada. Lo ideal es unificar el proceso en el backend o mediante Server Actions (Next.js) usando el SDK de Cloudinary.

### Flujo 1: Carga de Archivo Local (File Upload)
Para archivos locales, la estrategia más segura (evitando exponer credenciales en el cliente) es:
1. El cliente solicita una **firma cifrada (Signed Signature)** al servidor.
2. El cliente hace un POST directo a la API de Cloudinary desde el navegador usando dicha firma.
3. Cloudinary responde con el `public_id` y `secure_url`.
4. El cliente envía estos datos al backend de la aplicación para guardar la referencia en la base de datos.

### Flujo 2: Carga mediante URL Externa
Cloudinary permite hacer "upload" pasando directamente una URL externa. Cloudinary descargará la imagen desde esa URL, la optimizará, la almacenará en su red y devolverá un `public_id` propio.
1. El usuario ingresa la URL en el cliente.
2. El cliente envía la URL al backend.
3. El backend utiliza el SDK de Cloudinary: `cloudinary.uploader.upload("https://ejemplo.com/foto.jpg")`.
4. El backend guarda los metadatos devueltos (`secure_url`, `public_id`) en la base de datos local.

## 3. Implementación Práctica (Next.js & Node.js)

### Configuración del SDK (Backend)
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
```

### Función Unificada de Carga (Soporta Base64 Buffer o URL)
```javascript
export async function uploadToCloudinary(input, folder = "general") {
  try {
    const options = {
      folder: folder,
      format: "webp", // Forzar formato optimizado moderno
      quality: "auto"
    };

    let result;
    
    // Si el input es una URL externa (String que empieza con http)
    if (typeof input === "string" && input.startsWith("http")) {
      result = await cloudinary.uploader.upload(input, options);
    } 
    // Si es un archivo (Buffer o Base64 DataURI)
    else {
      result = await cloudinary.uploader.upload(input, options);
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error("Error en Cloudinary:", error);
    throw new Error("Fallo en la carga de la imagen");
  }
}
```

## 4. Lógica de Validación y Consistencia

Para asegurar que la base de datos mantenga integridad y que Cloudinary no acumule "archivos huérfanos" (imágenes subidas que no están referenciadas en tu base de datos):

1. **Validación de Tamaño y Formato (Frontend + Backend):**
   * Restringir inputs exclusivamente a los MIME types válidos (`image/jpeg, image/png, image/webp`).
   * Limitar el peso desde el cliente antes de consumir ancho de banda (ej. máximo 5MB).
   
2. **Validación Proactiva de URLs Externas:**
   * Usar expresiones regulares en el cliente/servidor para asegurar que es un enlace válido.
   * Como mejor práctica, el servidor puede realizar un rápido `HEAD request` para verificar que el `Content-Type` de la URL es efectivamente una imagen antes de intentar enviarla a Cloudinary.

3. **Manejo de Transacciones Temporales (Rollbacks):**
   * En caso de que la carga a Cloudinary sea exitosa pero ocurra un error fatal al intentar insertar la referencia en tu base de datos (por caída de red u error de Supabase/SQL), el bloque `catch` del manejador de la base de datos debe disparar un comando inverso: `cloudinary.uploader.destroy(public_id)` para limpiar el residuo inmediatamente.

## 5. Optimización de Rendimiento

La mayor ventaja de Cloudinary radica en sus transformaciones "al vuelo" (On-the-fly transformations). La regla de oro es: **Nunca generar o guardar miniaturas en tu base de datos**. Almacena únicamente el `public_id` de la versión original de máxima calidad, y delega a la CDN de Cloudinary la tarea de redimensionar la imagen bajo demanda.

* **Integración ideal con Next.js (`next-cloudinary`):**
```jsx
import { CldImage } from 'next-cloudinary';

<CldImage
  width="500"
  height="500"
  src={producto.cloudinary_public_id}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Descripción accesible"
  crop="fill"
  format="auto"    /* El servidor detectará el navegador web y enviará AVIF o WebP dinámicamente */
  quality="auto"   /* Cloudinary aplica algoritmos visuales para comprimir sin pérdida aparente */
/>
```

## 6. Mejores Prácticas de Seguridad

1. **Protección de Credenciales**: Nunca exponer el `api_secret` en el lado del cliente (React/Next.js Client Components). Todo lo que use el secreto debe vivir en Server Actions, Rutas API o el Backend.
2. **Upload Presets Restrictivos**: En el panel de control de Cloudinary, crea un "Upload Preset" que aplique restricciones automáticamente:
   * Forzar un límite máximo de tamaño de subida.
   * Activar el *Moderation add-on* para bloquear de forma automática contenido adulto (NSFW).
3. **Eager Transformations vs Lazy**: Si sabes de antemano que vas a recibir imágenes de tamaño gigantesco desde usuarios no técnicos, configura el Upload Preset para aplicar una transformación de recorte predeterminada (`eager limits`) en el momento de la carga (ej. limitar todo a un máximo de 2000x2000px). Esto reduce drásticamente tu consumo de almacenamiento primario.
4. **Ciclo de vida de los datos (CRUD)**: Al momento de implementar una vista de "Edición de Producto" en el panel de administrador, si el usuario decide *Reemplazar* una foto vieja por una nueva, el backend debe asegurarse de ejecutar `cloudinary.uploader.destroy(old_public_id)` para no acumular basura digital de forma invisible.