import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@auth')
vi.mock('@/features/auth/services/auth.service', () => ({
  AuthService: {
    checkInviteCode: vi.fn(),
    signUp: vi.fn(),
    markInviteCodeUsed: vi.fn(),
  },
}))
vi.mock('@/components/shared/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), toast: vi.fn() }),
}))

import { useAuth } from '@auth'
import { AuthService } from '@/features/auth/services/auth.service'
import RegisterPage from '../RegisterPage'

function renderRegister() {
  return render(<MemoryRouter><RegisterPage /></MemoryRouter>)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: null })
  })

  describe('Rendering', () => {
    it('renders brand name and heading', () => {
      renderRegister()
      expect(screen.getByText('مداد')).toBeInTheDocument()
      expect(screen.getByText('إنشاء حساب')).toBeInTheDocument()
    })

    it('renders all form inputs', () => {
      renderRegister()
      expect(screen.getByPlaceholderText('أحمد علي')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('اختياري...')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderRegister()
      expect(screen.getByText('إنشاء الحساب')).toBeInTheDocument()
    })

    it('renders login link', () => {
      renderRegister()
      const link = screen.getByText('تسجيل الدخول')
      expect(link).toBeInTheDocument()
      expect(link.closest('a').getAttribute('href')).toBe('/login')
    })
  })

  describe('Form interactions', () => {
    it('updates full name on input change', () => {
      renderRegister()
      const input = screen.getByPlaceholderText('أحمد علي')
      fireEvent.change(input, { target: { value: 'Test User' } })
      expect(input.value).toBe('Test User')
    })

    it('updates email on input change', () => {
      renderRegister()
      const input = screen.getByPlaceholderText('name@example.com')
      fireEvent.change(input, { target: { value: 'test@test.com' } })
      expect(input.value).toBe('test@test.com')
    })

    it('updates invite code on input change', () => {
      renderRegister()
      const input = screen.getByPlaceholderText('اختياري...')
      fireEvent.change(input, { target: { value: 'INVITE123' } })
      expect(input.value).toBe('INVITE123')
    })

    it('password input is masked by default', () => {
      renderRegister()
      const passInput = screen.getByPlaceholderText('••••••••')
      expect(passInput.type).toBe('password')
    })
  })

  describe('Registration flow', () => {
    it('registers successfully without invite code', async () => {
      AuthService.signUp.mockResolvedValue({ error: null })
      renderRegister()
      fireEvent.change(screen.getByPlaceholderText('أحمد علي'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.submit(screen.getByText('إنشاء الحساب').closest('form'))
      await waitFor(() => {
        expect(AuthService.signUp).toHaveBeenCalledWith('test@test.com', 'password123', 'Test User', 'reader')
      })
    })

    it('registers with valid invite code', async () => {
      AuthService.checkInviteCode.mockResolvedValue({ data: { role: 'author' }, error: null })
      AuthService.signUp.mockResolvedValue({ error: null })
      AuthService.markInviteCodeUsed.mockResolvedValue({})
      renderRegister()
      fireEvent.change(screen.getByPlaceholderText('أحمد علي'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByPlaceholderText('اختياري...'), { target: { value: 'AUTHOR2024' } })
      fireEvent.submit(screen.getByText('إنشاء الحساب').closest('form'))
      await waitFor(() => {
        expect(AuthService.checkInviteCode).toHaveBeenCalledWith('AUTHOR2024')
        expect(AuthService.signUp).toHaveBeenCalledWith('test@test.com', 'password123', 'Test User', 'author')
        expect(AuthService.markInviteCodeUsed).toHaveBeenCalledWith('AUTHOR2024')
      })
    })

    it('shows error for invalid invite code', async () => {
      AuthService.checkInviteCode.mockResolvedValue({ data: null, error: new Error('Invalid') })
      renderRegister()
      fireEvent.change(screen.getByPlaceholderText('أحمد علي'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.change(screen.getByPlaceholderText('اختياري...'), { target: { value: 'BADCODE' } })
      fireEvent.submit(screen.getByText('إنشاء الحساب').closest('form'))
      await waitFor(() => {
        expect(screen.getByText('كود الدعوة غير صحيح أو تم استخدامه مسبقاً')).toBeInTheDocument()
      })
    })

    it('shows error message on signup failure', async () => {
      AuthService.signUp.mockResolvedValue({ error: new Error('Email already in use') })
      renderRegister()
      fireEvent.change(screen.getByPlaceholderText('أحمد علي'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'existing@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.submit(screen.getByText('إنشاء الحساب').closest('form'))
      await waitFor(() => {
        expect(screen.getByText('فشل التسجيل')).toBeInTheDocument()
      })
    })
  })

  describe('Email sent view', () => {
    it('shows success screen after registration', async () => {
      AuthService.signUp.mockResolvedValue({ error: null })
      renderRegister()
      fireEvent.change(screen.getByPlaceholderText('أحمد علي'), { target: { value: 'Test User' } })
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.submit(screen.getByText('إنشاء الحساب').closest('form'))
      await waitFor(() => {
        expect(screen.getByText('تحقق من بريدك')).toBeInTheDocument()
        expect(screen.getByText('test@test.com')).toBeInTheDocument()
        expect(screen.getByText('العودة للدخول')).toBeInTheDocument()
      })
    })
  })



  describe('Auth redirect', () => {
    it('redirects to /studio when already logged in', () => {
      useAuth.mockReturnValue({ user: { id: '1' } })
      renderRegister()
      expect(screen.getByText('مداد')).toBeInTheDocument()
    })
  })
})
