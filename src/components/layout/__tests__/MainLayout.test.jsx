import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../Header', () => ({ default: () => <header data-testid="header">Header</header> }))
vi.mock('../Footer', () => ({ default: () => <footer data-testid="footer">Footer</footer> }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, Outlet: () => <main data-testid="outlet">Outlet</main> }
})

import MainLayout from '../MainLayout'

describe('MainLayout', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders header, outlet, and footer', () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>)
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders header before main content', () => {
    render(<MemoryRouter><MainLayout /></MemoryRouter>)
    const header = screen.getByTestId('header')
    const outlet = screen.getByTestId('outlet')
    const footer = screen.getByTestId('footer')
    expect(header.compareDocumentPosition(outlet)).toBe(4)
    expect(outlet.compareDocumentPosition(footer)).toBe(4)
  })
})
