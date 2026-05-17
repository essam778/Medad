import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

function TestComponent() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button data-testid="toggle-dark" onClick={() => toggleTheme('dark')}>Dark</button>
      <button data-testid="toggle-light" onClick={() => toggleTheme('light')}>Light</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    window.localStorage.clear()
  })

  it('should default to light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('should toggle theme and update DOM', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByTestId('toggle-dark'))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove previous theme classes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByTestId('toggle-dark'))
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should throw when useTheme used outside provider', () => {
    expect(() => render(<TestComponent />)).toThrow()
  })
})
