import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../../../components/shared/LoadingSpinner'

/**
 * ProtectedRoute — يحمي الـ routes من الوصول غير المصرح
 *
 * Props:
 *  - children      : المكون المراد حمايته
 *  - requireAdmin  : يشترط أن يكون المستخدم admin
 *  - allowAuthor   : يسمح لـ author في حالة requireAdmin
 *  - redirectTo    : المسار عند عدم وجود صلاحية (افتراضي: /login أو /)
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allowAuthor = false,
  requiredRole, // 'admin', 'author', etc.
  redirectTo,
}) {
  const { user, profile, loading, initialized } = useAuth()

  if (loading || !initialized) return <LoadingSpinner fullPage />

  if (!user) return <Navigate to={redirectTo || '/login'} replace />

  const isAdmin = profile?.role === 'admin'
  const isAuthor = profile?.role === 'author'
  const userRole = profile?.role

  // If specific role required
  if (requiredRole && userRole !== requiredRole && !isAdmin) {
    return <Navigate to={redirectTo || '/'} replace />
  }

  if (requireAdmin && !isAdmin) {
    if (allowAuthor && isAuthor) return children
    return <Navigate to={redirectTo || '/'} replace />
  }

  return children
}
