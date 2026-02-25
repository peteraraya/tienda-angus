-- Tabla para almacenar mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  from_number TEXT,
  to_number TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  message_body TEXT,
  media_url TEXT,
  media_id TEXT,
  timestamp TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'sent',
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_messages_updated_at();

-- Tabla para almacenar plantillas de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'APPROVED',
  components JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para almacenar configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  webhook_verify_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios para documentación
COMMENT ON TABLE whatsapp_messages IS 'Almacena todos los mensajes de WhatsApp entrantes y salientes';
COMMENT ON TABLE whatsapp_templates IS 'Almacena las plantillas de mensajes de WhatsApp aprobadas';
COMMENT ON TABLE whatsapp_config IS 'Configuración de la integración de WhatsApp Business API';
