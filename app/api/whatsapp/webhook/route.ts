import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { validateWebhook, processWebhookMessage, markMessageAsRead } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'
import type { WhatsAppWebhookMessage } from '@/lib/whatsapp'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN
const APP_SECRET = process.env.WHATSAPP_APP_SECRET

function hasValidSignature(body: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature) return false

  const expected = `sha256=${createHmac('sha256', APP_SECRET).update(body).digest('hex')}`
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(signature)

  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
}

/**
 * GET - Verificación del webhook de WhatsApp
 * Meta enviará una petición GET para verificar el webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (VERIFY_TOKEN && mode && token && challenge) {
    if (validateWebhook(mode, token, VERIFY_TOKEN)) {
      console.log('Webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    } else {
      console.error('Webhook verification failed')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
}

/**
 * POST - Recibir mensajes de WhatsApp
 * Meta enviará mensajes entrantes a este endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!hasValidSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)

    // Procesar el mensaje
    const message = processWebhookMessage(body)

    if (!message) {
      return NextResponse.json({ status: 'no message' }, { status: 200 })
    }

    console.info('Received WhatsApp message')

    // Guardar primero para que una reentrega no repita efectos de procesamiento.
    const isNewMessage = await saveMessageToDatabase(message)

    // Marcar mensaje como leído
    await markMessageAsRead(message.id)

    // Procesar el mensaje y responder automáticamente si es necesario
    if (isNewMessage) {
      await processIncomingMessage(message)
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error instanceof Error ? error.name : 'Unknown error')
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

/**
 * Guardar mensaje en la base de datos
 */
async function saveMessageToDatabase(message: WhatsAppWebhookMessage): Promise<boolean> {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .upsert({
      message_id: message.id,
      from_number: message.from,
      message_type: message.type,
      message_body: message.text?.body || null,
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      status: 'received',
      direction: 'incoming',
    }, {
      onConflict: 'message_id',
      ignoreDuplicates: true
    })
    .select('message_id')
    .maybeSingle()

  if (error) throw new Error(`Error saving WhatsApp message: ${error.message}`)
  return Boolean(data)
}

/**
 * Procesar mensaje entrante y responder automáticamente
 */
async function processIncomingMessage(message: WhatsAppWebhookMessage) {
  // Aquí puedes implementar lógica de respuesta automática
  // Por ejemplo, responder con un menú de opciones
  
  const messageText = message.text?.body?.toLowerCase() || ''

  // Ejemplo de respuestas automáticas
  if (messageText.includes('hola') || messageText.includes('buenos')) {
    // Responder con mensaje de bienvenida
    // await sendTextMessage(message.from, '¡Hola! Bienvenido a Angus Confecciones...')
  }

  // Puedes agregar más lógica de respuesta automática aquí
}
