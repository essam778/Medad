import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { Users, Search, MapPin, Star, ArrowRight, Zap, Globe, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import OptimizedImage from '../../components/shared/OptimizedImage'

export default function WritersList() {
  const [searchTerm, setSearchTerm] = useState('')

  // DEFINITIVE FIX: 'bio' is in profiles table, not site_settings.
  const { data: writers = [], isLoading } = useQuery({
    queryKey: ['writers'],
    queryFn: async () => {
      // 1. Fetch site settings (only existing columns)
      const { data: channels, error: channelsError } = await supabase
        .from('site_settings')
        .select('id, site_name, channel_slug, logo_url, author_id')
      
      if (channelsError) throw channelsError
      if (!channels || channels.length === 0) return []

      // 2. Fetch profiles including 'bio'
      const authorIds = channels.map(c => c.author_id).filter(Boolean)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .in('id', authorIds)
      
      if (profilesError) throw profilesError

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})

      return channels.map(channel => ({
        ...channel,
        profiles: profileMap[channel.author_id] || { full_name: 'مبدع مداد', avatar_url: null, bio: '' }
      }))
    }
  })

  const filteredWriters = writers.filter(w => 
    w.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-12 pb-24 font-arabic" dir="rtl">
      <div className="container mx-auto px-4 md:px-8">
        
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black mb-6 italic tracking-tight"
          >
            اكتشف <span className="text-purple-500">نخبة المبدعين</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-bold"
          >
            استكشف القنوات والمبدعين الذين يثرون المحتوى العربي بأفكارهم وقصصهم الفريدة.
          </motion.p>
        </div>

        <div className="max-w-2xl mx-auto mb-20">
          <div className="relative group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-500 transition-transform group-focus-within:scale-110" />
            <input 
              type="text" 
              placeholder="ابحث عن قناة أو مبدع..."
              aria-label="ابحث عن قناة أو مبدع"
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pr-16 pl-8 text-xl font-bold outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all shadow-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-white/5 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWriters.map((writer, idx) => (
              <motion.div
                key={writer.id || idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={`/c/${writer.channel_slug}`}
                  className="group relative block bg-[#0d0d0d]/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 hover:border-purple-500/30 transition-all shadow-2xl overflow-hidden"
                >
                  <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 border-2 border-purple-500/10 mb-6 group-hover:border-purple-500 transition-all shadow-xl">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#050505] bg-[#050505]">
                        <OptimizedImage 
                          src={writer.logo_url} 
                          alt={writer.site_name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                          fallback="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2000&auto=format&fit=crop"
                        />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-black mb-2 group-hover:text-purple-400 transition-colors">{writer.site_name}</h2>
                    <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-6">بواسطة {writer.profiles?.full_name}</p>
                    
                    <p className="text-white/80 text-sm font-bold leading-relaxed line-clamp-3 mb-8">
                      {writer.profiles?.bio || 'لا يوجد وصف متاح لهذه القناة حالياً.'}
                    </p>

                    <div className="w-full pt-8 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4 text-white/60 text-xs font-black">
                          <span className="flex items-center gap-1"><Zap size={14} className="text-purple-400" /> متميز</span>
                       </div>
                       <span className="flex items-center gap-2 text-purple-400 font-black text-sm group-hover:gap-4 transition-all">
                         زيارة القناة <ArrowRight size={16} />
                       </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {filteredWriters.length === 0 && !isLoading && (
          <div className="text-center py-40">
            <Users size={64} className="mx-auto text-white/10 mb-6" />
            <h3 className="text-2xl font-black text-white/20">لم نجد أي قنوات تطابق بحثك...</h3>
          </div>
        )}
      </div>
    </main>
  )
}
