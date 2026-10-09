'use server'

import { createClient } from '@/utils/supabase/server'

export interface WhatsAppMessage {
  id: string
  message_id: string
  from_number?: string
  to_number?: string
  message_type: string
  message_body: string
  timestamp: string
  status: string
  direction: 'incoming' | 'outgoing'
  created_at: string
}

export async function fetchWhatsappMessagesAction(): Promise<WhatsAppMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id, message_id, from_number, to_number, message_type, message_body, timestamp, status, direction, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(error.message)
  return (data as WhatsAppMessage[]) || []
}

export async function fetchConversacionAction(phone: string): Promise<WhatsAppMessage[]> {
  if (!/^\+?[0-9]{7,15}$/.test(phone)) throw new Error('El número telefónico no es válido')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id, message_id, from_number, to_number, message_type, message_body, timestamp, status, direction, created_at')
    .or(`from_number.eq.${phone},to_number.eq.${phone}`)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return ((data as WhatsAppMessage[]) || []).reverse()
}
