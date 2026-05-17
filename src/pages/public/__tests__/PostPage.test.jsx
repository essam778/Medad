import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('@auth')
vi.mock('@/components/shared/LoadingSpinner', () => ({
  default: ({ fullPage }) => <div data-testid="loading-spinner" data-fullpage={fullPage ? 'true' : 'false'}>Loading</div>,
}))
vi.mock('@/components/shared/NoticeModal', () => ({
  default: ({ open, title, message, variant, onAction, onClose }) => open ? (
    <div data-testid="notice-modal" data-variant={variant}>
      <h3>{title}</h3>
      <p>{message}</p>
      {onAction && <button data-testid="notice-action" onClick={onAction}>Confirm</button>}
      <button data-testid="notice-close" onClick={onClose}>Close</button>
    </div>
  ) : null,
}))
vi.mock('@/components/shared/OptimizedImage', () => ({
  default: ({ src, alt, width, height, className, loading, fetchpriority }) => (
    <img src={src} alt={alt || ''} data-testid="post-image" className={className} />
  ),
}))
vi.mock('@posts', () => ({
  PostService: {
    getPostBySlug: vi.fn(),
    incrementViews: vi.fn(),
    getAuthorChannel: vi.fn(),
    getComments: vi.fn(),
    checkLikeStatus: vi.fn(),
    checkSaveStatus: vi.fn(),
    checkFollowStatus: vi.fn(),
    getReactionCounts: vi.fn(),
    setReaction: vi.fn(),
    toggleSave: vi.fn(),
    toggleFollow: vi.fn(),
  },
  CommentSection: ({ postId, user, profile, disabled }) => (
    <div data-testid="comment-section" data-postid={postId} data-disabled={disabled ? 'true' : 'false'}>Comments</div>
  ),
}))
vi.mock('@/services/notification.service', () => ({
  NotificationService: {},
}))
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
}))

import { useAuth } from '@auth'
import { PostService } from '@posts'
import PostPage from '../PostPage'

const mockPostData = (overrides = {}) => ({
  id: 'post-1',
  title: 'Test Article Title',
  slug: 'test-article',
  content: '<p>Test article content</p><h2>Section 1</h2><p>Section content</p>',
  cover_image_url: '/cover.jpg',
  published_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  tags: ['برمجة', 'تطوير الويب'],
  views: 150,
  comments_disabled: false,
  author_id: 'author-1',
  profiles: { id: 'author-1', full_name: 'Test Author', avatar_url: '/author.jpg' },
  ...overrides,
})

function renderPostPage(slug = 'test-article') {
  return render(
    <MemoryRouter initialEntries={[`/post/${slug}`]}>
      <Routes>
        <Route path="/post/:slug" element={<PostPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: null, profile: null })
    PostService.getPostBySlug.mockResolvedValue({ data: mockPostData(), error: null })
    PostService.incrementViews.mockResolvedValue({})
    PostService.getAuthorChannel.mockResolvedValue({
      data: { channel_slug: 'author-channel', site_name: 'Test Author Channel', logo_url: '/logo.png' },
    })
    PostService.getComments.mockResolvedValue({ data: [] })
    PostService.checkLikeStatus.mockResolvedValue({ data: null })
    PostService.checkSaveStatus.mockResolvedValue({ data: null })
    PostService.checkFollowStatus.mockResolvedValue({ data: null })
    PostService.getReactionCounts.mockResolvedValue({
      data: { like: 10, love: 5, haha: 2, sad: 1, angry: 0 },
    })
  })

  describe('Loading state', () => {
    it('shows loading spinner while fetching', () => {
      PostService.getPostBySlug.mockImplementation(() => new Promise(() => {}))
      renderPostPage()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Post not found', () => {
    it('shows not found message when post is null', async () => {
      PostService.getPostBySlug.mockResolvedValue({ data: null, error: null })
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('المقال غير موجود')).toBeInTheDocument()
      })
    })
  })

  describe('Post rendering', () => {
    it('renders post title', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      })
    })

    it('renders post tags', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('# برمجة')).toBeInTheDocument()
      })
    })

    it('renders reading time', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText(/دقائق قراءة/)).toBeInTheDocument()
      })
    })

    it('renders author channel info', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('Test Author Channel')).toBeInTheDocument()
      })
    })

    it('renders follow button', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('متابعة المبدع')).toBeInTheDocument()
      })
    })

    it('renders comment section', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByTestId('comment-section')).toBeInTheDocument()
      })
    })

    it('renders floating bar actions', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('مشاركة')).toBeInTheDocument()
        expect(screen.getByText('حفظ')).toBeInTheDocument()
      })
    })
  })

  describe('User interactions', () => {
    it('shows auth notice for save when not logged in', async () => {
      renderPostPage()
      await waitFor(() => {
        fireEvent.click(screen.getByText('حفظ'))
      })
      expect(screen.getByText('تسجيل الدخول مطلوب')).toBeInTheDocument()
    })

    it('shows auth notice for reaction when not logged in', async () => {
      renderPostPage()
      await waitFor(() => {
        fireEvent.click(screen.getByText('أعجبني'))
      })
      expect(screen.getByText('تسجيل الدخول مطلوب')).toBeInTheDocument()
    })

    it('calls toggleSave when logged in', async () => {
      useAuth.mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } })
      PostService.toggleSave.mockResolvedValue({})
      renderPostPage()
      await waitFor(() => {
        fireEvent.click(screen.getByText('حفظ'))
      })
      expect(PostService.toggleSave).toHaveBeenCalledWith('post-1', 'user-1')
    })
  })

  describe('Trending badge', () => {
    it('shows trending badge for posts with high views', async () => {
      PostService.getPostBySlug.mockResolvedValue({ data: mockPostData({ views: 200 }), error: null })
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('رائج الآن')).toBeInTheDocument()
      })
    })

    it('hides trending badge for low view posts', async () => {
      PostService.getPostBySlug.mockResolvedValue({ data: mockPostData({ views: 50 }), error: null })
      renderPostPage()
      await waitFor(() => {
        expect(screen.queryByText('رائج الآن')).not.toBeInTheDocument()
      })
    })
  })

  describe('Share button', () => {
    it('renders share button', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('مشاركة')).toBeInTheDocument()
      })
    })
  })

  describe('Reaction stats', () => {
    it('shows reaction section with like button', async () => {
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('أعجبني')).toBeInTheDocument()
      })
    })
  })

  describe('Follow button', () => {
    it('shows following state after follow', async () => {
      useAuth.mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1' } })
      PostService.checkFollowStatus.mockResolvedValue({ data: { id: 'follow-1' } })
      PostService.toggleFollow.mockResolvedValue({})
      renderPostPage()
      await waitFor(() => {
        expect(screen.getByText('متابع ✓')).toBeInTheDocument()
      })
    })
  })
})
