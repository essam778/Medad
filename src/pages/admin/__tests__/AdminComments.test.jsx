import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../hooks/useComments', () => ({
  useAdminComments: vi.fn(),
  useDeleteComment: vi.fn(),
}))
vi.mock('../../../lib/utils', () => ({
  formatDate: vi.fn(() => '١ يناير ٢٠٢٥'),
}))
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
    removeChannel: vi.fn(),
  },
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))
vi.mock('../../../components/shared/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', p: 'p', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

import { useAdminComments, useDeleteComment } from '../../../hooks/useComments'
import { supabase } from '../../../lib/supabase'
import AdminComments from '../AdminComments'

function renderComments() {
  return render(<MemoryRouter><AdminComments /></MemoryRouter>)
}

function mockComments(len = 3) {
  return Array.from({ length: len }, (_, i) => ({
    id: `c-${i}`,
    content: `Comment ${i} content`,
    is_approved: i % 2 === 0,
    created_at: '2025-01-15T00:00:00Z',
    profiles: { full_name: `User ${i}`, email: `user${i}@test.com` },
    posts: { title: `Post ${i}`, slug: `post-${i}` },
  }))
}

describe('AdminComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAdminComments.mockReturnValue({
      data: { data: mockComments(), count: 3 },
      isLoading: false,
    })
    useDeleteComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('renders without crashing when loading', () => {
    useAdminComments.mockReturnValue({ data: null, isLoading: true })
    expect(() => renderComments()).not.toThrow()
  })

  it('renders heading', () => {
    renderComments()
    expect(screen.getByText('إدارة التعليقات')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    useAdminComments.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false })
    renderComments()
    expect(screen.getByText('الرادار هادئ')).toBeInTheDocument()
  })

  it('renders comment items', () => {
    renderComments()
    expect(screen.getByText(/Comment 0 content/)).toBeInTheDocument()
    expect(screen.getByText(/User 1/)).toBeInTheDocument()
  })

  it('renders approved/pending labels', () => {
    renderComments()
    expect(screen.getAllByText('منشور').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('بانتظار التدقيق').length).toBeGreaterThanOrEqual(1)
  })

  it('renders post links', () => {
    renderComments()
    expect(screen.getByText(/Post 0/)).toBeInTheDocument()
  })

  it('opens confirm modal on delete click', async () => {
    renderComments()
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[btns.length - 1])
    await waitFor(() => {
      expect(screen.getByText('حذف التعليق')).toBeInTheDocument()
    })
  })

  it('calls delete mutation on confirm', async () => {
    const mutateAsync = vi.fn()
    useDeleteComment.mockReturnValue({ mutateAsync, isPending: false })
    renderComments()
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[btns.length - 1])
    await waitFor(() => expect(screen.getByText('حذف التعليق')).toBeInTheDocument())
    fireEvent.click(screen.getByText('حذف الآن'))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('cancels delete action', () => {
    renderComments()
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[btns.length - 1])
    fireEvent.click(screen.getByText('تراجع'))
    expect(screen.queryByText('حذف التعليق')).not.toBeInTheDocument()
  })

  it('toggles approve', async () => {
    renderComments()
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[btns.length - 2])
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('comments')
    })
  })
})
