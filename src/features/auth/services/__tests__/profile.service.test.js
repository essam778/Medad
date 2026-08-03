import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileService } from '../profile.service'

describe('ProfileService', () => {
  let supabase

  function mkChain() {
    const chain = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      gte: () => chain,
      in: () => chain,
      is: () => chain,
      order: () => chain,
      limit: () => chain,
      contains: () => chain,
      overlaps: () => chain,
      or: () => chain,
      filter: () => chain,
      range: () => chain,
      maybeSingle: () => chain,
      single: () => chain,
      insert: () => ({
        select: () => ({
          single: () => chain,
          maybeSingle: () => chain,
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
        is: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }
    return chain
  }

  beforeEach(async () => {
    const mod = await import('@/lib/supabase')
    supabase = mod.supabase
    supabase.from = vi.fn(() => mkChain())
    supabase.rpc = vi.fn(() => Promise.resolve({}))
  })

  describe('getUserStats', () => {
    it('should return comment and like counts', async () => {
      const result = await ProfileService.getUserStats('user1')
      expect(result).toHaveProperty('comments')
      expect(result).toHaveProperty('likes')
    })
  })

  describe('getProfile', () => {
    it('should fetch profile by id', async () => {
      await ProfileService.getProfile('user1')
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('getPublicProfile', () => {
    it('should fetch from profiles_public', async () => {
      await ProfileService.getPublicProfile('user1')
      expect(supabase.from).toHaveBeenCalledWith('profiles_public')
    })
  })

  describe('updateRole', () => {
    it('should update profile role', async () => {
      await ProfileService.updateRole('user1', 'author')
    })
  })

  describe('toggleBan', () => {
    it('should toggle ban from false to true', async () => {
      await ProfileService.toggleBan('user1', false)
    })

    it('should toggle ban from true to false', async () => {
      await ProfileService.toggleBan('user1', true)
    })
  })

  describe('deleteUser', () => {
    it('should call delete_user_by_admin RPC', async () => {
      await ProfileService.deleteUser('user1')
      expect(supabase.rpc).toHaveBeenCalledWith('delete_user_by_admin', { target_user_id: 'user1' })
    })
  })

  describe('updateProfile', () => {
    it('should update profile with spread updates', async () => {
      await ProfileService.updateProfile('user1', { full_name: 'New Name' })
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })
  })

  describe('getPoints', () => {
    it('should fetch points for user', async () => {
      await ProfileService.getPoints('user1')
    })
  })

  describe('updatePoints', () => {
    it('should update points for user', async () => {
      await ProfileService.updatePoints('user1', 100)
    })
  })

  describe('getCreatorRequest', () => {
    it('should fetch creator request for user', async () => {
      await ProfileService.getCreatorRequest('user1')
    })
  })

  describe('createCreatorRequest', () => {
    it('should insert creator request', async () => {
      await ProfileService.createCreatorRequest('user1', 'I want to be a creator')
    })
  })

  describe('getPendingCreatorRequests', () => {
    it('should return empty array when no pending requests', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })
      const result = await ProfileService.getPendingCreatorRequests()
      expect(result).toEqual({ data: [], error: null })
    })

    it('should handle error on fetch', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: new Error('fetch failed') })),
          })),
        })),
      })
      const result = await ProfileService.getPendingCreatorRequests()
      expect(result.error).toBeTruthy()
    })

    it('should return merged data when RPC succeeds', async () => {
      const mockRequests = [
        { id: 'req1', user_id: 'user1', status: 'pending', message: 'test', created_at: '2024-01-01' },
      ]
      const mockProfiles = [
        { id: 'user1', full_name: 'Test User', email: 'test@example.com' },
      ]

      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockRequests, error: null })),
          })),
        })),
      })

      supabase.rpc = vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
      }))

      const result = await ProfileService.getPendingCreatorRequests()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].profiles).toBeTruthy()
      expect(result.data[0].profiles.full_name).toBe('Test User')
    })

    it('should handle RPC error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{ id: 'req1', user_id: 'user1', status: 'pending' }],
              error: null,
            })),
          })),
        })),
      })

      supabase.rpc = vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: null, error: new Error('rpc failed') })),
      }))

      const result = await ProfileService.getPendingCreatorRequests()
      expect(result.error).toBeTruthy()
    })

    it('should handle null profiles from RPC', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{ id: 'req1', user_id: 'user1', status: 'pending' }],
              error: null,
            })),
          })),
        })),
      })

      supabase.rpc = vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: null, error: null })),
      }))

      const result = await ProfileService.getPendingCreatorRequests()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].profiles).toBeNull()
    })
  })

  describe('approveCreatorRequest', () => {
    it('should update role and approve request', async () => {
      await ProfileService.approveCreatorRequest('req1', 'user1')
    })
  })

  describe('rejectCreatorRequest', () => {
    it('should update request status to rejected', async () => {
      await ProfileService.rejectCreatorRequest('req1')
    })
  })
})
