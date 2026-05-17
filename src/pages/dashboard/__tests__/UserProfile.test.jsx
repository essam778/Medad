import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@auth', () => ({
  useAuth: vi.fn(),
  ProfileService: {
    getProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    getCreatorRequest: vi.fn(),
    createCreatorRequest: vi.fn(),
    deleteUser: vi.fn(),
    getPoints: vi.fn(),
  },
  AuthService: {
    updatePassword: vi.fn(),
  },
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', p: 'p', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))
vi.mock('@/components/shared/OptimizedImage', () => ({
  default: ({ src, className }) => <img src={src} alt="" data-testid="optimized-img" className={className} />,
}))
vi.mock('@/components/shared/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), toast: vi.fn() }),
}))

import { useAuth, ProfileService, AuthService } from '@auth'
import UserProfile from '../UserProfile'

function renderProfile() {
  return render(<MemoryRouter><UserProfile /></MemoryRouter>)
}

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@test.com' },
      profile: { id: 'user-1', full_name: 'Test User', email: 'test@test.com', role: 'reader', points: 50, bio: '' },
      updateProfile: vi.fn(),
      signOut: vi.fn(),
    })
    ProfileService.getCreatorRequest.mockResolvedValue({ data: null })
  })

  describe('Rendering', () => {
    it('renders user name heading', () => {
      renderProfile()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('renders role badge', () => {
      renderProfile()
      expect(screen.getByText('قارئ مشارك')).toBeInTheDocument()
    })

    it('renders admin role badge for admin', () => {
      useAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com' },
        profile: { id: '1', full_name: 'Admin', email: 'admin@test.com', role: 'admin', points: 500, bio: '' },
        updateProfile: vi.fn(),
        signOut: vi.fn(),
      })
      renderProfile()
      expect(screen.getByText('مدير عام المنصة')).toBeInTheDocument()
    })

    it('renders author role badge for author', () => {
      useAuth.mockReturnValue({
        user: { id: '1', email: 'author@test.com' },
        profile: { id: '1', full_name: 'Author', email: 'author@test.com', role: 'author', points: 200, bio: '' },
        updateProfile: vi.fn(),
        signOut: vi.fn(),
      })
      renderProfile()
      expect(screen.getByText('صانع محتوى متميز')).toBeInTheDocument()
    })
  })

  describe('Profile form', () => {
    it('renders full name input with current value', () => {
      renderProfile()
      const nameInput = screen.getByDisplayValue('Test User')
      expect(nameInput).toBeInTheDocument()
    })

    it('renders email input (disabled)', () => {
      renderProfile()
      const emailInput = screen.getByDisplayValue('test@test.com')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput.disabled).toBe(true)
    })

    it('renders bio textarea', () => {
      renderProfile()
      expect(screen.getByPlaceholderText(/أخبرنا قليلاً عن نفسك/)).toBeInTheDocument()
    })

    it('renders save button', () => {
      renderProfile()
      expect(screen.getByText('تحديث بيانات الحساب')).toBeInTheDocument()
    })

    it('calls updateProfile on save', async () => {
      const updateProfile = vi.fn().mockResolvedValue({ error: null })
      useAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@test.com' },
        profile: { id: 'user-1', full_name: 'Test User', email: 'test@test.com', role: 'reader', points: 50, bio: '' },
        updateProfile,
        signOut: vi.fn(),
      })
      renderProfile()
      fireEvent.click(screen.getByText('تحديث بيانات الحساب'))
      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalled()
      })
    })
  })

  describe('Notification settings', () => {
    it('renders notification options', () => {
      renderProfile()
      expect(screen.getByText('الكل')).toBeInTheDocument()
      expect(screen.getByText('مخصص')).toBeInTheDocument()
      expect(screen.getByText('صامت')).toBeInTheDocument()
    })

    it('defaults to all notifications', () => {
      renderProfile()
      const allBtn = screen.getByText('الكل')
      expect(allBtn).toBeInTheDocument()
    })
  })

  describe('Gamification', () => {
    it('renders points display', () => {
      renderProfile()
      expect(screen.getByText('50 نقطة')).toBeInTheDocument()
    })

    it('renders current level', () => {
      renderProfile()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Creator request', () => {
    it('shows creator request banner for reader', () => {
      renderProfile()
      expect(screen.getByText(/هل أنت جاهز لتكون ملهماً/)).toBeInTheDocument()
    })

    it('calls createCreatorRequest on request button', async () => {
      ProfileService.createCreatorRequest.mockResolvedValue({ error: null })
      renderProfile()
      fireEvent.click(screen.getByText('ارسل طلب الانضمام'))
      await waitFor(() => {
        expect(ProfileService.createCreatorRequest).toHaveBeenCalledWith('user-1', 'رغبة في الانضمام كصانع محتوى')
      })
    })

    it('hides creator banner for author', () => {
      useAuth.mockReturnValue({
        user: { id: '1', email: 'author@test.com' },
        profile: { id: '1', full_name: 'Author', email: 'author@test.com', role: 'author', points: 200, bio: '' },
        updateProfile: vi.fn(),
        signOut: vi.fn(),
      })
      renderProfile()
      expect(screen.queryByText(/هل أنت جاهز لتكون ملهماً/)).not.toBeInTheDocument()
    })
  })

  describe('Danger zone', () => {
    it('renders password change button', () => {
      renderProfile()
      expect(screen.getByText('تحديث كلمة المرور')).toBeInTheDocument()
    })

    it('renders sign out button', () => {
      renderProfile()
      expect(screen.getByText('تسجيل الخروج من مداد')).toBeInTheDocument()
    })

    it('calls signOut on sign out click', () => {
      const signOut = vi.fn()
      useAuth.mockReturnValue({
        user: { id: '1', email: 'test@test.com' },
        profile: { id: '1', full_name: 'Test', email: 'test@test.com', role: 'reader', points: 0, bio: '' },
        updateProfile: vi.fn(),
        signOut,
      })
      renderProfile()
      fireEvent.click(screen.getByText('تسجيل الخروج من مداد'))
      expect(signOut).toHaveBeenCalled()
    })

    it('renders delete account section', () => {
      renderProfile()
      expect(screen.getByText('منطقة الخطر')).toBeInTheDocument()
      expect(screen.getByText('حذف الحساب نهائياً')).toBeInTheDocument()
    })
  })

  describe('Password modal', () => {
    it('opens password modal on click', () => {
      renderProfile()
      fireEvent.click(screen.getByText('تحديث كلمة المرور'))
      expect(screen.getByText('كلمة مرور جديدة')).toBeInTheDocument()
    })

    it('calls updatePassword on submit', async () => {
      AuthService.updatePassword.mockResolvedValue({ error: null })
      renderProfile()
      fireEvent.click(screen.getByText('تحديث كلمة المرور'))
      const input = screen.getByPlaceholderText('6 أحرف على الأقل...')
      fireEvent.change(input, { target: { value: 'newpass123' } })
      fireEvent.submit(input.closest('form'))
      await waitFor(() => {
        expect(AuthService.updatePassword).toHaveBeenCalledWith('newpass123')
      })
    })
  })

  describe('Badges', () => {
    it('renders badge section', () => {
      renderProfile()
      expect(screen.getByText('مكتشف')).toBeInTheDocument()
      expect(screen.getByText('كاتب نشط')).toBeInTheDocument()
    })

    it('renders earned badges with full opacity', () => {
      renderProfile()
      const explorerBadge = screen.getByText('مكتشف')
      expect(explorerBadge.closest('[class*="border"]')).toBeTruthy()
    })
  })
})
