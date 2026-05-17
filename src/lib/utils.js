// =============================================
// حساب وقت القراءة من محتوى HTML
// المعدل الافتراضي: 200 كلمة/دقيقة
// =============================================
export function calculateReadingTime(htmlContent) {
  if (!htmlContent) return 1
  const text = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const wordCount = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

// =============================================
// توليد slug من العنوان (يدعم العربية)
// =============================================
export function generateSlug(title) {
  if (!title) return ''
  // للعربية: نحوّل إلى أحرف ASCII مع الترقيم
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]/g, (char) => {
      const map = {
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
        'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's',
        'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
        'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
        'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y', 'ة': 'a', 'ى': 'a',
        'أ': 'a', 'إ': 'i', 'آ': 'a', 'ئ': 'y', 'ؤ': 'w',
      }
      return map[char] || char
    })
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
  return slug || `post-${Date.now()}`
}

// =============================================
// تنسيق التاريخ بالعربية
// =============================================
export function formatDate(dateStr, locale = 'ar-EG') {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

// =============================================
// اختصار النص
// =============================================
export function truncate(text, maxLength = 150) {
  if (!text) return ''
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return stripped.length > maxLength
    ? stripped.slice(0, maxLength).trim() + '...'
    : stripped
}

// =============================================
// دمج class names (بسيط بدون مكتبة)
// =============================================
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// =============================================
// تنسيق الأرقام للعرب
// =============================================
export function formatNumber(num) {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('ar-EG')
}

// =============================================
// استخراج رسالة الخطأ المناسبة
// =============================================
export function getErrorMessage(err, fallback = 'حدث خطأ ما، يرجى المحاولة مجدداً') {
  console.error('[Midad Error]', err)
  return fallback
}
// =============================================
// بناء رابط الصورة الكامل من Supabase Storage
// =============================================
export function getFullImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_SUPABASE_URL
  if (url.includes('post-covers') || url.includes('logos')) {
    return `${base}/storage/v1/object/public/${url}`
  }
  return `${base}/storage/v1/object/public/post-covers/${url}`
}