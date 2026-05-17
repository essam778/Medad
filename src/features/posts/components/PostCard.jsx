import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Sparkles, Eye, MessageSquare, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'
import OptimizedImage from '@/components/shared/OptimizedImage'

export function PostCard({ post, isFirst = false }) {
  return (
    <article className="group bg-card border border-border p-4 rounded-[3rem] transition-all hover:shadow-2xl hover:shadow-ink/5 hover:-translate-y-1">
      <Link to={`/post/${post.slug}`} aria-label={`اقرأ مقال: ${post.title}`}>
        <div className="aspect-[16/10] bg-subtle rounded-[2rem] overflow-hidden mb-6 shadow-sm transition-all duration-700">
          {post.cover_image_url ? (
            <OptimizedImage 
              src={post.cover_image_url} 
              alt={post.title} 
              width={400} 
              height={250} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              fetchpriority={isFirst ? "high" : "auto"}
              loading={isFirst ? "eager" : "lazy"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Sparkles size={48} />
            </div>
          )}
        </div>
        <div className="px-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black text-gold-dark bg-gold-light/10 border border-gold/20 px-4 py-1.5 rounded-full uppercase tracking-widest">
              {post.tags?.[0] || 'عام'}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 opacity-80">
              <Clock size={12} /> {formatDate(post.published_at)}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black mb-4 leading-tight group-hover:text-gold transition-colors line-clamp-2 italic text-primary">
            {post.title}
          </h3>
          
          <div className="flex items-center gap-4 mb-4 text-white/70 text-xs font-black">
             <span className="flex items-center gap-1.5"><Eye size={12} /> {post.views || 0}</span>
             <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {post.comments_count || 0}</span>
             <span className="flex items-center gap-1.5"><Heart size={12} /> {post.reactions_count || 0}</span>
          </div>

          <Link 
            to={`/u/${post.profiles?.id}`} 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 pt-4 border-t border-border hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-ink text-paper flex items-center justify-center text-sm font-black shadow-sm overflow-hidden border border-border">
              {post.profiles?.avatar_url ? (
                <OptimizedImage 
                  src={post.profiles.avatar_url} 
                  alt={post.profiles.full_name} 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover" 
                />
              ) : post.profiles?.full_name?.[0]}
            </div>
            <div>
              <p className="text-xs font-black text-primary">{post.profiles?.full_name}</p>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-0.5">
                كاتب متميز في مداد
              </p>
            </div>
          </Link>
        </div>
      </Link>
    </article>
  )
}
