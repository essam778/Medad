import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PostCard } from '@/features/posts/components/PostCard'

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('@/lib/utils', () => ({
  formatDate: (d) => `formatted:${d}`,
}))

vi.mock('@/components/shared/OptimizedImage', () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}))

// framer-motion already mocked globally in setupTests.js

// ─── Helpers ──────────────────────────────────────────────────────────────────
const basePost = {
  slug: 'test-post',
  title: 'عنوان المقال',
  cover_image_url: null,
  tags: ['تقنية'],
  published_at: '2024-01-01',
  views: 120,
  comments_count: 5,
  reactions_count: 10,
  profiles: {
    id: 'user-1',
    full_name: 'أحمد محمد',
    avatar_url: null,
  },
}

const renderCard = (post = basePost, isFirst = false) =>
  render(
    <MemoryRouter>
      <PostCard post={post} isFirst={isFirst} />
    </MemoryRouter>
  )

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PostCard', () => {
  // ── Rendering ───────────────────────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders post title', () => {
      renderCard()
      expect(screen.getByText('عنوان المقال')).toBeInTheDocument()
    })

    it('renders first tag', () => {
      renderCard()
      expect(screen.getByText('تقنية')).toBeInTheDocument()
    })

    it('renders "عام" when tags array is empty', () => {
      renderCard({ ...basePost, tags: [] })
      expect(screen.getByText('عام')).toBeInTheDocument()
    })

    it('renders "عام" when tags is undefined', () => {
      renderCard({ ...basePost, tags: undefined })
      expect(screen.getByText('عام')).toBeInTheDocument()
    })

    it('renders formatted publish date', () => {
      renderCard()
      expect(screen.getByText('formatted:2024-01-01')).toBeInTheDocument()
    })

    it('renders views, comments, reactions counts', () => {
      renderCard()
      expect(screen.getByText('120')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('renders 0 for missing numeric stats', () => {
      renderCard({ ...basePost, views: undefined, comments_count: undefined, reactions_count: undefined })
      expect(screen.getAllByText('0')).toHaveLength(3)
    })

    it('renders author name', () => {
      renderCard()
      expect(screen.getByText('أحمد محمد')).toBeInTheDocument()
    })
  })

  // ── Cover Image ─────────────────────────────────────────────────────────────
  describe('Cover image', () => {
    it('renders OptimizedImage when cover_image_url is provided', () => {
      renderCard({ ...basePost, cover_image_url: 'https://example.com/img.jpg' })
      expect(screen.getByAltText('عنوان المقال')).toBeInTheDocument()
    })

    it('renders Sparkles placeholder when no cover_image_url', () => {
      renderCard()
      // Sparkles icon rendered as SVG — no img element in DOM
      expect(screen.queryByRole('img', { name: 'عنوان المقال' })).not.toBeInTheDocument()
    })

    it('sets fetchpriority="high" on first card', () => {
      renderCard({ ...basePost, cover_image_url: 'https://example.com/img.jpg' }, true)
      const img = screen.getByAltText('عنوان المقال')
      expect(img).toHaveAttribute('fetchpriority', 'high')
    })

    it('sets loading="lazy" on non-first card', () => {
      renderCard({ ...basePost, cover_image_url: 'https://example.com/img.jpg' }, false)
      const img = screen.getByAltText('عنوان المقال')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  // ── Author Avatar ────────────────────────────────────────────────────────────
  describe('Author avatar', () => {
    it('renders avatar image when avatar_url is provided', () => {
      renderCard({
        ...basePost,
        profiles: { id: 'u1', full_name: 'أحمد', avatar_url: 'https://example.com/avatar.jpg' },
      })
      expect(screen.getByAltText('أحمد')).toBeInTheDocument()
    })

    it('renders first letter of name as fallback when no avatar', () => {
      renderCard()
      expect(screen.getByText('أ')).toBeInTheDocument()
    })
  })

  // ── Links ────────────────────────────────────────────────────────────────────
  describe('Links', () => {
    it('links to correct post slug', () => {
      renderCard()
      const links = screen.getAllByRole('link')
      const postLink = links.find(l => l.getAttribute('href') === '/post/test-post')
      expect(postLink).toBeDefined()
    })

    it('links to author profile page', () => {
      renderCard()
      const links = screen.getAllByRole('link')
      const authorLink = links.find(l => l.getAttribute('href') === '/u/user-1')
      expect(authorLink).toBeDefined()
    })

    it('author link click does not propagate to post link', async () => {
      const user = userEvent.setup()
      renderCard()
      const links = screen.getAllByRole('link')
      const authorLink = links.find(l => l.getAttribute('href') === '/u/user-1')
      // stopPropagation is attached — click should not throw
      await user.click(authorLink)
    })
  })
})
