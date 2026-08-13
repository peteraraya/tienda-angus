'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface WhatsAppMessage {
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

interface Conversation {
  phoneNumber: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  customerName?: string
}

export default function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Obtener conversaciones
  const { data: conversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Agrupar mensajes por número de teléfono
      const conversationsMap = new Map<string, Conversation>()

      data?.forEach((msg: WhatsAppMessage) => {
        const phoneNumber = msg.from_number || msg.to_number || ''
        if (!phoneNumber) return

        if (!conversationsMap.has(phoneNumber)) {
          conversationsMap.set(phoneNumber, {
            phoneNumber,
            lastMessage: msg.message_body,
            lastMessageTime: msg.created_at,
            unreadCount: msg.direction === 'incoming' && msg.status === 'received' ? 1 : 0,
          })
        } else {
          const conv = conversationsMap.get(phoneNumber)!
          if (msg.direction === 'incoming' && msg.status === 'received') {
            conv.unreadCount++
          }
        }
      })

      return Array.from(conversationsMap.values())
    },
    refetchInterval: 5000, // Actualizar cada 5 segundos
  })

  // Obtener mensajes de una conversación
  const { data: messages = [] } = useQuery({
    queryKey: ['whatsapp-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return []

      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .or(`from_number.eq.${selectedConversation},to_number.eq.${selectedConversation}`)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as WhatsAppMessage[]
    },
    enabled: !!selectedConversation,
    refetchInterval: 3000, // Actualizar cada 3 segundos
  })

  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { to: string; message: string }) => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      return response.json()
    },
    onSuccess: () => {
      setMessageText('')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] })
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] })
    },
  })

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return

    sendMessageMutation.mutate({
      to: selectedConversation,
      message: messageText,
    })
  }

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-[1600px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            WhatsApp Business
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las conversaciones con tus clientes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Lista de conversaciones */}
            <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conversaciones
                </h2>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No hay conversaciones
                </div>
              ) : (
                <div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.phoneNumber}
                      onClick={() => setSelectedConversation(conv.phoneNumber)}
                      className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                        selectedConversation === conv.phoneNumber
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {conv.customerName || conv.phoneNumber}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(conv.lastMessageTime).toLocaleString('es-CL')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header de conversación */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation}
                    </h3>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.direction === 'outgoing'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message_body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.direction === 'outgoing'
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de mensaje */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-white"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                      >
                        {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Selecciona una conversación para comenzar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
