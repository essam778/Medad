import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CardSkeleton, ListItemSkeleton } from '../Skeletons'

describe('CardSkeleton', () => {
  it('should render with default className', () => {
    const { container } = render(<CardSkeleton />)
    const el = container.firstChild
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('rounded-3xl')
    expect(el.className).toContain('bg-gray-100')
  })

  it('should apply custom className', () => {
    const { container } = render(<CardSkeleton className="custom-class" />)
    const el = container.firstChild
    expect(el.className).toContain('custom-class')
  })
})

describe('ListItemSkeleton', () => {
  it('should render with three placeholder bars', () => {
    const { container } = render(<ListItemSkeleton />)
    const bars = container.querySelectorAll('.h-4, .h-3')
    expect(bars.length).toBe(3)
  })

  it('should have pulse animation', () => {
    const { container } = render(<ListItemSkeleton />)
    const el = container.firstChild
    expect(el.className).toContain('animate-pulse')
  })
})
