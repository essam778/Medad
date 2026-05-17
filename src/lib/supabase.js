import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// إنشاء عميل Supabase مع إعدادات خاصة للتخزين
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  }
})

// دالة مساعدة لإعادة تهيئة الجلسة بالقوة
export async function forceRefreshSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Force refresh session error:', error)
    return null
  }
  
  // إذا كانت الجلسة موجودة ولكن منتهية، قم بتحديثها
  if (session && session.expires_at && Date.now() / 1000 > session.expires_at) {
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      console.error('Token refresh error:', refreshError)
      return null
    }
    return newSession
  }
  return session
}

// دالة للتحقق من صحة الجلسة وجلب البروفايل مع إعادة المحاولة
export async function getProfileWithRetry(userId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // تأخير تدريجي بين المحاولات
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100 * i))
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error(`محاولة ${i + 1} فشلت:`, error)
        continue
      }
      
      if (data) {
        return data
      }
      
      // إذا لم يوجد بروفايل، قم بإنشائه
      const { data: inserted } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'reader',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      return inserted
      
    } catch (err) {
      console.error(`محاولة ${i + 1} استثناء:`, err)
    }
  }
  return null
}

// =============================================
// رفع صورة إلى Supabase Storage مع قيود أمان صارمة
// =============================================
export async function uploadImage(file, bucket = 'covers') {
  if (!file) throw new Error('لم يتم اختيار ملف')
  if (typeof file?.name !== 'string') throw new Error('الملف المختار غير صالح')

  // قيود الأحجام بناءً على نوع الوعاء (Operational Safety)
  const isAvatar = bucket === 'profiles' || bucket === 'logos'
  const maxSize = isAvatar ? 1 * 1024 * 1024 : 2 * 1024 * 1024 // 1MB للصور الشخصية، 2MB للغلاف
  
  if (file.size > maxSize) {
    throw new Error(`حجم الملف كبير جداً. الحد الأقصى هو ${isAvatar ? '1MB' : '2MB'}`)
  }
  
  if (!file.type?.startsWith('image/')) {
    throw new Error('يسمح فقط برفع ملفات الصور (PNG, JPG, WebP)')
  }

  // تنظيف اسم الملف (Sanitization) وتوليد اسم فريد
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const timestamp = new Date().getTime()
  const fileName = `${timestamp}-${safeName}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { 
      cacheControl: '3600', 
      upsert: false,
      contentType: file.type // تحديد نوع المحتوى بدقة
    })

  if (error) {
    throw new Error(error.message || 'تعذر رفع الصورة')
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  if (!publicUrl) throw new Error('تعذر الحصول على رابط الصورة بعد الرفع')
  return publicUrl
}

// =============================================
// تسجيل مشاهدة مقال
// =============================================
export async function recordPostView(postId, userId = null) {
  const key = `viewed_${postId}`
  if (sessionStorage.getItem(key)) return

  try {
    await supabase.from('post_views').insert({
      post_id: postId,
      user_id: userId || null,
    })
    sessionStorage.setItem(key, '1')
  } catch {
    // تجاهل الأخطاء
  }
}
