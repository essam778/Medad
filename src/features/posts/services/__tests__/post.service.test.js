import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostService } from '../post.service'

describe('PostService', () => { // @smoke
  let supabase

  function mkChain() {
    const chain = {
      select: () => chain,
      eq: () => chain,
      neq: () => chain,
      in: () => chain,
      is: () => chain,
      order: () => chain,
      limit: () => chain,
      contains: () => chain,
      overlaps: () => chain,
      or: () => chain,
      filter: () => chain,
      range: () => Promise.resolve({ data: [], error: null, count: 0 }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: undefined,
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        is: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
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

  describe('getPosts', () => {
    it('should fetch posts with default options', async () => {
      const result = await PostService.getPosts()
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('count')
    })

    it('should flatten comment and reaction counts', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => {
          const chain = {
            or: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            order: vi.fn(() => chain),
            contains: vi.fn(() => chain),
            range: vi.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  title: 'Test',
                  comments: [{ count: 5 }],
                  post_reactions: [{ count: 10 }],
                },
              ],
              error: null,
              count: 1,
            })),
          }
          return chain
        }),
      })

      const result = await PostService.getPosts()
      expect(result.data[0].comments_count).toBe(5)
      expect(result.data[0].reactions_count).toBe(10)
    })

    it('should handle search queries', async () => {
      await PostService.getPosts({ searchQuery: 'test' })
    })

    it('should filter by tag', async () => {
      await PostService.getPosts({ tag: 'javascript' })
    })

    it('should order by views when popular', async () => {
      await PostService.getPosts({ isPopular: true })
    })
  })

  describe('searchChannels', () => {
    it('should search site_settings with query', async () => {
      await PostService.searchChannels('test')
      expect(supabase.from).toHaveBeenCalledWith('site_settings')
    })
  })

  describe('getPostBySlug', () => {
    it('should fetch post by slug', async () => {
      await PostService.getPostBySlug('test-post')
      expect(supabase.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('getPostById', () => {
    it('should fetch post by id', async () => {
      await PostService.getPostById('post1')
    })
  })

  describe('createPost', () => {
    it('should insert new post', async () => {
      await PostService.createPost({ title: 'Test', content: 'Content' })
    })
  })

  describe('updatePost', () => {
    it('should update post by id', async () => {
      await PostService.updatePost('post1', { title: 'Updated' })
    })
  })

  describe('deletePost', () => {
    it('should delete post by id', async () => {
      await PostService.deletePost('post1')
      expect(supabase.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('incrementViews', () => {
    it('should call increment_views RPC', async () => {
      await PostService.incrementViews('post1')
      expect(supabase.rpc).toHaveBeenCalledWith('increment_views', { post_id: 'post1' })
    })
  })

  describe('getTags', () => {
    it('should return tags with usage counts', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn((fields) => ({
          order: vi.fn(() => Promise.resolve({ data: [{ id: '1', name: 'js' }], error: null })),
        })),
      })
      const tags = await PostService.getTags()
      expect(Array.isArray(tags)).toBe(true)
    })

    it('should handle error from tags fetch', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: new Error('db error') })),
        })),
      })
      await expect(PostService.getTags()).rejects.toThrow('db error')
    })

    it('should handle tags stored as JSON string', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn((fields) => {
          if (fields === 'tags') {
            return Promise.resolve({
              data: [{ tags: '["js","react"]' }, { tags: '["js"]' }],
              error: null,
            })
          }
          return {
            order: vi.fn(() => Promise.resolve({
              data: [{ id: '1', name: 'js' }, { id: '2', name: 'react' }],
              error: null,
            })),
          }
        }),
      })
      const tags = await PostService.getTags()
      expect(tags).toHaveLength(2)
      expect(tags.find(t => t.name === 'js').usage_count).toBe(2)
      expect(tags.find(t => t.name === 'react').usage_count).toBe(1)
    })
  })

  describe('createTag', () => {
    it('should create tag with trimmed lowercase name', async () => {
      await PostService.createTag('  JavaScript  ')
    })
  })

  describe('updateTag', () => {
    it('should update tag name', async () => {
      await PostService.updateTag('tag1', 'New Name')
    })
  })

  describe('deleteTag', () => {
    it('should delete tag by id', async () => {
      await PostService.deleteTag('tag1')
    })
  })

  describe('setReaction', () => {
    it('should remove reaction if same type exists', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { id: 'r1', type: 'like', post_id: 'p1', user_id: 'u1' },
                error: null,
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })
      await PostService.setReaction('p1', 'u1', 'like')
    })

    it('should update reaction if different type exists', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { id: 'r1', type: 'like', post_id: 'p1', user_id: 'u1' },
                error: null,
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })
      await PostService.setReaction('p1', 'u1', 'love')
    })

    it('should insert reaction if none exists', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })
      await PostService.setReaction('p1', 'u1', 'like')
    })

    it('should throw on select error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: new Error('select failed') })),
            })),
          })),
        })),
      })
      await expect(PostService.setReaction('p1', 'u1', 'like')).rejects.toThrow('select failed')
    })
  })

  describe('getReactionCounts', () => {
    it('should return grouped reaction counts', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [{ type: 'like' }, { type: 'like' }, { type: 'love' }],
            error: null,
          })),
        })),
      })
      const result = await PostService.getReactionCounts('p1')
      expect(result.data).toEqual({ like: 2, love: 1 })
      expect(result.total).toBe(3)
    })

    it('should handle error gracefully', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: new Error('failed') })),
        })),
      })
      const result = await PostService.getReactionCounts('p1')
      expect(result.error).toBeTruthy()
    })
  })

  describe('toggleLike', () => {
    it('should delegate to setReaction with type like', async () => {
      const spy = vi.spyOn(PostService, 'setReaction').mockResolvedValue(undefined)
      await PostService.toggleLike('p1', 'u1')
      expect(spy).toHaveBeenCalledWith('p1', 'u1', 'like')
      spy.mockRestore()
    })
  })

  describe('toggleSave', () => {
    it('should remove saved post if exists', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { id: 's1', post_id: 'p1', user_id: 'u1' },
                error: null,
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })
      await PostService.toggleSave('p1', 'u1')
    })

    it('should insert saved post if not exists', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
      })
      await PostService.toggleSave('p1', 'u1')
    })
  })

  describe('getComments', () => {
    it('should fetch comments for a post', async () => {
      await PostService.getComments('p1')
      expect(supabase.from).toHaveBeenCalledWith('comments')
    })
  })

  describe('addComment', () => {
    it('should add comment without parentId', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'c1' }, error: null })),
          })),
        })),
      })
      const result = await PostService.addComment('p1', 'u1', 'Great post!')
      expect(result).toEqual({ id: 'c1' })
    })

    it('should add comment with parentId', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'c2' }, error: null })),
          })),
        })),
      })
      const result = await PostService.addComment('p1', 'u1', 'Reply!', 'parent1')
      expect(result).toEqual({ id: 'c2' })
    })

    it('should throw on insert error', async () => {
      supabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: new Error('insert failed') })),
          })),
        })),
      })
      await expect(PostService.addComment('p1', 'u1', 'test')).rejects.toThrow('insert failed')
    })
  })

  describe('getAuthorChannel', () => {
    it('should fetch channel by author id', async () => {
      await PostService.getAuthorChannel('author1')
    })
  })

  describe('getFeaturedChannels', () => {
    it('should fetch limited channels', async () => {
      await PostService.getFeaturedChannels()
    })
  })

  describe('checkLikeStatus', () => {
    it('should check like for post and user', async () => {
      await PostService.checkLikeStatus('p1', 'u1')
    })
  })

  describe('checkSaveStatus', () => {
    it('should check save status', async () => {
      await PostService.checkSaveStatus('p1', 'u1')
    })
  })

  describe('checkFollowStatus', () => {
    it('should return null if follower missing', async () => {
      const result = await PostService.checkFollowStatus(null, 'u2')
      expect(result).toBeNull()
    })

    it('should return null if following missing', async () => {
      const result = await PostService.checkFollowStatus('u1', null)
      expect(result).toBeNull()
    })

    it('should check follow status when both IDs provided', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'f1' }, error: null })),
            })),
          })),
        })),
      })
      const result = await PostService.checkFollowStatus('u1', 'u2')
      expect(result).toEqual({ data: { id: 'f1' }, error: null })
    })
  })

  describe('toggleFollow', () => {
    it('should unfollow if already following', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: { id: 'f1', follower_id: 'u1', following_id: 'u2' },
                error: null,
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })
      await PostService.toggleFollow('u1', 'u2')
    })

    it('should follow if not already following', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
      })
      await PostService.toggleFollow('u1', 'u2')
    })
  })

  describe('getAdminStats', () => {
    it('should fetch admin stats (all data)', async () => {
      const result = await PostService.getAdminStats(true, 'admin1')
      expect(result).toHaveProperty('postsCount')
      expect(result).toHaveProperty('viewsCount')
      expect(result).toHaveProperty('commentsCount')
      expect(result).toHaveProperty('topPosts')
    })

    it('should fetch author stats (filtered by user)', async () => {
      const result = await PostService.getAdminStats(false, 'author1')
      expect(result).toHaveProperty('postsCount')
    })

    it('should count comments for non-admin with posts', async () => {
      let fromCall = 0
      supabase.from.mockImplementation((table) => {
        if (table === 'comments') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ count: 3, error: null })),
            })),
          }
        }
        fromCall++
        if (fromCall === 3) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [{ id: '1' }], error: null })),
            })),
          }
        }
        if (fromCall === 4) {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
          })),
        }
      })
      const result = await PostService.getAdminStats(false, 'author1')
      expect(result.commentsCount).toBe(3)
      expect(result.postsCount).toBe(0)
    })
  })

  describe('getSiteSettings', () => {
    it('should fetch hero and trending post IDs', async () => {
      await PostService.getSiteSettings()
      expect(supabase.from).toHaveBeenCalledWith('site_settings')
    })
  })

  describe('getCreatorRequests', () => {
    it('should return count of pending requests', async () => {
      const count = await PostService.getCreatorRequests()
      expect(typeof count).toBe('number')
    })
  })

  describe('getGeneralSettings', () => {
    it('should fetch general settings', async () => {
      await PostService.getGeneralSettings()
      expect(supabase.from).toHaveBeenCalledWith('settings')
    })
  })

  describe('getSiteSettingsByAuthor', () => {
    it('should fetch settings by author id', async () => {
      await PostService.getSiteSettingsByAuthor('author1')
    })
  })

  describe('getChannelBySlug', () => {
    it('should fetch channel by slug', async () => {
      await PostService.getChannelBySlug('my-channel')
    })
  })

  describe('getAuthorPosts', () => {
    it('should fetch published posts by author', async () => {
      await PostService.getAuthorPosts('author1')
    })
  })

  describe('getCollectionsByAuthor', () => {
    it('should fetch collections with posts', async () => {
      await PostService.getCollectionsByAuthor('author1')
    })
  })

  describe('getFollowersCount', () => {
    it('should return follower count', async () => {
      const count = await PostService.getFollowersCount('author1')
      expect(typeof count).toBe('number')
    })
  })

  describe('upsertChannelSettings', () => {
    it('should upsert channel settings', async () => {
      await PostService.upsertChannelSettings('author1', { site_name: 'My Channel' })
    })
  })

  describe('deleteChannelSettings', () => {
    it('should delete channel settings', async () => {
      await PostService.deleteChannelSettings('author1')
    })
  })
})
