'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAdminNotificationsAction, type AdminNotificationData } from '@/app/actions/notificaciones'

interface Notification {
  id: string
  type: 'stock_bajo' | 'pedido_pendiente' | 'venta_nueva' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const notificationsRef = useRef(notifications)

  const checkNotifications = useCallback(async () => {
    try {
      const result: AdminNotificationData[] = await fetchAdminNotificationsAction()
      const newNotifications = result.map(notification => ({
        ...notification,
        timestamp: new Date(),
        read: notificationsRef.current.find(item => item.id === notification.id)?.read ?? false
      }))
      notificationsRef.current = newNotifications
      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(notification => !notification.read).length)
      setNotificationError(null)
    } catch (error) {
      console.error('Error al cargar notificaciones administrativas:', error)
      setNotificationError(error instanceof Error ? error.message : 'No se pudieron cargar las notificaciones')
    }
  }, [])

  useEffect(() => {
    void checkNotifications()
    const interval = setInterval(() => void checkNotifications(), 60000)
    return () => clearInterval(interval)
  }, [checkNotifications])

  function markAsRead(id: string) {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    notificationsRef.current = updatedNotifications
    setNotifications(updatedNotifications)
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  function markAllAsRead() {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    notificationsRef.current = updatedNotifications
    setNotifications(updatedNotifications)
    setUnreadCount(0)
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'stock_bajo':
        return '⚠️'
      case 'pedido_pendiente':
        return '📦'
      case 'venta_nueva':
        return '💰'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notificationError ? (
                <div role="alert" className="p-5 text-center text-red-700 dark:text-red-300">
                  <p>{notificationError}</p>
                  <button onClick={() => void checkNotifications()} className="mt-2 min-h-11 underline">
                    Reintentar
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {notification.timestamp.toLocaleTimeString('es-CL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
