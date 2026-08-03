import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../../components/shared/ToastProvider'

const mockUseAuth = vi.fn()
vi.mock('@auth', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('../../../lib/supabase', () => {
  const mkChain = () => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      range: () => Promise.resolve({ data: [], count: 0, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      limit: () => chain,
    }
    return chain
  }
  return {
    supabase: {
      from: vi.fn(() => mkChain()),
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
      removeChannel: vi.fn(),
    },
    uploadImage: vi.fn(),
    forceRefreshSession: vi.fn(),
    getProfileWithRetry: vi.fn(),
    recordPostView: vi.fn(),
  }
})
vi.mock('@/features/posts/services/post.service', () => ({
  PostService: {
    getAdminStats: vi.fn(),
    getSiteSettings: vi.fn(() => Promise.resolve({ data: null, error: null })),
    getCreatorRequests: vi.fn(),
  },
}))
vi.mock('../../../components/shared/Skeletons', () => ({
  CardSkeleton: ({ className }) => <div className={className} data-testid="card-skeleton" />,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', p: 'p', button: 'button', h1: 'h1', h2: 'h2', h3: 'h3', label: 'label' },
  AnimatePresence: ({ children }) => children,
}))
vi.mock('recharts', () => ({
  AreaChart: 'area-chart',
  Area: 'area',
  XAxis: 'x-axis',
  YAxis: 'y-axis',
  CartesianGrid: 'cartesian-grid',
  Tooltip: 'tooltip',
  ResponsiveContainer: 'responsive-container',
}))

import { PostService } from '@/features/posts/services/post.service'
import AdminDashboard from '../AdminDashboard'

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AdminDashboard />
      </ToastProvider>
    </MemoryRouter>
  )
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1' },
      profile: { role: 'admin', full_name: 'Admin User', points: 250 },
      isAdmin: true,
      loading: false,
      initialized: true,
    })
    PostService.getAdminStats.mockResolvedValue({
      postsCount: 10,
      viewsCount: 5000,
      commentsCount: 42,
      topPosts: [
        { id: 'p1', title: 'Top Post', slug: 'top-post', views: 1000 },
        { id: 'p2', title: 'Second Post', slug: 'second-post', views: 500 },
      ],
    })
    PostService.getCreatorRequests.mockResolvedValue(3)
  })

  it('shows loading skeleton initially', () => {
    PostService.getAdminStats.mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(screen.getAllByTestId('card-skeleton').length).toBeGreaterThanOrEqual(1)
  })

  it('shows welcome heading', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/أهلاً بك/)).toBeInTheDocument()
    })
  })

  it('shows stats cards after loading', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('المقالات المنشورة')).toBeInTheDocument()
      expect(screen.getByText('مشاهدات الجمهور')).toBeInTheDocument()
    })
  })

  it('shows author-specific stats', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'author-1' },
      profile: { role: 'author', full_name: 'Author', points: 100 },
      isAdmin: false,
      loading: false,
      initialized: true,
    })
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('المقالات المنشورة')).toBeInTheDocument()
    })
  })

  it('shows top posts section', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('الأكثر قراءة')).toBeInTheDocument()
    })
  })

  it('shows top post titles', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Top Post')).toBeInTheDocument()
    })
  })

  it('shows points in stats', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('نقاط المبدع')).toBeInTheDocument()
    })
  })

  it('shows channels count for admin', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('القنوات المفعلة')).toBeInTheDocument()
    })
  })

  it('shows pending requests badge for admin', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getAllByText('طلبات مبدعين').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows admin featured manager for admin', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('إدارة المحتوى المتميز')).toBeInTheDocument()
    })
  })

  it('hides pending requests badge for non-admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'author-1' },
      profile: { role: 'author', full_name: 'Author', points: 100 },
      isAdmin: false,
      loading: false,
      initialized: true,
    })
    renderDashboard()
    await waitFor(() => {
      expect(screen.queryByText('طلبات مبدعين')).not.toBeInTheDocument()
    })
  })

  it('shows quick action buttons', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('مقال جديد')).toBeInTheDocument()
    })
  })

  it('shows admin settings link for admin', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('إعدادات المنصة')).toBeInTheDocument()
    })
  })

  it('hides admin settings link for non-admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'author-1' },
      profile: { role: 'author', full_name: 'Author', points: 100 },
      isAdmin: false,
      loading: false,
      initialized: true,
    })
    renderDashboard()
    await waitFor(() => {
      expect(screen.queryByText('إعدادات المنصة')).not.toBeInTheDocument()
    })
  })
})
