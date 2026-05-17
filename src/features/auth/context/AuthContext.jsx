import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { AuthService } from '../services/auth.service'
import { ProfileService } from '../services/profile.service'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // دالة جلب البروفايل - باستخدام Service Layer
  const fetchProfileData = useCallback(async (userId, currentUser) => {
    if (!userId) return null
    try {
      const { data, error } = await ProfileService.getProfile(userId)
      
      if (error) {
        console.error('خطأ في جلب البروفايل:', error)
        return null
      }
      
      if (!data) {
        return await ProfileService.createProfile({
          id: userId,
          email: currentUser?.email,
          role: 'reader'
        })
      }
      return data
    } catch (err) {
      console.error('Unexpected error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let initTimeoutId

    async function handleAuthStateChange(event, session) {
      if (!isMounted) return
      
      
      const nextUser = session?.user || null
      
      // Prevent redundant fetches if user ID is the same
      if (nextUser?.id === user?.id && profile) {
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
        return
      }

      if (nextUser) {
        setUser(nextUser)
        const p = await fetchProfileData(nextUser.id, nextUser)
        if (isMounted) setProfile(p)
      } else {
        setUser(null)
        setProfile(null)
      }
      
      if (isMounted) {
        setLoading(false)
        setInitialized(true)
      }
    }

    initTimeoutId = setTimeout(() => {
      if (!isMounted) return
      setLoading(false)
      setInitialized(true)
    }, 8000)

    ;(async () => {
      try {
        const { data: { session } } = await AuthService.getSession()
        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (err) {
        console.error('تعذر استعادة الجلسة:', err)
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          setInitialized(true)
        }
      } finally {
        clearTimeout(initTimeoutId)
      }
    })()

    const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') {
        handleAuthStateChange(event, session)
      }
    })

    return () => {
      isMounted = false
      clearTimeout(initTimeoutId)
      subscription.unsubscribe()
  }, [fetchProfileData])

  // الاشتراك في التحديثات الفورية للبروفايل (Real-time Profile updates)
  useEffect(() => {
    if (!user?.id) return

    const profileChannel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Realtime profile update received:', payload.new)
          setProfile(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profileChannel)
    }
  }, [user?.id])

  const signIn = useCallback((email, password) => AuthService.signIn(email, password), [])
  const signUp = useCallback((email, password, fullName, role) => AuthService.signUp(email, password, fullName, role), [])
  const signInWithGoogle = useCallback(() => AuthService.signInWithGoogle(), [])
  const signOut = useCallback(() => AuthService.signOut(), [])

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return { error: new Error('No user logged in') }
    const { error } = await ProfileService.updateProfile(user.id, updates)
    if (!error) {
      setProfile(prev => ({ ...prev, ...updates }))
    }
    return { error }
  }, [user?.id])

  const refreshProfile = useCallback(() => {
    if (user) fetchProfileData(user.id, user).then(p => setProfile(p))
  }, [user, fetchProfileData])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    initialized,
    isAdmin: profile?.role === 'admin',
    isAuthor: profile?.role === 'author' || profile?.role === 'admin',
    isBanned: profile?.is_banned === true,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  }), [user, profile, loading, initialized, signIn, signInWithGoogle, signOut, updateProfile, refreshProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
