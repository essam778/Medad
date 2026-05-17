import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}))

import { useSettings } from '@/hooks/useSettings'
import Footer from '../Footer'

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSettings.mockReturnValue({
      data: {
        social_links: {
          twitter: 'https://twitter.com/midad',
          facebook: 'https://facebook.com/midad',
          instagram: 'https://instagram.com/midad',
          github: 'https://github.com/midad',
          linkedin: 'https://linkedin.com/company/midad',
        },
      },
    })
  })

  describe('Rendering', () => {
    it('renders logo and brand name', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      const logoLink = screen.getByRole('link', { name: /الذهاب للرئيسية/i })
      expect(logoLink).toBeInTheDocument()
    })

    it('renders description text', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText(/المساحة العربية الأرقى/)).toBeInTheDocument()
    })

    it('renders platform links section', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText('المنصة')).toBeInTheDocument()
      expect(screen.getByText('عن مداد')).toBeInTheDocument()
      expect(screen.getByText('انضم إلينا')).toBeInTheDocument()
    })

    it('renders legal links section', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText('قانوني')).toBeInTheDocument()
      expect(screen.getByText('سياسة الخصوصية')).toBeInTheDocument()
      expect(screen.getByText('شروط الاستخدام')).toBeInTheDocument()
      expect(screen.getByText('تواصل معنا')).toBeInTheDocument()
    })



    it('renders copyright with current year', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      const year = new Date().getFullYear()
      expect(screen.getByText(new RegExp(year.toString()))).toBeInTheDocument()
    })

    it('renders version info', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText('الإصدار 1.0.0')).toBeInTheDocument()
    })
  })

  describe('Social links', () => {
    it('renders social links from settings', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      const twitterLink = screen.getByLabelText('تويتر مداد')
      expect(twitterLink).toBeInTheDocument()
      expect(twitterLink.getAttribute('href')).toBe('https://twitter.com/midad')
      expect(twitterLink.getAttribute('target')).toBe('_blank')
      expect(twitterLink.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('renders fallback social links when settings empty', () => {
      useSettings.mockReturnValue({ data: { social_links: {} } })
      render(<MemoryRouter><Footer /></MemoryRouter>)
      const twitterLink = screen.getByLabelText('تويتر مداد')
      expect(twitterLink.getAttribute('href')).toBe('https://twitter.com')
    })

    it('filters out social links with empty href', () => {
      useSettings.mockReturnValue({
        data: {
          social_links: {
            twitter: 'https://',
            github: 'https://',
            instagram: 'https://instagram.com/test',
          },
        },
      })
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.queryByLabelText('تويتر مداد')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('جيت هاب مداد')).not.toBeInTheDocument()
      expect(screen.getByLabelText('إنستغرام مداد')).toBeInTheDocument()
    })
  })

  describe('Correct links', () => {
    it('footer links have correct hrefs', () => {
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText('عن مداد').closest('a').getAttribute('href')).toBe('/about')
      expect(screen.getByText('انضم إلينا').closest('a').getAttribute('href')).toBe('/register')
      expect(screen.getByText('سياسة الخصوصية').closest('a').getAttribute('href')).toBe('/privacy')
    })
  })

  describe('Null settings', () => {
    it('renders without crashing when settings data is null', () => {
      useSettings.mockReturnValue({ data: null })
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText(/المساحة العربية الأرقى/)).toBeInTheDocument()
    })

    it('renders without crashing when settings is undefined', () => {
      useSettings.mockReturnValue({})
      render(<MemoryRouter><Footer /></MemoryRouter>)
      expect(screen.getByText(/المساحة العربية الأرقى/)).toBeInTheDocument()
    })
  })
})
