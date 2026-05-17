import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Github, Linkedin, ExternalLink } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import Newsletter from '../shared/Newsletter'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const { data: settings } = useSettings()

  const socialLinks = [
    { icon: Twitter, href: settings?.social_links?.twitter || 'https://twitter.com', label: 'تويتر مداد' },
    { icon: Facebook, href: settings?.social_links?.facebook || 'https://facebook.com', label: 'فيسبوك مداد' },
    { icon: Instagram, href: settings?.social_links?.instagram || 'https://instagram.com', label: 'إنستغرام مداد' },
    { icon: Github, href: settings?.social_links?.github || 'https://github.com', label: 'جيت هاب مداد' },
    { icon: Linkedin, href: settings?.social_links?.linkedin || 'https://linkedin.com', label: 'لينكد إن مداد' }
  ].filter(link => link.href && link.href !== 'https://' && link.href.length > 15)

  const footerLinks = [
    {
      title: 'المنصة',
      links: [
        { name: 'عن مداد', href: '/about' },
        { name: 'انضم إلينا', href: '/register' },
        { name: 'قائمة الكتاب', href: '/writers' },
        { name: 'الأسئلة الشائعة', href: '/faq' }
      ]
    },
    {
      title: 'قانوني',
      links: [
        { name: 'سياسة الخصوصية', href: '/privacy' },
        { name: 'شروط الاستخدام', href: '/terms' },
        { name: 'تواصل معنا', href: '/contact' }
      ]
    }
  ]

  return (
    <footer className="bg-black text-white pt-20 md:pt-32 pb-14 md:pb-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-24">
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" aria-label="الذهاب للرئيسية" className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-4 group">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center text-2xl italic shadow-2xl transition-transform group-hover:scale-110">م</div>
              مداد
            </Link>
            <p className="text-white/70 text-lg md:text-xl font-bold leading-relaxed max-w-md italic">
              المساحة العربية الأرقى لمشاركة الأفكار والقصص. بنيت من أجل المبدعين والقراء الذين يقدرون قيمة المحتوى الأصيل.
            </p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social, i) => (
                <a 
                  key={i}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group, i) => (
            <div key={i} className="space-y-5 md:space-y-8">
              <h3 className="text-[10px] font-black text-white/80 uppercase tracking-[0.5em]">{group.title}</h3>
              <ul className="space-y-4">
                {group.links.map((link, j) => (
                  <li key={j}>
                    <Link to={link.href} className="text-white/70 hover:text-white font-bold transition-colors flex items-center gap-2 group">
                      {link.name}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
 
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">جميع الحقوق محفوظة © {currentYear} مداد</p>
            <div className="flex items-center gap-3 text-[10px] font-black text-white/80 uppercase tracking-widest">
              <span>صنع بشغف في الوطن العربي</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span>الإصدار 1.0.0</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">Midad Creative Platform</p>
        </div>
      </div>

      {/* Decorative background elements (desktop only to avoid mobile rendering artifacts) */}
      <div className="hidden md:block absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
    </footer>
  )
}
