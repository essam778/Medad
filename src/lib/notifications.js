import { supabase } from './supabase'

export async function createNotification({
  recipientId,
  actorId = null,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
  metadata = {},
}) {
  if (!recipientId || !type) return

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    actor_id: actorId,
    type,
    title,
    message,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  })
}
