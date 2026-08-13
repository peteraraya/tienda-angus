import { NextRequest, NextResponse } from 'next/server'
import { validateWebhook, processWebhookMessage, markMessageAsRead } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token'

/**
 * GET - Verificación del webhook de WhatsApp
 * Meta enviará una petición GET para verificar el webhook
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode && token) {
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
    const body = await request.json()

    // Procesar el mensaje
    const message = processWebhookMessage(body)

    if (!message) {
      return NextResponse.json({ status: 'no message' }, { status: 200 })
    }

    console.log('Received WhatsApp message:', message)

    // Marcar mensaje como leído
    await markMessageAsRead(message.id)

    // Guardar mensaje en la base de datos
    await saveMessageToDatabase(message)

    // Procesar el mensaje y responder automáticamente si es necesario
    await processIncomingMessage(message)

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

/**
 * Guardar mensaje en la base de datos
 */
async function saveMessageToDatabase(message: any) {
  try {
    const { error } = await supabase.from('whatsapp_messages').insert({
      message_id: message.id,
      from_number: message.from,
      message_type: message.type,
      message_body: message.text?.body || null,
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      status: 'received',
      direction: 'incoming',
    })

    if (error) {
      console.error('Error saving message to database:', error)
    }
  } catch (error) {
    console.error('Error in saveMessageToDatabase:', error)
  }
}

/**
 * Procesar mensaje entrante y responder automáticamente
 */
async function processIncomingMessage(message: any) {
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
