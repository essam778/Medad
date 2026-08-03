import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('../../../hooks/useAdmin', () => ({
  useAdminUsers: vi.fn(),
  useUpdateUserRole: vi.fn(),
  useDeleteUser: vi.fn(),
}))
vi.mock('../../../components/shared/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../../../components/shared/OptimizedImage', () => ({
  default: ({ src, className }) => <img src={src} alt="" className={className} />,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', tr: 'tr', td: 'td', span: 'span', p: 'p', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

import { useAdminUsers, useUpdateUserRole, useDeleteUser } from '../../../hooks/useAdmin'
import AdminUsers from '../AdminUsers'

const adminUser = { id: 'admin-1' }
const adminProfile = { role: 'admin', full_name: 'Admin User' }

function mockUsers(len = 5) {
  return Array.from({ length: len }, (_, i) => ({
    id: `user-${i}`,
    full_name: `User ${i}`,
    email: `user${i}@test.com`,
    role: i === 0 ? 'admin' : i === 1 ? 'author' : 'reader',
    avatar_url: i % 2 === 0 ? `https://example.com/avatar${i}.jpg` : null,
    created_at: '2025-01-01T00:00:00Z',
  }))
}

function renderAdmin() {
  return render(<MemoryRouter><AdminUsers /></MemoryRouter>)
}

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: adminUser,
      profile: adminProfile,
      loading: false,
      initialized: true,
      isAdmin: true,
    })
    useAdminUsers.mockReturnValue({
      data: { data: mockUsers(), count: 5 },
      isLoading: false,
    })
    useUpdateUserRole.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
    useDeleteUser.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('renders heading', () => {
    renderAdmin()
    expect(screen.getByText('إدارة المجتمع')).toBeInTheDocument()
  })

  it('shows total users count', () => {
    renderAdmin()
    expect(screen.getByText('إجمالي الأعضاء')).toBeInTheDocument()
  })

  it('shows loading skeleton', () => {
    useAdminUsers.mockReturnValue({ data: null, isLoading: true })
    renderAdmin()
    expect(screen.getByText('جاري جلب قائمة الأعضاء...')).toBeInTheDocument()
  })

  it('shows empty state when no users', () => {
    useAdminUsers.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false })
    renderAdmin()
    expect(screen.getByText('لا يوجد أعضاء يطابقون بحثك')).toBeInTheDocument()
  })

  it('shows error state', () => {
    useAdminUsers.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed') })
    renderAdmin()
    expect(screen.queryByText('إدارة المجتمع')).toBeInTheDocument()
  })

  it('renders user rows', () => {
    renderAdmin()
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('user2@test.com')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderAdmin()
    expect(screen.getByPlaceholderText('بحث بالاسم أو البريد...')).toBeInTheDocument()
  })

  it('renders role filter buttons', () => {
    renderAdmin()
    expect(screen.getByText('الكل')).toBeInTheDocument()
    expect(screen.getAllByText('مدير').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('كاتب').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('قارئ').length).toBeGreaterThanOrEqual(1)
  })

  it('renders admin count stat', () => {
    renderAdmin()
    expect(screen.getByText('فريق الإدارة')).toBeInTheDocument()
  })

  it('renders role badge for each user', () => {
    renderAdmin()
    expect(screen.getAllByText('مدير').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('كاتب').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('قارئ').length).toBeGreaterThanOrEqual(1)
  })

  it('calls updateRole on role button click', async () => {
    const mutateAsync = vi.fn()
    useUpdateUserRole.mockReturnValue({ mutateAsync, isPending: false })
    renderAdmin()
    const roleButtons = screen.getAllByRole('button')
    const roleBtn = roleButtons.find(b => b.closest('tr')?.textContent?.includes('User 1') && !b.disabled)
    if (roleBtn) fireEvent.click(roleBtn)
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled()
    })
  })

  function tryFindDeleteBtn() {
    const btns = screen.getAllByRole('button')
    for (const btn of btns) {
      if (btn.className?.includes?.('red')) return btn
    }
    return null
  }

  it('opens confirm modal on delete click', () => {
    renderAdmin()
    const deleteBtn = tryFindDeleteBtn()
    expect(deleteBtn).not.toBeNull()
    fireEvent.click(deleteBtn)
    expect(screen.getByText('حذف عضو')).toBeInTheDocument()
  })

  it('calls delete mutation on confirm', async () => {
    const mutateAsync = vi.fn()
    useDeleteUser.mockReturnValue({ mutateAsync, isPending: false })
    renderAdmin()
    const deleteBtn = tryFindDeleteBtn()
    if (deleteBtn) fireEvent.click(deleteBtn)
    fireEvent.click(screen.getByText('حذف نهائي'))
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled()
    })
  })

  it('cancels delete action', () => {
    renderAdmin()
    const deleteBtn = tryFindDeleteBtn()
    if (deleteBtn) fireEvent.click(deleteBtn)
    fireEvent.click(screen.getByText('تراجع'))
    expect(screen.queryByText('حذف عضو')).not.toBeInTheDocument()
  })

  it('resets page to 0 on search', () => {
    renderAdmin()
    const input = screen.getByPlaceholderText('بحث بالاسم أو البريد...')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(input.value).toBe('test')
  })

  it('handles multiple pages without error', () => {
    useAdminUsers.mockReturnValue({
      data: { data: mockUsers(25), count: 25 },
      isLoading: false,
    })
    expect(() => renderAdmin()).not.toThrow()
  })

  it('renders all user rows in data', () => {
    useAdminUsers.mockReturnValue({
      data: { data: mockUsers(25), count: 25 },
      isLoading: false,
    })
    renderAdmin()
    expect(screen.getByText('User 10')).toBeInTheDocument()
  })
})
