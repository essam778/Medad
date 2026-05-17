import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PageLoader } from '../../components/shared/LoadingSpinner'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // انتظر قليلاً للتأكد من حفظ الجلسة قبل التوجيه
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 100)
      } else {
        navigate('/login', { replace: true })
      }
    }).catch(() => {
      navigate('/login', { replace: true })
    })
  }, [navigate])

  return <PageLoader />
}
