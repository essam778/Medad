import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NoticeModal from '../NoticeModal'

describe('NoticeModal', () => {
  it('should not render when open is false', () => {
    const { container } = render(
      <NoticeModal open={false} title="Test" message="Test msg" onClose={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render title and message', () => {
    render(
      <NoticeModal open={true} title="تم بنجاح" message="تم حفظ التغييرات" onClose={vi.fn()} />
    )
    expect(screen.getByText('تم بنجاح')).toBeInTheDocument()
    expect(screen.getByText('تم حفظ التغييرات')).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <NoticeModal open={true} title="Test" message="Test msg" onClose={onClose} />
    )
    const closeBtn = screen.getByText('فهمت')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('should show action and cancel buttons when onAction provided', () => {
    const onAction = vi.fn()
    render(
      <NoticeModal open={true} title="Test" message="Test msg" onClose={vi.fn()} onAction={onAction} />
    )
    expect(screen.getByText('تأكيد العملية')).toBeInTheDocument()
    expect(screen.getByText('تراجع')).toBeInTheDocument()
  })

  it('should call onAction and onClose on action click', () => {
    const onAction = vi.fn()
    const onClose = vi.fn()
    render(
      <NoticeModal open={true} title="Test" message="Test msg" onClose={onClose} onAction={onAction} />
    )
    fireEvent.click(screen.getByText('تأكيد العملية'))
    expect(onAction).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('should render with different variants', () => {
    const { rerender } = render(
      <NoticeModal open={true} title="Test" message="Test" onClose={vi.fn()} variant="success" />
    )
    expect(screen.getByText('فهمت')).toBeInTheDocument()

    rerender(
      <NoticeModal open={true} title="Test" message="Test" onClose={vi.fn()} variant="warning" />
    )
    expect(screen.getByText('فهمت')).toBeInTheDocument()

    rerender(
      <NoticeModal open={true} title="Test" message="Test" onClose={vi.fn()} variant="info" />
    )
    expect(screen.getByText('فهمت')).toBeInTheDocument()
  })
})
