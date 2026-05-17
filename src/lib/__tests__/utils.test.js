import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateReadingTime,
  generateSlug,
  formatDate,
  truncate,
  cn,
  formatNumber,
  getErrorMessage,
  getFullImageUrl,
} from '../utils'

describe('calculateReadingTime', () => {
  it('should return 1 for empty content', () => {
    expect(calculateReadingTime('')).toBe(1)
  })

  it('should return 1 for null/undefined content', () => {
    expect(calculateReadingTime(null)).toBe(1)
    expect(calculateReadingTime(undefined)).toBe(1)
  })

  it('should return 1 for very short content', () => {
    expect(calculateReadingTime('<p>Hello</p>')).toBe(1)
  })

  it('should calculate reading time based on 200 wpm', () => {
    const words = Array(400).fill('word').join(' ')
    const html = '<p>' + words + '</p>'
    expect(calculateReadingTime(html)).toBe(2)
  })

  it('should strip HTML tags before counting', () => {
    const content = '<h1>Title</h1><p>paragraph one two three four five</p>'
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('should handle content with exactly 200 words', () => {
    const words = Array(200).fill('word').join(' ')
    expect(calculateReadingTime(words)).toBe(1)
  })

  it('should handle content with 201 words (ceil to 2)', () => {
    const words = Array(201).fill('word').join(' ')
    expect(calculateReadingTime(words)).toBe(2)
  })
})

describe('generateSlug', () => {
  it('should return empty string for null/undefined title', () => {
    expect(generateSlug(null)).toBe('')
    expect(generateSlug(undefined)).toBe('')
    expect(generateSlug('')).toBe('')
  })

  it('should convert English title to slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('should handle special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world')
  })

  it('should convert Arabic characters to Latin equivalents', () => {
    const result = generateSlug('مرحبا بالعالم')
    expect(result).toBeTruthy()
    expect(result.includes('mr')).toBe(true)
    expect(result.includes('b')).toBe(true)
    expect(result.includes('a')).toBe(true)
    expect(result.includes('l')).toBe(true)
    expect(result.includes('m')).toBe(true)
  })

  it('should collapse multiple dashes', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world')
    expect(generateSlug('Hello---World')).toBe('hello-world')
  })

  it('should truncate slug to 80 characters', () => {
    const long = 'a'.repeat(100)
    const slug = generateSlug(long)
    expect(slug.length).toBeLessThanOrEqual(80)
  })

  it('should generate fallback slug with timestamp when result is empty', () => {
    const dateNow = Date.now()
    vi.setSystemTime(dateNow)
    const result = generateSlug('!!!')
    expect(result).toBe('post-' + dateNow)
    vi.useRealTimers()
  })

  it('should handle untransliterated Arabic characters', () => {
    const result = generateSlug('پ') // Persian pe, in Arabic range but not in map
    expect(result).toMatch(/^post-\d+$/)
  })
})

describe('formatDate', () => {
  it('should return empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('should format date', () => {
    const result = formatDate('2024-01-15')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should handle invalid dates gracefully', () => {
    const result = formatDate('not-a-date')
    expect(result).toBe('not-a-date')
  })
})

describe('truncate', () => {
  it('should return empty string for null/undefined', () => {
    expect(truncate(null)).toBe('')
    expect(truncate(undefined)).toBe('')
    expect(truncate('')).toBe('')
  })

  it('should return text as-is if shorter than maxLength', () => {
    expect(truncate('short text', 150)).toBe('short text')
  })

  it('should truncate and add ellipsis for longer text', () => {
    const long = 'a'.repeat(200)
    const result = truncate(long, 150)
    expect(result.length).toBe(153)
    expect(result.endsWith('...')).toBe(true)
  })

  it('should strip HTML tags before truncation', () => {
    const html = '<p>' + 'a'.repeat(200) + '</p>'
    const result = truncate(html, 150)
    expect(result.endsWith('...')).toBe(true)
    expect(result).not.toContain('<p>')
  })

  it('should use default maxLength of 150', () => {
    const text = 'a'.repeat(151)
    expect(truncate(text)).toBe('a'.repeat(150) + '...')
  })
})

describe('cn', () => {
  it('should join class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('should filter out falsy values', () => {
    expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b')
  })

  it('should return empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('should handle single class', () => {
    expect(cn('only')).toBe('only')
  })
})

describe('formatNumber', () => {
  it('should return "0" for null/undefined', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })

  it('should format number', () => {
    const result = formatNumber(1000)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBeTruthy()
  })

  it('should handle negative numbers', () => {
    const result = formatNumber(-100)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('getErrorMessage', () => {
  it('should return fallback message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = getErrorMessage(new Error('test'))
    expect(result).toBe('حدث خطأ ما، يرجى المحاولة مجدداً')
    consoleSpy.mockRestore()
  })

  it('should log the error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('test error')
    getErrorMessage(err)
    expect(consoleSpy).toHaveBeenCalledWith('[Midad Error]', err)
    consoleSpy.mockRestore()
  })

  it('should use custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = getErrorMessage(new Error('test'), 'Custom message')
    expect(result).toBe('Custom message')
    consoleSpy.mockRestore()
  })
})

describe('getFullImageUrl', () => {
  it('should return null for empty url', () => {
    expect(getFullImageUrl(null)).toBe(null)
    expect(getFullImageUrl('')).toBe(null)
    expect(getFullImageUrl(undefined)).toBe(null)
  })

  it('should return url as-is if it already starts with http', () => {
    expect(getFullImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
  })

  it('should construct storage URL for post-covers bucket', () => {
    const result = getFullImageUrl('post-covers/image.jpg')
    expect(result).toContain('storage/v1/object/public/post-covers/image.jpg')
  })

  it('should construct storage URL for logos bucket', () => {
    const result = getFullImageUrl('logos/logo.png')
    expect(result).toContain('storage/v1/object/public/logos/logo.png')
  })

  it('should default to post-covers bucket for unknown paths', () => {
    const result = getFullImageUrl('random/image.jpg')
    expect(result).toContain('storage/v1/object/public/post-covers/random/image.jpg')
  })
})
