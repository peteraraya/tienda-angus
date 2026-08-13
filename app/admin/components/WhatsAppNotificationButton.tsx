'use client'

import { useState } from 'react'
import { useSendOrderNotification, useSendPaymentReminder, useSendDeliveryConfirmation } from '@/app/hooks/useWhatsApp'

interface WhatsAppNotificationButtonProps {
  type: 'order' | 'payment' | 'delivery'
  data: {
    phoneNumber: string
    customerName: string
    orderNumber: string
    total?: number
    amount?: number
    items?: Array<{ name: string; quantity: number; price: number }>
  }
  onSuccess?: () => void
}

export default function WhatsAppNotificationButton({
  type,
  data,
  onSuccess,
}: WhatsAppNotificationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const sendOrder = useSendOrderNotification()
  const sendPayment = useSendPaymentReminder()
  const sendDelivery = useSendDeliveryConfirmation()

  const handleSend = async () => {
    try {
      switch (type) {
        case 'order':
          if (!data.total || !data.items) {
            throw new Error('Missing order data')
          }
          await sendOrder.mutateAsync({
            phoneNumber: data.phoneNumber,
            customerName: data.customerName,
            orderNumber: data.orderNumber,
            total: data.total,
            items: data.items,
          })
          break
        case 'payment':
          if (!data.amount) {
            throw new Error('Missing payment amount')
          }
          await sendPayment.mutateAsync({
            phoneNumber: data.phoneNumber,
            customerName: data.customerName,
            orderNumber: data.orderNumber,
            amount: data.amount,
          })
          break
        case 'delivery':
          await sendDelivery.mutateAsync({
            phoneNumber: data.phoneNumber,
            customerName: data.customerName,
            orderNumber: data.orderNumber,
          })
          break
      }
      setShowConfirm(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'order':
        return 'Enviar Confirmación'
      case 'payment':
        return 'Enviar Recordatorio'
      case 'delivery':
        return 'Confirmar Entrega'
    }
  }

  const getIcon = () => {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 2.042.613 3.938 1.664 5.527L2 22l4.473-1.664A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.657 0-3.22-.507-4.527-1.373l-.32-.21-2.66.988.988-2.66-.21-.32A7.963 7.963 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8zm3.807-6.093c-.197-.099-1.167-.577-1.348-.643-.181-.066-.313-.099-.445.099-.132.198-.511.643-.627.775-.116.132-.231.148-.428.05-.197-.099-.832-.307-1.584-.98-.586-.522-.98-1.165-1.095-1.362-.116-.198-.013-.304.086-.403.088-.088.197-.231.296-.347.099-.116.132-.198.198-.33.066-.132.033-.247-.016-.346-.049-.099-.445-1.075-.609-1.473-.16-.384-.324-.332-.445-.338-.116-.006-.247-.008-.379-.008-.132 0-.346.049-.527.247-.181.198-.693.677-.693 1.653s.71 1.936.81 2.073c.099.132 1.397 2.137 3.393 2.899.475.164.845.262 1.135.338.476.121.91.104 1.254.063.382-.047 1.167-.478 1.333-.941.165-.462.165-.858.116-.957-.049-.099-.181-.148-.378-.247z" />
      </svg>
    )
  }

  const isPending = sendOrder.isPending || sendPayment.isPending || sendDelivery.isPending

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        title={`Enviar notificación por WhatsApp a ${data.phoneNumber}`}
      >
        {getIcon()}
        <span className="hidden sm:inline">{getButtonText()}</span>
      </button>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmar Envío
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¿Deseas enviar una notificación por WhatsApp a{' '}
              <span className="font-semibold">{data.customerName}</span> al número{' '}
              <span className="font-semibold">{data.phoneNumber}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    {getIcon()}
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
