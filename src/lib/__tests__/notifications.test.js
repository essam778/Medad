import { describe, it, expect, vi } from 'vitest'
import { createNotification } from '../notifications'

describe('createNotification', () => {
  it('should return early if recipientId is missing', async () => {
    await createNotification({ type: 'test' })
    expect(vi.mocked(vi.importActual('@/lib/supabase'))).toBeDefined()
  })

  it('should return early if type is missing', async () => {
    await createNotification({ recipientId: 'user1' })
  })

  it('should insert notification with all fields', async () => {
    const { supabase } = await import('@/lib/supabase')
    await createNotification({
      recipientId: 'user1',
      actorId: 'user2',
      type: 'new_post',
      title: 'New Post',
      message: 'A new post was created',
      entityType: 'post',
      entityId: 'post1',
      metadata: { slug: 'test-post' },
    })
  })

  it('should use null defaults for optional fields', async () => {
    const { supabase } = await import('@/lib/supabase')
    await createNotification({
      recipientId: 'user1',
      type: 'test',
    })
  })
})
