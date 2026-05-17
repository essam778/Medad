import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

vi.mock('framer-motion', () => ({
  motion: { div: 'div', footer: 'footer', span: 'span', p: 'p', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

vi.mock('@/features/auth/context/AuthContext')

import { useAuth } from '@/features/auth/context/AuthContext'
import LoginPage from '../LoginPage'

function renderLogin() {
  return render(<MemoryRouter><LoginPage /></MemoryRouter>)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: null })
  })

  describe('Rendering', () => {
    it('renders brand name and heading', () => {
      renderLogin()
      expect(screen.getByText('مداد')).toBeInTheDocument()
      expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument()
    })

    it('renders email and password inputs', () => {
      renderLogin()
      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    })

    it('renders login button', () => {
      renderLogin()
      expect(screen.getByText('دخول')).toBeInTheDocument()
    })

    it('renders OAuth buttons', () => {
      renderLogin()
      expect(screen.getByText('جوجل')).toBeInTheDocument()
      expect(screen.getByText('آبل')).toBeInTheDocument()
    })

    it('renders register link', () => {
      renderLogin()
      const link = screen.getByText('أنشئ حساباً جديداً')
      expect(link).toBeInTheDocument()
      expect(link.closest('a').getAttribute('href')).toBe('/register')
    })

    it('renders forgot password link', () => {
      renderLogin()
      expect(screen.getByText('نسيت كلمة المرور؟')).toBeInTheDocument()
    })
  })

  describe('Form interactions', () => {
    it('updates email on input change', () => {
      renderLogin()
      const emailInput = screen.getByPlaceholderText('name@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
      expect(emailInput.value).toBe('test@test.com')
    })

    it('updates password on input change', () => {
      renderLogin()
      const passInput = screen.getByPlaceholderText('••••••••')
      fireEvent.change(passInput, { target: { value: 'mypassword' } })
      expect(passInput.value).toBe('mypassword')
    })

    it('password input is masked by default', () => {
      renderLogin()
      const passInput = screen.getByPlaceholderText('••••••••')
      expect(passInput.type).toBe('password')
    })
  })

  describe('Login flow', () => {
    it('calls signInWithPassword on form submit', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '1' } }, error: null })
      renderLogin()
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
      fireEvent.submit(screen.getByText('دخول').closest('form'))
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: 'password123',
        })
      })
    })

    it('shows error message on login failure', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid credentials'),
      })
      renderLogin()
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
      fireEvent.submit(screen.getByText('دخول').closest('form'))
      await waitFor(() => {
        expect(screen.getByText('البريد الإلكتروني أو كلمة المرور غير صحيحة')).toBeInTheDocument()
      })
    })

    it('shows loading state during login', async () => {
      supabase.auth.signInWithPassword.mockImplementation(() => new Promise(() => {}))
      renderLogin()
      fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password' } })
      fireEvent.submit(screen.getByText('دخول').closest('form'))
      expect(await screen.findByText('جاري الدخول...')).toBeInTheDocument()
    })
  })

  describe('OAuth flow', () => {
    it('calls signInWithOAuth for Google', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
      renderLogin()
      fireEvent.click(screen.getByText('جوجل'))
      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
      })
    })

    it('shows error on OAuth failure', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({ error: new Error('OAuth failed') })
      renderLogin()
      fireEvent.click(screen.getByText('جوجل'))
      await waitFor(() => {
        expect(screen.getByText(/فشل الدخول عبر google/)).toBeInTheDocument()
      })
    })
  })

  describe('Auth redirect', () => {
    it('redirects to /studio when already logged in', () => {
      useAuth.mockReturnValue({ user: { id: '1' } })
      const { container } = renderLogin()
      expect(container.innerHTML).toContain('مداد')
    })
  })

  describe('Correct links', () => {
    it('register link goes to /register', () => {
      renderLogin()
      const link = screen.getByText('أنشئ حساباً جديداً').closest('a')
      expect(link.getAttribute('href')).toBe('/register')
    })
  })
})
