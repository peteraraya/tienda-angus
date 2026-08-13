# Integración WhatsApp Business API

Esta guía te ayudará a configurar la integración de WhatsApp Business API con Meta para atender clientes directamente desde tu sistema.

## 📋 Requisitos Previos

1. **Cuenta de Meta Business**
   - Crear una cuenta en [Meta Business Suite](https://business.facebook.com/)
   - Verificar tu negocio

2. **WhatsApp Business API**
   - Acceder a [Meta for Developers](https://developers.facebook.com/)
   - Crear una aplicación de tipo "Business"
   - Agregar el producto "WhatsApp"

3. **Número de Teléfono**
   - Tener un número de teléfono que no esté registrado en WhatsApp
   - El número debe poder recibir SMS o llamadas para verificación

## 🚀 Configuración Paso a Paso

### 1. Configurar la Aplicación en Meta

1. Ve a [Meta for Developers](https://developers.facebook.com/apps)
2. Crea una nueva aplicación o selecciona una existente
3. Agrega el producto "WhatsApp" a tu aplicación
4. En la sección de WhatsApp, configura:
   - **Phone Number ID**: ID del número de teléfono
   - **WhatsApp Business Account ID**: ID de la cuenta de negocio
   - **Access Token**: Token de acceso permanente

### 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token_permanente
WHATSAPP_VERIFY_TOKEN=tu_token_de_verificacion_personalizado
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
```

**Importante:**
- `WHATSAPP_VERIFY_TOKEN`: Crea un token personalizado (puede ser cualquier string seguro)
- `WHATSAPP_ACCESS_TOKEN`: Genera un token permanente desde la consola de Meta

### 3. Configurar el Webhook

1. En la consola de Meta, ve a WhatsApp > Configuration
2. Configura el webhook:
   - **Callback URL**: `https://tu-dominio.com/api/whatsapp/webhook`
   - **Verify Token**: El mismo que configuraste en `WHATSAPP_VERIFY_TOKEN`
3. Suscríbete a los siguientes eventos:
   - `messages` (mensajes entrantes)
   - `message_status` (estado de mensajes)

### 4. Ejecutar Migración de Base de Datos

Ejecuta la migración SQL para crear las tablas necesarias:

```bash
# Desde la carpeta del proyecto
psql -h tu-host -U tu-usuario -d tu-database -f supabase/migrations/create_whatsapp_messages_table.sql
```

O desde Supabase Dashboard:
1. Ve a SQL Editor
2. Copia y pega el contenido de `create_whatsapp_messages_table.sql`
3. Ejecuta la query

### 5. Verificar la Instalación

1. Inicia tu servidor de desarrollo:
```bash
npm run dev
```

2. Verifica el webhook:
   - Meta enviará una petición GET a tu webhook
   - Deberías ver "Webhook verified successfully" en los logs

3. Prueba enviando un mensaje:
   - Envía un mensaje de WhatsApp al número configurado
   - Verifica que aparezca en `/admin/whatsapp`

## 📱 Uso de la Integración

### Panel de Administración

Accede a `/admin/whatsapp` para:
- Ver todas las conversaciones
- Responder mensajes de clientes
- Ver historial de conversaciones
- Enviar mensajes proactivos

### Enviar Mensajes Programáticamente

```typescript
import { sendTextMessage, sendOrderNotification } from '@/lib/whatsapp'

// Enviar mensaje simple
await sendTextMessage('56912345678', 'Hola, tu pedido está listo')

// Enviar notificación de pedido
await sendOrderNotification('56912345678', {
  orderNumber: 'ORD-001',
  customerName: 'Juan Pérez',
  total: 25000,
  items: [
    { name: 'Buzo Escolar', quantity: 2, price: 12500 }
  ]
})
```

### API Endpoints

#### Enviar Mensaje
```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "56912345678",
  "message": "Hola, ¿cómo estás?",
  "type": "text"
}
```

#### Webhook (Recibir Mensajes)
```bash
POST /api/whatsapp/webhook
# Meta enviará mensajes entrantes aquí automáticamente
```

## 🔧 Funcionalidades Implementadas

### ✅ Mensajes de Texto
- Enviar y recibir mensajes de texto
- Marcar mensajes como leídos
- Historial de conversaciones

### ✅ Notificaciones Automáticas
- Confirmación de pedidos
- Recordatorios de pago
- Confirmación de entrega

### ✅ Panel de Administración
- Interfaz tipo chat
- Lista de conversaciones
- Contador de mensajes no leídos
- Actualización en tiempo real

### 🔄 Próximas Funcionalidades
- Envío de imágenes y documentos
- Plantillas de mensajes (templates)
- Respuestas automáticas con IA
- Integración con sistema de pedidos
- Métricas y analytics

## 🔐 Seguridad

1. **Tokens de Acceso**
   - Nunca compartas tu access token
   - Usa tokens permanentes solo en producción
   - Rota los tokens periódicamente

2. **Webhook**
   - Usa HTTPS en producción
   - Valida siempre el verify token
   - Verifica la firma de Meta (opcional pero recomendado)

3. **Rate Limits**
   - Meta tiene límites de mensajes por día
   - Implementa rate limiting en tu aplicación
   - Monitorea el uso de la API

## 📊 Monitoreo

### Logs
Los mensajes se registran en:
- Console logs del servidor
- Tabla `whatsapp_messages` en Supabase
- Panel de administración `/admin/whatsapp`

### Métricas Importantes
- Mensajes enviados/recibidos por día
- Tiempo de respuesta promedio
- Tasa de entrega de mensajes
- Conversaciones activas

## 🐛 Troubleshooting

### El webhook no se verifica
- Verifica que `WHATSAPP_VERIFY_TOKEN` coincida en ambos lados
- Asegúrate de que tu servidor esté accesible públicamente
- Revisa los logs del servidor

### Los mensajes no se envían
- Verifica que el `WHATSAPP_ACCESS_TOKEN` sea válido
- Confirma que el número de teléfono esté en formato correcto (sin +, sin espacios)
- Revisa los límites de mensajes de tu cuenta

### Los mensajes no se reciben
- Verifica que el webhook esté configurado correctamente
- Confirma que estés suscrito a los eventos correctos
- Revisa los logs del webhook en Meta

## 📚 Recursos Adicionales

- [Documentación oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Guía de inicio rápido](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Referencia de API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Plantillas de mensajes](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)

## 💡 Mejores Prácticas

1. **Responde Rápido**: Los clientes esperan respuestas rápidas en WhatsApp
2. **Usa Plantillas**: Para mensajes frecuentes, crea plantillas aprobadas
3. **Personaliza**: Usa el nombre del cliente en los mensajes
4. **No Hagas Spam**: Respeta las preferencias de los clientes
5. **Monitorea**: Revisa regularmente las métricas y feedback

## 🆘 Soporte

Si tienes problemas con la integración:
1. Revisa esta documentación
2. Consulta los logs del servidor
3. Verifica la configuración en Meta for Developers
4. Contacta al soporte de Meta si es necesario
