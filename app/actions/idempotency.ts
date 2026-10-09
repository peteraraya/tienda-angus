import { createClient } from '@/utils/supabase/server'
import { createHash } from 'node:crypto'

type AdminCreateTable = 'categorias' | 'colegios' | 'clientes' | 'insumos' | 'proveedores'

export async function createAdminRecordIdempotently(
  table: AdminCreateTable,
  data: Record<string, unknown>,
  requestKey: string
): Promise<string> {
  const supabase = await createClient()
  const payloadHash = createHash('sha256').update(JSON.stringify(data)).digest('hex')
  const { data: created, error } = await supabase
    .from(table)
    .upsert({
      ...data,
      idempotency_key: requestKey,
      idempotency_payload: payloadHash
    }, {
      onConflict: 'idempotency_key',
      ignoreDuplicates: true
    })
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (created) return created.id

  const { data: existing, error: errorExisting } = await supabase
    .from(table)
    .select('id')
    .eq('idempotency_key', requestKey)
    .eq('idempotency_payload', payloadHash)
    .maybeSingle()

  if (errorExisting) throw new Error(errorExisting.message)
  if (!existing) throw new Error('La clave de idempotencia ya fue usada con otros datos')
  return existing.id
}
