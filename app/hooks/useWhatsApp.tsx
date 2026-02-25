'use client'

import { useMutation } from '@tanstack/react-query'

interface SendMessageParams {
  to: string
  message: string
  type?: 'text' | 'image' | 'document'
  imageUrl?: string
  documentUrl?: string
  filename?: string
}

/**
 * Hook para enviar mensajes de WhatsApp
 */
export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send WhatsApp message')
      }

      return response.json()
    },
  })
}

/**
 * Hook para enviar notificación de pedido
 */
export function useSendOrderNotification() {
  const sendMessage = useSendWhatsAppMessage()

  return useMutation({
    mutationFn: async (data: {
      phoneNumber: string
      orderNumber: string
      customerName: string
      total: number
      items: Array<{ name: string; quantity: number; price: number }>
    }) => {
      const itemsList = data.items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.name} - $${item.price.toLocaleString('es-CL')}`
        )
        .join('\n')

      const message = `
🎉 *Pedido Confirmado* 🎉

Hola ${data.customerName},

Tu pedido #${data.orderNumber} ha sido registrado exitosamente.

📦 *Detalle del pedido:*
${itemsList}

💰 *Total: $${data.total.toLocaleString('es-CL')}*

Nos pondremos en contacto contigo pronto para coordinar la entrega.

¡Gracias por tu compra! 🙏

_Angus Confecciones_
      `.trim()

      return sendMessage.mutateAsync({
        to: data.phoneNumber.replace(/[^\d]/g, ''),
        message,
        type: 'text',
      })
    },
  })
}

/**
 * Hook para enviar recordatorio de pago
 */
export function useSendPaymentReminder() {
  const sendMessage = useSendWhatsAppMessage()

  return useMutation({
    mutationFn: async (data: {
      phoneNumber: string
      customerName: string
      orderNumber: string
      amount: number
    }) => {
      const message = `
Hola ${data.customerName} 👋

Te recordamos que tienes un pago pendiente:

📋 Pedido: #${data.orderNumber}
💰 Monto: $${data.amount.toLocaleString('es-CL')}

Por favor, realiza el pago para procesar tu pedido.

¿Necesitas ayuda? Responde este mensaje.

_Angus Confecciones_
      `.trim()

      return sendMessage.mutateAsync({
        to: data.phoneNumber.replace(/[^\d]/g, ''),
        message,
        type: 'text',
      })
    },
  })
}

/**
 * Hook para enviar confirmación de entrega
 */
export function useSendDeliveryConfirmation() {
  const sendMessage = useSendWhatsAppMessage()

  return useMutation({
    mutationFn: async (data: {
      phoneNumber: string
      customerName: string
      orderNumber: string
    }) => {
      const message = `
✅ *Pedido Entregado*

Hola ${data.customerName},

Tu pedido #${data.orderNumber} ha sido entregado exitosamente.

¿Todo llegó en perfecto estado? 
Nos encantaría conocer tu opinión.

¡Gracias por confiar en nosotros! 💙

_Angus Confecciones_
      `.trim()

      return sendMessage.mutateAsync({
        to: data.phoneNumber.replace(/[^\d]/g, ''),
        message,
        type: 'text',
      })
    },
  })
}
