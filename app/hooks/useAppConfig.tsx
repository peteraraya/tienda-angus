'use client'

import { appConfig, type AppConfig } from '@/config/app.config'

/**
 * Hook para acceder a la configuración de la aplicación
 * Uso: const config = useAppConfig()
 */
export function useAppConfig(): AppConfig {
  return appConfig
}

/**
 * Hook para acceder a información de la empresa
 */
export function useCompanyInfo() {
  return appConfig.company
}

/**
 * Hook para acceder a información de contacto
 */
export function useContactInfo() {
  return appConfig.contact
}

/**
 * Hook para acceder a redes sociales
 */
export function useSocialInfo() {
  return appConfig.social
}

/**
 * Hook para acceder a configuración de la app
 */
export function useAppSettings() {
  return appConfig.app
}

/**
 * Hook para acceder a configuración de inventario
 */
export function useInventorySettings() {
  return appConfig.inventory
}

/**
 * Hook para acceder a etiquetas personalizadas
 */
export function useLabels() {
  return appConfig.labels
}

/**
 * Hook para verificar características habilitadas
 */
export function useFeatures() {
  return appConfig.features
}
