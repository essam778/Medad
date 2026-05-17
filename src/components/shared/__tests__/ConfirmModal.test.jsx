import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from '../ConfirmModal'

describe('ConfirmModal', () => {
  it('should not render when open is false', () => {
    const { container } = render(
      <ConfirmModal open={false} title="Test" message="Test msg" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render title and message', () => {
    render(
      <ConfirmModal open={true} title="حذف المقال" message="هل أنت متأكد؟" onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText('حذف المقال')).toBeInTheDocument()
    expect(screen.getByText('هل أنت متأكد؟')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmModal open={true} title="Test" message="Test msg" onConfirm={onConfirm} onCancel={vi.fn()} />
    )
    const confirmBtn = screen.getByText('تأكيد')
    fireEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmModal open={true} title="Test" message="Test msg" onConfirm={vi.fn()} onCancel={onCancel} />
    )
    const cancelBtn = screen.getByText('إلغاء')
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalled()
  })

  it('should use custom button labels', () => {
    render(
      <ConfirmModal
        open={true}
        title="Test"
        message="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="نعم"
        cancelLabel="لا"
      />
    )
    expect(screen.getByText('نعم')).toBeInTheDocument()
    expect(screen.getByText('لا')).toBeInTheDocument()
  })

  it('should render with different variants', () => {
    const { rerender } = render(
      <ConfirmModal open={true} title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} variant="danger" />
    )
    expect(screen.getByText('تأكيد')).toBeInTheDocument()

    rerender(
      <ConfirmModal open={true} title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} variant="warning" />
    )
    expect(screen.getByText('تأكيد')).toBeInTheDocument()

    rerender(
      <ConfirmModal open={true} title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} variant="info" />
    )
    expect(screen.getByText('تأكيد')).toBeInTheDocument()
  })

  it('should fallback to info for unknown variant', () => {
    render(
      <ConfirmModal open={true} title="Test" message="Test" onConfirm={vi.fn()} onCancel={vi.fn()} variant="unknown" />
    )
    expect(screen.getByText('تأكيد')).toBeInTheDocument()
  })
})
