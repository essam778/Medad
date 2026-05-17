import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@auth')
vi.mock('@/context/ThemeContext')
vi.mock('@/components/shared/OptimizedImage', () => ({
  default: ({ src, alt, width, height }) => (
    <img src={src} alt={alt || ''} width={width} height={height} data-testid="optimized-img" />
  ),
}))

import { useAuth } from '@auth'
import { useTheme } from '@/context/ThemeContext'
import Header from '../Header'

function renderHeader(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><Header /></MemoryRouter>)
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTheme.mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() })
    useAuth.mockReturnValue({ user: null, profile: null, signOut: vi.fn() })
  })

  describe('Rendering', () => {
    it('renders logo and brand name with link to home', () => {
      renderHeader()
      const link = screen.getByRole('link', { name: /مداد/i })
      expect(link).toBeInTheDocument()
      expect(link.getAttribute('href')).toBe('/')
    })

    it('renders login link for unauthenticated users', () => {
      renderHeader()
      const loginLink = screen.getByText('دخول')
      expect(loginLink).toBeInTheDocument()
      expect(loginLink.closest('a').getAttribute('href')).toBe('/login')
    })

    it('hides login link for authenticated users', () => {
      useAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' },
        profile: { role: 'reader', full_name: 'Test', points: 50 },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.queryByText('دخول')).not.toBeInTheDocument()
    })
  })

  describe('Auth-based rendering', () => {
    it('shows user avatar when logged in with avatar_url', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Test', avatar_url: '/avatar.jpg', points: 0 },
        signOut: vi.fn(),
      })
      renderHeader()
      const imgs = screen.getAllByTestId('optimized-img')
      expect(imgs.length).toBeGreaterThanOrEqual(1)
    })

    it('shows initial letter when user has no avatar', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'أحمد', avatar_url: null, points: 0 },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.getByText('أ')).toBeInTheDocument()
    })

    it('displays points and level for logged in user', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Test', avatar_url: null, points: 250 },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.getByText('250')).toBeInTheDocument()
      expect(screen.getByText(/LVL 3/)).toBeInTheDocument()
    })

    it('shows author-only nav links for author role', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'author', full_name: 'Author', points: 50, avatar_url: null },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.getAllByText('سلاسل').length).toBe(2)
      expect(screen.getAllByText('مقالاتي').length).toBe(2)
    })

    it('shows author-only nav links for admin role', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'admin', full_name: 'Admin', points: 50, avatar_url: null },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.getAllByText('سلاسل').length).toBe(2)
      expect(screen.getAllByText('مقالاتي').length).toBe(2)
    })

    it('hides author-only links for reader role', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Reader', points: 0, avatar_url: null },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.queryByText('سلاسل')).not.toBeInTheDocument()
      expect(screen.queryByText('مقالاتي')).not.toBeInTheDocument()
    })

    it('shows create post button for author role', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'author', full_name: 'Author', points: 0, avatar_url: null },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.getByText('أنتج')).toBeInTheDocument()
    })

    it('hides create post button for reader role', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Reader', points: 0, avatar_url: null },
        signOut: vi.fn(),
      })
      renderHeader()
      expect(screen.queryByText('أنتج')).not.toBeInTheDocument()
    })
  })

  describe('User interactions', () => {
    it('opens mobile menu with login/register for guests', () => {
      useAuth.mockReturnValue({ user: null, profile: null, signOut: vi.fn() })
      renderHeader()
      fireEvent.click(screen.getByLabelText('القائمة'))
      expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument()
      expect(screen.getByText('إنشاء حساب')).toBeInTheDocument()
    })

    it('opens user menu dropdown on avatar click', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Test User', avatar_url: null, points: 100 },
        signOut: vi.fn(),
      })
      renderHeader()
      fireEvent.click(screen.getByLabelText('قائمة المستخدم'))
      expect(screen.getAllByText('لوحة التحكم').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('الملف الشخصي')).toBeInTheDocument()
    })

    it('calls signOut on logout click', () => {
      const signOut = vi.fn()
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'reader', full_name: 'Test', avatar_url: null, points: 0 },
        signOut,
      })
      renderHeader()
      fireEvent.click(screen.getByLabelText('قائمة المستخدم'))
      fireEvent.click(screen.getAllByText('تسجيل الخروج')[0])
      expect(signOut).toHaveBeenCalled()
    })

    it('opens search overlay and allows input', () => {
      useAuth.mockReturnValue({ user: null, profile: null, signOut: vi.fn() })
      renderHeader()
      fireEvent.click(screen.getByLabelText('البحث'))
      expect(screen.getByPlaceholderText('عن ماذا تبحث اليوم؟')).toBeInTheDocument()
      const input = screen.getByPlaceholderText('عن ماذا تبحث اليوم؟')
      fireEvent.change(input, { target: { value: 'test' } })
      expect(input.value).toBe('test')
    })

    it('shows popular search tags', () => {
      useAuth.mockReturnValue({ user: null, profile: null, signOut: vi.fn() })
      renderHeader()
      fireEvent.click(screen.getByLabelText('البحث'))
      expect(screen.getByText('#البرمجة')).toBeInTheDocument()
      expect(screen.getByText('#تطوير الذات')).toBeInTheDocument()
    })

    it('shows create post button in mobile menu for author', () => {
      useAuth.mockReturnValue({
        user: { id: '1' },
        profile: { role: 'author', full_name: 'Author', avatar_url: null, points: 0 },
        signOut: vi.fn(),
      })
      renderHeader()
      fireEvent.click(screen.getByLabelText('القائمة'))
      expect(screen.getByText('أنتج مقالاً جديداً')).toBeInTheDocument()
    })
  })

  describe('Correct links', () => {
    it('category link points to /categories', () => {
      renderHeader()
      const links = screen.getAllByText('التصنيفات')
      expect(links[0].closest('a').getAttribute('href')).toBe('/categories')
    })

    it('writers link points to /writers', () => {
      renderHeader()
      const links = screen.getAllByText('اكتشف')
      expect(links[0].closest('a').getAttribute('href')).toBe('/writers')
    })
  })
})
