import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabase'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

export default function TagsPage() {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const maxCount = Math.max(...tags.map(t => t.usage_count || 1), 1)

  return (
    <>
      <Helmet><title>التصنيفات</title></Helmet>
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">التصنيفات</h1>
        <p className="text-gray-500 mb-10">تصفح المقالات حسب الموضوع</p>

        {isLoading ? (
          <LoadingSpinner className="py-16" />
        ) : tags.length === 0 ? (
          <p className="text-gray-400 text-center py-12">لا توجد تصنيفات بعد</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => {
              // حجم الخط بناءً على الاستخدام (سحابة التصنيفات)
              const ratio = (tag.usage_count || 1) / maxCount
              const size = 12 + Math.round(ratio * 16) // من 12px إلى 28px
              return (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.name}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-black hover:text-white rounded-full transition-all duration-200 group"
                  style={{ fontSize: `${size}px` }}
                >
                  <span>{tag.name}</span>
                  <span className="text-gray-400 group-hover:text-gray-200 text-xs">
                    ({tag.usage_count || 0})
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
