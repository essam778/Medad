import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockUseAuth = vi.fn()
vi.mock('@auth', () => ({
  useAuth: () => mockUseAuth(),
}))
vi.mock('../../../hooks/useSettings', () => ({
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
}))
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 's1' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
    removeChannel: vi.fn(),
  },
  uploadImage: vi.fn(),
  forceRefreshSession: vi.fn(),
  getProfileWithRetry: vi.fn(),
  recordPostView: vi.fn(),
}))
vi.mock('../../../lib/utils', () => ({
  getErrorMessage: (err) => err?.message || 'Unknown error',
}))
vi.mock('../../../components/shared/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('../../../components/shared/OptimizedImage', () => ({
  default: ({ src, className }) => <img src={src} alt="" className={className} />,
}))
vi.mock('framer-motion', () => ({
  motion: { div: 'div', span: 'span', p: 'p', button: 'button', h1: 'h1', h2: 'h2', h3: 'h3', label: 'label' },
  AnimatePresence: ({ children }) => children,
}))

import { useSettings, useUpdateSettings } from '../../../hooks/useSettings'
import AdminSettings from '../AdminSettings'

function renderSettings() {
  return render(<MemoryRouter><AdminSettings /></MemoryRouter>)
}

const defaultSettings = {
  site_name: 'مداد',
  site_description: 'Arabic blogging platform',
  logo_url: null,
  posts_per_page: 10,
  comments_enabled: true,
  social_links: {
    twitter: 'https://twitter.com/midad',
    facebook: '',
    instagram: '',
    linkedin: '',
    github: '',
  },
  support_email: 'support@midad.me',
  privacy_policy: '',
  terms_of_service: '',
  about_us: '',
  contact_us: '',
  contact_phone: '',
  contact_address: '',
  contact_hours: '',
  faq: [{ question: 'What is Midad?', answer: 'A platform', category: 'General' }],
}

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-1' },
      profile: { role: 'admin', full_name: 'Admin' },
      isAdmin: true,
      loading: false,
      initialized: true,
    })
    useSettings.mockReturnValue({
      data: defaultSettings,
      isLoading: false,
    })
    useUpdateSettings.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
  })

  it('renders without crashing when loading', () => {
    useSettings.mockReturnValue({ data: null, isLoading: true })
    expect(() => renderSettings()).not.toThrow()
  })

  it('renders heading', () => {
    renderSettings()
    expect(screen.getByText('إعدادات المنصة')).toBeInTheDocument()
  })

  it('renders site name input', () => {
    renderSettings()
    expect(screen.getByDisplayValue('مداد')).toBeInTheDocument()
  })

  it('renders support email input', () => {
    renderSettings()
    expect(screen.getByDisplayValue('support@midad.me')).toBeInTheDocument()
  })

  it('renders social link inputs', () => {
    renderSettings()
    expect(screen.getByDisplayValue('https://twitter.com/midad')).toBeInTheDocument()
  })

  it('renders FAQ section', () => {
    renderSettings()
    expect(screen.getByText('إدارة الأسئلة الشائعة')).toBeInTheDocument()
  })

  it('renders FAQ items', () => {
    renderSettings()
    expect(screen.getByDisplayValue('What is Midad?')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderSettings()
    expect(screen.getByText('تحديث إعدادات المنصة')).toBeInTheDocument()
  })

  it('renders basic info section', () => {
    renderSettings()
    expect(screen.getByText('المعلومات الأساسية')).toBeInTheDocument()
  })

  it('renders legal section', () => {
    renderSettings()
    expect(screen.getByText('الدعم والقانون')).toBeInTheDocument()
  })

  it('calls updateSettings on save', async () => {
    const mutateAsync = vi.fn()
    useUpdateSettings.mockReturnValue({ mutateAsync, isPending: false })
    renderSettings()
    fireEvent.click(screen.getByText('تحديث إعدادات المنصة'))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
  })

  it('shows empty FAQ state', () => {
    useSettings.mockReturnValue({
      data: { ...defaultSettings, faq: [] },
      isLoading: false,
    })
    renderSettings()
    expect(screen.getByText('لا توجد أسئلة شائعة حالياً')).toBeInTheDocument()
  })

  it('shows loading state while submitting', () => {
    useUpdateSettings.mockReturnValue({ mutateAsync: vi.fn(), isPending: true })
    renderSettings()
    expect(screen.getByText('جاري المزامنة...')).toBeInTheDocument()
  })
})
