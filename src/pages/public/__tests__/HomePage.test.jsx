import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@auth')
vi.mock('@/components/shared/OptimizedImage', () => ({
  default: ({ src, alt, width, height, className, loading, fetchpriority }) => (
    <img src={src} alt={alt || ''} data-testid="optimized-img" className={className} />
  ),
}))
vi.mock('@/components/shared/Newsletter', () => ({
  default: () => <section data-testid="newsletter">Newsletter</section>,
}))
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
}))

import { useAuth } from '@auth'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import HomePage from '../HomePage'

const mockPost = (overrides = {}) => ({
  id: '1',
  title: 'Test Post',
  slug: 'test-post',
  cover_image_url: '/cover.jpg',
  published_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  tags: ['برمجة', 'تطوير'],
  views: 150,
  comments_count: 5,
  reactions_count: 10,
  author_id: 'author-1',
  profiles: { id: 'author-1', full_name: 'Test Author', avatar_url: '/author.jpg' },
  ...overrides,
})

function renderHomePage(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><HomePage /></MemoryRouter>)
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: null, isAdmin: false, isAuthor: false })
    useQuery.mockReturnValue({ data: [], isLoading: false })
  })

  describe('Basic rendering', () => {
    it('renders page title via Helmet', () => {
      renderHomePage()
      expect(screen.getByText('مداد - مستقبل الحبر الرقمي')).toBeInTheDocument()
    })

    it('renders posts section heading', () => {
      renderHomePage()
      expect(screen.getByText('أحدث المنشورات')).toBeInTheDocument()
    })
  })

  describe('Hero section', () => {
    it('renders hero with featured post', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'featuredChannels') return { data: [] }
        if (queryKey[0] === 'siteSettings') return { data: { hero_post_id: '1', trending_post_ids: [] } }
        return { data: [mockPost()] }
      })
      renderHomePage()
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    it('shows loading placeholder when no featured post', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'featuredChannels') return { data: [] }
        if (queryKey[0] === 'siteSettings') return { data: {} }
        return { data: [] }
      })
      renderHomePage()
      expect(screen.getByText('جاري تحميل المحتوى المتميز...')).toBeInTheDocument()
    })

    it('hides hero when search param is present', () => {
      renderHomePage('/?search=test')
      expect(screen.queryByText('جاري تحميل المحتوى المتميز...')).not.toBeInTheDocument()
    })
  })

  describe('Trending posts', () => {
    it('renders trending section', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'featuredChannels') return { data: [] }
        if (queryKey[0] === 'siteSettings') return { data: { hero_post_id: '1', trending_post_ids: [] } }
        return { data: [mockPost({ id: '1' }), mockPost({ id: '2', title: 'Trending Post' })] }
      })
      renderHomePage()
      expect(screen.getByText('الرائج الآن')).toBeInTheDocument()
    })
  })

  describe('Posts grid', () => {
    it('renders post cards', () => {
      useQuery.mockReturnValue({ data: [mockPost({ id: '1' }), mockPost({ id: '2', title: 'Second Post' })], isLoading: false })
      renderHomePage()
      expect(screen.getByText('Test Post')).toBeInTheDocument()
      expect(screen.getByText('Second Post')).toBeInTheDocument()
    })

    it('shows empty state when no posts', () => {
      renderHomePage('/?search=nonexistent')
      expect(screen.getByText(/عذراً، لم نجد أي مقالات تطابق بحثك/)).toBeInTheDocument()
    })

    it('shows load more button when more posts available', () => {
      const posts = Array.from({ length: 12 }, (_, i) => mockPost({ id: String(i + 1), title: `Post ${i + 1}` }))
      useQuery.mockReturnValue({ data: posts, isLoading: false })
      renderHomePage()
      expect(screen.getByText('عرض المزيد من المقالات')).toBeInTheDocument()
    })

    it('loads more posts on button click', () => {
      const posts = Array.from({ length: 12 }, (_, i) => mockPost({ id: String(i + 1), title: `Post ${i + 1}` }))
      useQuery.mockReturnValue({ data: posts, isLoading: false })
      renderHomePage()
      expect(screen.getByText('عرض المزيد من المقالات')).toBeInTheDocument()
      fireEvent.click(screen.getByText('عرض المزيد من المقالات'))
      const allPostTitles = screen.getAllByText(/Post \d+/)
      expect(allPostTitles.length).toBeGreaterThan(6)
    })
  })

  describe('Search mode', () => {
    it('shows search results heading', () => {
      renderHomePage('/?search=test')
      expect(screen.getByText(/المقالات والوسوم المطابقة لـ/)).toBeInTheDocument()
    })

    it('shows searched channels section', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'searchChannels') return { data: [{ channel_slug: 'test-ch', site_name: 'Test Channel', logo_url: '/logo.png' }] }
        return { data: [], isLoading: false }
      })
      renderHomePage('/?search=test')
      expect(screen.getByText('Test Channel')).toBeInTheDocument()
    })

    it('shows clear filter link in search mode', () => {
      renderHomePage('/?search=test')
      expect(screen.getByText('إلغاء الفلترة والعودة للمقالات العامة')).toBeInTheDocument()
    })
  })

  describe('Tag filter mode', () => {
    it('shows tag filtered heading', () => {
      renderHomePage('/?tag=برمجة')
      expect(screen.getByText(/مقالات في: #برمجة/)).toBeInTheDocument()
    })
  })

  describe('Featured channels', () => {
    it('renders featured authors section', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'featuredChannels') return { data: [{ channel_slug: 'author-ch', site_name: 'Featured Author', logo_url: '/logo.png' }] }
        if (queryKey[0] === 'siteSettings') return { data: {} }
        return { data: [] }
      })
      renderHomePage()
      expect(screen.getByText('مبدعون ننصح بمتابعتهم')).toBeInTheDocument()
      expect(screen.getByText('Featured Author')).toBeInTheDocument()
    })

    it('hides featured authors in search mode', () => {
      renderHomePage('/?search=test')
      expect(screen.queryByText('مبدعون ننصح بمتابعتهم')).not.toBeInTheDocument()
    })
  })

  describe('Newsletter', () => {
    it('renders newsletter section', () => {
      renderHomePage()
      expect(screen.getByTestId('newsletter')).toBeInTheDocument()
    })
  })
})
