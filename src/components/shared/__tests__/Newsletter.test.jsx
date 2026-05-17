import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Newsletter from '../Newsletter'

vi.mock('framer-motion', () => ({
  motion: { div: 'div', form: 'form' },
  AnimatePresence: ({ children }) => children,
}))

describe('Newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders heading', () => {
    render(<Newsletter />)
    expect(screen.getByText('انضم لنخبة قراء مداد')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<Newsletter />)
    expect(screen.getByText(/اشترك في نشرتنا الأسبوعية/)).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('renders submit button', () => {
    render(<Newsletter />)
    expect(screen.getByText('اشترك الآن')).toBeInTheDocument()
  })

  it('updates email on input change', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    fireEvent.change(input, { target: { value: 'test@test.com' } })
    expect(input.value).toBe('test@test.com')
  })

  it('shows loading state on submit', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    fireEvent.change(input, { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByText('اشترك الآن'))
    expect(screen.getByText('جاري الاشتراك...')).toBeInTheDocument()
  })

  it('disables button during loading', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    fireEvent.change(input, { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByText('اشترك الآن'))
    expect(screen.getByText('جاري الاشتراك...')).toBeDisabled()
  })

  it('shows success state after timeout', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    fireEvent.change(input, { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByText('اشترك الآن'))
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.getByText('تم الاشتراك بنجاح! أهلاً بك في النخبة.')).toBeInTheDocument()
  })

  it('does not submit if email is empty (required attribute)', () => {
    render(<Newsletter />)
    const input = screen.getByPlaceholderText('بريدك الإلكتروني...')
    expect(input).toBeRequired()
  })

  it('renders Mail icon', () => {
    const { container } = render(<Newsletter />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
