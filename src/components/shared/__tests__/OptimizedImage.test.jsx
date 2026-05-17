import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OptimizedImage from '../OptimizedImage'

describe('OptimizedImage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns null when no src provided', () => {
    const { container } = render(<OptimizedImage src={null} alt="test" />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when src is empty string', () => {
    const { container } = render(<OptimizedImage src="" alt="test" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders img with provided src and alt', () => {
    render(<OptimizedImage src="/image.jpg" alt="Test image" />)
    const img = screen.getByAltText('Test image')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('/image.jpg')
  })

  it('sets width and height attributes', () => {
    render(<OptimizedImage src="/image.jpg" alt="test" width={800} height={600} />)
    const img = screen.getByAltText('test')
    expect(img.getAttribute('width')).toBe('800')
    expect(img.getAttribute('height')).toBe('600')
  })

  it('sets default loading to lazy', () => {
    render(<OptimizedImage src="/image.jpg" alt="test" />)
    const img = screen.getByAltText('test')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('uses eager loading when specified', () => {
    render(<OptimizedImage src="/image.jpg" alt="test" loading="eager" />)
    const img = screen.getByAltText('test')
    expect(img.getAttribute('loading')).toBe('eager')
  })

  it('applies custom className to container', () => {
    const { container } = render(<OptimizedImage src="/image.jpg" alt="test" className="my-custom-class" />)
    const outerDiv = container.firstChild
    expect(outerDiv.className).toContain('my-custom-class')
  })

  it('applies opacity transition on load', () => {
    render(<OptimizedImage src="/image.jpg" alt="test" />)
    const img = screen.getByAltText('test')
    expect(img.className).toContain('opacity-0')
    fireEvent.load(img)
    expect(img.className).toContain('opacity-100')
  })

  it('uses fetchpriority attribute', () => {
    render(<OptimizedImage src="/image.jpg" alt="test" fetchpriority="high" />)
    const img = screen.getByAltText('test')
    expect(img.getAttribute('fetchpriority')).toBe('high')
  })
})
