import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@auth')
vi.mock('@/components/shared/LoadingSpinner', () => ({
  default: ({ className }) => <div data-testid="loading-spinner" className={className}>Loading</div>,
}))
vi.mock('@/components/shared/ConfirmModal', () => ({
  default: ({ open, title, message, onConfirm, onCancel, confirmLabel, cancelLabel, variant }) =>
    open ? (
      <div data-testid="confirm-modal" data-variant={variant}>
        <h3>{title}</h3>
        <p>{message}</p>
        <button data-testid="confirm-action" onClick={onConfirm}>{confirmLabel}</button>
        <button data-testid="confirm-cancel" onClick={onCancel}>{cancelLabel}</button>
      </div>
    ) : null,
}))

vi.mock('@posts', () => {
  const useMyPosts = vi.fn()
  const useDeletePost = vi.fn()
  return { useMyPosts, useDeletePost }
})

import { useAuth } from '@auth'
import { useMyPosts, useDeletePost } from '@posts'
import MyPosts from '../MyPosts'

const mockPost = (overrides = {}) => ({
  id: 'post-1',
  title: 'Test Article',
  slug: 'test-article',
  status: 'published',
  published_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  tags: ['برمجة', 'تطوير'],
  views: 42,
  reading_time: 5,
  ...overrides,
})

function renderMyPosts() {
  return render(<MemoryRouter><MyPosts /></MemoryRouter>)
}

describe('MyPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { id: 'user-1' }, isAuthor: true, isAdmin: false })
    useMyPosts.mockReturnValue({ data: [], isLoading: false })
    useDeletePost.mockReturnValue({ mutateAsync: vi.fn() })
  })

  describe('Rendering', () => {
    it('renders heading with post count', () => {
      useMyPosts.mockReturnValue({ data: [mockPost()], isLoading: false })
      renderMyPosts()
      expect(screen.getByText(/مقالاتي \(1\)/)).toBeInTheDocument()
    })

    it('renders create new post button for author', () => {
      renderMyPosts()
      const newBtn = screen.getByText('مقال جديد')
      expect(newBtn).toBeInTheDocument()
      expect(newBtn.closest('a').getAttribute('href')).toBe('/studio/posts/new')
    })

    it('renders loading spinner while loading', () => {
      useMyPosts.mockReturnValue({ data: [], isLoading: true })
      renderMyPosts()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Posts list', () => {
    it('renders post title and status', () => {
      useMyPosts.mockReturnValue({ data: [mockPost()], isLoading: false })
      renderMyPosts()
      expect(screen.getByText('Test Article')).toBeInTheDocument()
      expect(screen.getByText('منشور')).toBeInTheDocument()
    })

    it('renders draft status', () => {
      useMyPosts.mockReturnValue({ data: [mockPost({ status: 'draft' })], isLoading: false })
      renderMyPosts()
      expect(screen.getByText('مسودة')).toBeInTheDocument()
    })

    it('renders scheduled status', () => {
      useMyPosts.mockReturnValue({ data: [mockPost({ status: 'scheduled' })], isLoading: false })
      renderMyPosts()
      expect(screen.getByText('مجدول')).toBeInTheDocument()
    })

    it('renders edit link for each post', () => {
      useMyPosts.mockReturnValue({ data: [mockPost()], isLoading: false })
      renderMyPosts()
      const editLinks = screen.getAllByRole('link').filter(l => l.getAttribute('href')?.includes('/studio/posts/edit/'))
      expect(editLinks.length).toBe(1)
    })

    it('renders view link for published posts', () => {
      useMyPosts.mockReturnValue({ data: [mockPost({ status: 'published' })], isLoading: false })
      renderMyPosts()
      const viewLink = screen.getAllByRole('link').find(l => l.getAttribute('href') === '/post/test-article')
      expect(viewLink).toBeTruthy()
    })

    it('does not render view link for draft posts', () => {
      useMyPosts.mockReturnValue({ data: [mockPost({ status: 'draft', slug: 'draft-post' })], isLoading: false })
      renderMyPosts()
      const viewLink = screen.getAllByRole('link').find(l => l.getAttribute('href')?.includes('/post/'))
      expect(viewLink).toBeFalsy()
    })

    it('renders multiple posts', () => {
      const posts = [mockPost({ id: '1', title: 'Post 1' }), mockPost({ id: '2', title: 'Post 2' })]
      useMyPosts.mockReturnValue({ data: posts, isLoading: false })
      renderMyPosts()
      expect(screen.getByText(/مقالاتي \(2\)/)).toBeInTheDocument()
      expect(screen.getByText('Post 1')).toBeInTheDocument()
      expect(screen.getByText('Post 2')).toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    it('shows empty message when no posts', () => {
      renderMyPosts()
      expect(screen.getByText('لم تكتب أي مقال بعد')).toBeInTheDocument()
    })
  })

  describe('Unauthorized access', () => {
    it('shows unauthorized message for readers', () => {
      useAuth.mockReturnValue({ user: { id: 'user-1' }, isAuthor: false, isAdmin: false })
      renderMyPosts()
      expect(screen.getByText('ليس لديك صلاحية الكتابة')).toBeInTheDocument()
    })

    it('hides create button for readers', () => {
      useAuth.mockReturnValue({ user: { id: 'user-1' }, isAuthor: false, isAdmin: false })
      renderMyPosts()
      expect(screen.queryByText('مقال جديد')).not.toBeInTheDocument()
    })
  })

  describe('Delete flow', () => {
    it('opens confirm modal on delete click', () => {
      useMyPosts.mockReturnValue({ data: [mockPost({ title: 'Delete Me' })], isLoading: false })
      renderMyPosts()
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
      fireEvent.click(buttons[0])
      expect(screen.getByText('حذف المقال')).toBeInTheDocument()
      expect(screen.getAllByText(/Delete Me/).length).toBeGreaterThanOrEqual(1)
    })

    it('calls delete mutation on confirm', async () => {
      const mutateAsync = vi.fn()
      useDeletePost.mockReturnValue({ mutateAsync })
      useMyPosts.mockReturnValue({ data: [mockPost({ id: 'post-1', title: 'Delete Me' })], isLoading: false })
      renderMyPosts()
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      fireEvent.click(screen.getByText('حذف الآن'))
      await waitFor(() => {
        expect(mutateAsync).toHaveBeenCalledWith('post-1')
      })
    })
  })
})
