import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

const ThrowComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>正常组件</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>child content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('should catch error and show fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should have reload button', () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadBtn = screen.getByText('إعادة التحميل')
    fireEvent.click(reloadBtn)
    expect(reloadSpy).toHaveBeenCalled()
  })

  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
