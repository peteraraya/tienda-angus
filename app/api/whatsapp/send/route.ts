import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, sendImage, sendDocument } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

/**
 * POST - Enviar mensaje de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, type = 'text', imageUrl, documentUrl, filename } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'text':
        result = await sendTextMessage(to, message)
        break
      case 'image':
        if (!imageUrl) {
          return NextResponse.json(
            { error: 'imageUrl is required for image messages' },
            { status: 400 }
          )
        }
        result = await sendImage(to, imageUrl, message)
        break
      case 'document':
        if (!documentUrl || !filename) {
          return NextResponse.json(
            { error: 'documentUrl and filename are required for document messages' },
            { status: 400 }
          )
        }
        result = await sendDocument(to, documentUrl, filename, message)
        break
      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Guardar mensaje enviado en la base de datos
    await supabase.from('whatsapp_messages').insert({
      message_id: result.messages[0].id,
      to_number: to,
      message_type: type,
      message_body: message,
      status: 'sent',
      direction: 'outgoing',
    })

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
