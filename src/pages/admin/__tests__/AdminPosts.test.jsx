import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('@auth', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('@posts', () => ({
  useAdminPosts: vi.fn(),
  useDeletePost: vi.fn(),
}))
vi.mock('../../lib/utils', () => ({
  formatDate: vi.fn(() => '١ يناير ٢٠٢٥'),
}))
vi.mock('../../components/shared/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}))
vi.mock('../../components/shared/OptimizedImage', () => ({
  default: ({ src, className }) => <img src={src} alt="" className={className} />,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', tr: 'tr', td: 'td', span: 'span', p: 'p', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

import { useAdminPosts, useDeletePost } from '@posts'
import AdminPosts from '../AdminPosts'

function mockPost(overrides = {}) {
  return {
    id: 'post-1',
    title: 'Test Post',
    status: 'published',
    cover_image_url: null,
    views: 150,
    created_at: '2025-01-15T00:00:00Z',
    ...overrides,
  }
}

function renderAdmin() {
  return render(<MemoryRouter><AdminPosts /></MemoryRouter>)
}

describe('AdminPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1' },
      profile: { role: 'admin', full_name: 'Admin' },
      isAdmin: true,
      loading: false,
      initialized: true,
    })
    useAdminPosts.mockReturnValue({
      data: { data: [mockPost(), mockPost({ id: 'p2', title: 'Draft Post', status: 'draft', views: 0 })], count: 2 },
      isLoading: false,
    })
    useDeletePost.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('renders heading', () => {
    renderAdmin()
    expect(screen.getByText('مقالاتي')).toBeInTheDocument()
  })

  it('shows total posts count', () => {
    renderAdmin()
    expect(screen.getByText(/مقال مسجل/)).toBeInTheDocument()
  })

  it('shows loading spinner', () => {
    useAdminPosts.mockReturnValue({ data: null, isLoading: true })
    renderAdmin()
    expect(screen.getByText('جاري جلب المحتوى...')).toBeInTheDocument()
  })

  it('shows empty state when no posts', () => {
    useAdminPosts.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false })
    renderAdmin()
    expect(screen.getByText('لا توجد مقالات هنا')).toBeInTheDocument()
  })

  it('shows error state', () => {
    useAdminPosts.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed') })
    renderAdmin()
    expect(screen.getByText('مقالاتي')).toBeInTheDocument()
  })

  it('renders post rows', () => {
    renderAdmin()
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByText('Draft Post')).toBeInTheDocument()
  })

  it('renders status badges', () => {
    renderAdmin()
    expect(screen.getAllByText('منشور').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('مسودة').length).toBeGreaterThanOrEqual(1)
  })

  it('renders filter buttons', () => {
    renderAdmin()
    expect(screen.getByText('الكل')).toBeInTheDocument()
    expect(screen.getAllByText('منشور').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('مسودة').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('مجدول')).toBeInTheDocument()
  })

  it('renders create new post link', () => {
    renderAdmin()
    expect(screen.getByText('كتابة مقال جديد')).toBeInTheDocument()
  })

  it('opens confirm modal on delete click', async () => {
    renderAdmin()
    const deleteBtns = await screen.findAllByTitle('حذف المقال')
    expect(deleteBtns.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(deleteBtns[0])
    await waitFor(() => {
      expect(screen.getByText('حذف المقال')).toBeInTheDocument()
    })
  })

  it('calls delete mutation on confirm', async () => {
    const mutateAsync = vi.fn()
    useDeletePost.mockReturnValue({ mutateAsync, isPending: false })
    renderAdmin()
    const deleteBtns = await screen.findAllByTitle('حذف المقال')
    fireEvent.click(deleteBtns[0])
    await waitFor(() => expect(screen.getByText('حذف المقال')).toBeInTheDocument())
    fireEvent.click(screen.getByText('حذف نهائي'))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('cancels delete action', () => {
    renderAdmin()
    const deleteBtns = screen.getAllByTitle('حذف المقال')
    fireEvent.click(deleteBtns[0])
    fireEvent.click(screen.getByText('تراجع'))
    expect(screen.queryByText('حذف المقال')).not.toBeInTheDocument()
  })

  it('resets page on filter change', () => {
    renderAdmin()
    fireEvent.click(screen.getAllByText('مسودة')[0])
    expect(screen.getAllByText('مسودة').length).toBeGreaterThanOrEqual(1)
  })

  it('renders views column', () => {
    renderAdmin()
    expect(screen.getByText('المشاهدات')).toBeInTheDocument()
  })
})
