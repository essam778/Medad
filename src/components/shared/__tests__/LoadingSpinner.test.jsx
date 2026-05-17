import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSpinner, { PageLoader } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('should render with default size (md)', () => {
    const { container } = render(<LoadingSpinner />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render with sm size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
    expect(spinner.className).toContain('w-4')
    expect(spinner.className).toContain('h-4')
  })

  it('should render with lg size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner.className).toContain('w-12')
    expect(spinner.className).toContain('h-12')
  })

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="my-custom-class" />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('my-custom-class')
  })
})

describe('PageLoader', () => {
  it('should render with lg spinner', () => {
    const { container } = render(<PageLoader />)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner.className).toContain('w-12')
    expect(spinner.className).toContain('h-12')
  })

  it('should take full min-height screen', () => {
    const { container } = render(<PageLoader />)
    const wrapper = container.firstChild
    expect(wrapper.className).toContain('min-h-screen')
  })
})
