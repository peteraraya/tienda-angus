/**
 * WhatsApp Business API Integration
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'image' | 'document'
  text?: {
    body: string
    preview_url?: boolean
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<Record<string, unknown>>
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
}

export interface WhatsAppWebhookMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: {
    body: string
  }
  image?: {
    id: string
    mime_type: string
    sha256: string
  }
}

export interface WhatsAppWebhookValue {
  messaging_product?: string
  metadata?: Record<string, unknown>
  contacts?: Array<Record<string, unknown>>
  messages?: WhatsAppWebhookMessage[]
  statuses?: Array<Record<string, unknown>>
}

export interface WhatsAppWebhookChange {
  field?: string
  value?: WhatsAppWebhookValue
}

export interface WhatsAppWebhookEntry {
  id?: string
  changes?: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookPayload {
  object?: string
  entry?: WhatsAppWebhookEntry[]
}

/**
 * Enviar mensaje de texto por WhatsApp
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage) {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          ...message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

/**
 * Enviar mensaje de texto simple
 */
export async function sendTextMessage(to: string, text: string, previewUrl = false) {
  return sendWhatsAppMessage({
    to,
    type: 'text',
    text: {
      body: text,
      preview_url: previewUrl,
    },
  })
}

/**
 * Enviar plantilla de WhatsApp
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode = 'es',
  components?: Array<Record<string, unknown>>
) {
  return sendWhatsAppMessage({
    to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components,
    },
  })
}

/**
 * Enviar imagen por WhatsApp
 */
export async function sendImage(to: string, imageUrl: string, caption?: string) {
  return sendWhatsAppMessage({
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption,
    },
  })
}

/**
 * Enviar documento por WhatsApp
 */
export async function sendDocument(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
) {
  return sendWhatsAppMessage({
    to,
    type: 'document',
    document: {
      link: documentUrl,
      filename,
      caption,
    },
  })
}

/**
 * Marcar mensaje como leído
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    )

    return await response.json()
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

/**
 * Obtener información de un medio (imagen, documento, etc.)
 */
export async function getMediaUrl(mediaId: string) {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get media URL')
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Error getting media URL:', error)
    throw error
  }
}

/**
 * Descargar medio de WhatsApp
 */
export async function downloadMedia(mediaUrl: string) {
  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to download media')
    }

    return await response.blob()
  } catch (error) {
    console.error('Error downloading media:', error)
    throw error
  }
}

/**
 * Validar webhook de WhatsApp
 */
export function validateWebhook(
  mode: string,
  token: string,
  verifyToken: string
): boolean {
  return mode === 'subscribe' && token === verifyToken
}

/**
 * Procesar webhook de WhatsApp
 */
export function processWebhookMessage(body: WhatsAppWebhookPayload): WhatsAppWebhookMessage | null {
  try {
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) return null

    return {
      from: message.from,
      id: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text,
      image: message.image,
    }
  } catch (error) {
    console.error('Error processing webhook message:', error)
    return null
  }
}

/**
 * Formatear número de teléfono para WhatsApp (sin +, sin espacios)
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

/**
 * Enviar notificación de pedido al cliente
 */
export async function sendOrderNotification(
  phoneNumber: string,
  orderData: {
    orderNumber: string
    customerName: string
    total: number
    items: Array<{ name: string; quantity: number; price: number }>
  }
) {
  const itemsList = orderData.items
    .map(item => `• ${item.quantity}x ${item.name} - $${item.price.toLocaleString('es-CL')}`)
    .join('\n')

  const message = `
🎉 *Pedido Confirmado* 🎉

Hola ${orderData.customerName},

Tu pedido #${orderData.orderNumber} ha sido registrado exitosamente.

📦 *Detalle del pedido:*
${itemsList}

💰 *Total: $${orderData.total.toLocaleString('es-CL')}*

Nos pondremos en contacto contigo pronto para coordinar la entrega.

¡Gracias por tu compra! 🙏

_Angus Confecciones_
  `.trim()

  return sendTextMessage(formatPhoneNumber(phoneNumber), message)
}

/**
 * Enviar recordatorio de pago
 */
export async function sendPaymentReminder(
  phoneNumber: string,
  customerName: string,
  orderNumber: string,
  amount: number
) {
  const message = `
Hola ${customerName} 👋

Te recordamos que tienes un pago pendiente:

📋 Pedido: #${orderNumber}
💰 Monto: $${amount.toLocaleString('es-CL')}

Por favor, realiza el pago para procesar tu pedido.

¿Necesitas ayuda? Responde este mensaje.

_Angus Confecciones_
  `.trim()

  return sendTextMessage(formatPhoneNumber(phoneNumber), message)
}

/**
 * Enviar confirmación de entrega
 */
export async function sendDeliveryConfirmation(
  phoneNumber: string,
  customerName: string,
  orderNumber: string
) {
  const message = `
✅ *Pedido Entregado*

Hola ${customerName},

Tu pedido #${orderNumber} ha sido entregado exitosamente.

¿Todo llegó en perfecto estado? 
Nos encantaría conocer tu opinión.

¡Gracias por confiar en nosotros! 💙

_Angus Confecciones_
  `.trim()

  return sendTextMessage(formatPhoneNumber(phoneNumber), message)
}
