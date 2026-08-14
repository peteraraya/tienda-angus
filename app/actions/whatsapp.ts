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
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as WhatsAppMessage[]) || []
}

export async function fetchConversacionAction(phone: string): Promise<WhatsAppMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .or(`from_number.eq.${phone},to_number.eq.${phone}`)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as WhatsAppMessage[]) || []
}
