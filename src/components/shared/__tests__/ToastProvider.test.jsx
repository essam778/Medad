import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../ToastProvider'

function TestComponent() {
  const toast = useToast()
  return (
    <div>
      <button data-testid="show-success" onClick={() => toast.success('Success message')}>
        Show Success
      </button>
      <button data-testid="show-error" onClick={() => toast.error('Error message')}>
        Show Error
      </button>
      <button data-testid="show-info" onClick={() => toast.info('Info message')}>
        Show Info
      </button>
      <button data-testid="show-toast" onClick={() => toast.toast({ title: 'Custom', message: 'Custom msg', type: 'info' })}>
        Show Toast
      </button>
    </div>
  )
}

function NoDismissComponent() {
  const toast = useToast()
  return (
    <button data-testid="show-no-dismiss" onClick={() => toast.toast({ title: 'Permanent', message: 'Stays forever', type: 'info', duration: 0 })}>
      Show No Dismiss
    </button>
  )
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render children', () => {
    render(
      <ToastProvider>
        <div>child</div>
      </ToastProvider>
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('should show success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-success'))
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByText('تم')).toBeInTheDocument()
  })

  it('should show error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-error'))
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByText('خطأ')).toBeInTheDocument()
  })

  it('should show info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-info'))
    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(screen.getByText('تنبيه')).toBeInTheDocument()
  })

  it('should auto-dismiss toast after duration', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-success'))
    expect(screen.getByText('Success message')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
  })

  it('should remove toast on close button click', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-success'))

    const closeButtons = screen.getAllByRole('button')
    const closeBtn = closeButtons.find(btn => btn.innerHTML.includes('X') || btn.querySelector('svg'))
    if (closeBtn) {
      fireEvent.click(closeBtn)
      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    }
  })

  it('should not auto-dismiss when duration is 0', () => {
    render(
      <ToastProvider>
        <NoDismissComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByTestId('show-no-dismiss'))
    expect(screen.getByText('Stays forever')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('Stays forever')).toBeInTheDocument()
  })

  it('should limit to 5 toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByTestId('show-success'))
    }

    const toasts = screen.getAllByText('Success message')
    expect(toasts.length).toBeLessThanOrEqual(5)
  })

  it('should throw when useToast used outside provider', () => {
    expect(() => render(<TestComponent />)).toThrow()
  })
})
