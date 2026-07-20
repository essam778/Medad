import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './features/auth/context/AuthContext'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import React, { useEffect, lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { queryClient } from '@/lib/queryClient'
import LoadingSpinner from './components/shared/LoadingSpinner'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ToastProvider } from './components/shared/ToastProvider'

// Layouts
import MainLayout from './components/layout/MainLayout'
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'))
const PostPage = lazy(() => import('./pages/public/PostPage'))
const WritersList = lazy(() => import('./pages/public/WritersList'))
const CategoriesPage = lazy(() => import('./pages/public/CategoriesPage'))
const AuthorPage = lazy(() => import('./pages/public/AuthorPage'))
const LoginPage = lazy(() => import('./pages/public/LoginPage'))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'))
const StaticPage = lazy(() => import('./pages/public/StaticPage'))
const PublicProfile = lazy(() => import('./pages/public/PublicProfile'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const FAQPage = lazy(() => import('./pages/public/FAQPage'))

// Admin & Creator Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'))
const AdminAllPosts = lazy(() => import('./pages/admin/AdminAllPosts'))
const AdminTags = lazy(() => import('./pages/admin/AdminTags'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminInviteCodes = lazy(() => import('./pages/admin/AdminInviteCodes'))
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'))
const AdminCreatorRequests = lazy(() => import('./pages/admin/AdminCreatorRequests'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor'))
const AdminGroups = lazy(() => import('./pages/admin/AdminGroups'))
const AdminChannels = lazy(() => import('./pages/admin/AdminChannels'))
const AdminComments = lazy(() => import('./pages/admin/AdminComments'))

// Unified Dashboard Pages
const SavedPosts = lazy(() => import('./pages/dashboard/SavedPosts'))
const UserProfile = lazy(() => import('./pages/dashboard/UserProfile'))

function AuthCallback() {
  const navigate = useNavigate()
  const { user, initialized } = useAuth()

  useEffect(() => {
    if (initialized && user) {
      navigate('/studio', { replace: true })
    } else if (initialized && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, initialized, navigate])

  return <LoadingSpinner fullPage />
}

export default function App() {
  const appFallback = (
    <div className="min-h-screen flex items-center justify-center bg-page dark:bg-[#0a0a0a]">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider>
            <AuthProvider>
              <ErrorBoundary>
                <Suspense fallback={appFallback}>
                  <Routes>
                  {/* Public Routes with MainLayout */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="posts" element={<HomePage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="tag/:tag" element={<HomePage />} />
                    <Route path="post/:slug" element={<PostPage />} />
                    <Route path="writers" element={<WritersList />} />
                    <Route path="c/:slug" element={<AuthorPage />} />
                    <Route path="@:slug" element={<AuthorPage />} />
                    <Route path="p/:slug" element={<StaticPage />} />
                    <Route path="about" element={<StaticPage slug="about" />} />
                    <Route path="privacy" element={<StaticPage slug="privacy" />} />
                    <Route path="terms" element={<StaticPage slug="terms" />} />
                    <Route path="faq" element={<FAQPage />} />
                    <Route path="cookies" element={<StaticPage slug="cookies" />} />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="u/:id" element={<PublicProfile />} />
                  </Route>

                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

                  {/* Unified Studio */}
                  <Route path="/studio" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="posts" element={<ProtectedRoute allowAuthor requireAdmin><AdminPosts /></ProtectedRoute>} />
                    <Route path="all-posts" element={<ProtectedRoute requireAdmin><AdminAllPosts /></ProtectedRoute>} />
                    <Route path="posts/new" element={<ProtectedRoute allowAuthor requireAdmin><PostEditor /></ProtectedRoute>} />
                    <Route path="posts/edit/:id" element={<ProtectedRoute allowAuthor requireAdmin><PostEditor /></ProtectedRoute>} />
                    <Route path="groups" element={<ProtectedRoute allowAuthor requireAdmin><AdminGroups /></ProtectedRoute>} />
                    <Route path="channels" element={<ProtectedRoute allowAuthor requireAdmin><AdminChannels /></ProtectedRoute>} />
                    <Route path="comments" element={<ProtectedRoute allowAuthor requireAdmin><AdminComments /></ProtectedRoute>} />
                    <Route path="tags" element={<ProtectedRoute allowAuthor requireAdmin><AdminTags /></ProtectedRoute>} />
                    <Route path="site-settings" element={<ProtectedRoute allowAuthor requireAdmin><AdminSiteSettings /></ProtectedRoute>} />
                    <Route path="saved" element={<SavedPosts />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                    <Route path="requests" element={<ProtectedRoute requireAdmin><AdminCreatorRequests /></ProtectedRoute>} />
                    <Route path="invite-codes" element={<ProtectedRoute requireAdmin><AdminInviteCodes /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
                    <Route path="notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
                  </Route>

                  <Route path="/admin/*" element={<Navigate to="/studio" replace />} />
                  <Route path="/dashboard/*" element={<Navigate to="/studio" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              </ErrorBoundary>
            </AuthProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </ToastProvider>
      {window.location.hostname !== 'localhost' && (
        <>
          <SpeedInsights />
          <Analytics />
        </>
      )}
    </ThemeProvider>
  )
}
