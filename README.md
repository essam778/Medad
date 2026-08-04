# مداد (Midad) — التوثيق الكامل

> منصة تدوين عربية متكاملة. React 18 + Vite + Supabase + Zustand + Tailwind CSS

---

## فهرس المحتويات

1. [مقدمة](#مقدمة)
2. [نظرة عامة](#نظرة-عامة)
3. [التقنيات المستخدمة](#التقنيات-المستخدمة)
4. [هيكل المشروع](#هيكل-المشروع)
5. [قاعدة البيانات (Schema)](#قاعدة-database)
6. [المصادقة والصلاحيات (Auth & RLS)](#المصادقة-والصلاحيات)
7. [كل صفحة بالمشروع ووظيفتها](#كل-صفحة-بالمشروع-ووظيفتها)
8. [كل API endpoint وكيف يشتغل](#api-endpoints)
9. [المشاكل اللي واجهتنا وازاي حاربناها](#المشاكل-و-الحلول)
10. [أسئلة تقنية وأجوبتها (Tech Q&A)](#أسئلة-تقنية)
11. [قرارات معمارية (Architecture Decisions)](#قرارات-معمارية)

---

## مقدمة

**مداد** هي منصة تدوين عربية تهدف لتكون المساحة العربية الأرقى لمشاركة الأفكار والقصص. المنصة مبنية بدون backend API خلفي — المتصفح يتواصل مباشرة مع Supabase عن طريق anon key، وكل الصلاحيات معتمدة على RLS (Row Level Security) في قاعدة البيانات.

---

## نظرة عامة

| الخاصية        | القيمة                                                  |
| -------------- | ------------------------------------------------------- |
| اسم المشروع    | Midad (مداد)                                            |
| الـ domain     | https://madid.online                                    |
| حالة المشروع   | قيد التطوير (pre-production)                            |
| نوع المنصة     | Blogging/CMS Platform                                   |
| اللغة الأساسية | العربية (RTL)                                           |
| الموبايل       | Android via Capacitor v8                                |
| الـ deployment | Vercel                                                  |
| Analytics      | Google Analytics + Vercel Analytics + Sentry (optional) |

---

## التقنيات المستخدمة

### Frontend Stack

| التقنية              | الاستخدام           | النسخة |
| -------------------- | ------------------- | ------ |
| React                | UI Framework        | 18.2   |
| Vite                 | Build Tool          | أحدث   |
| Tailwind CSS         | Styling             | أحدث   |
| Framer Motion        | Animations          | 11.0   |
| React Router v6      | Routing             | 6.30   |
| TanStack React Query | Server State        | 5.17   |
| Zustand              | Client State        | 4.4    |
| Tiptap               | Rich Text Editor    | 2.2    |
| Recharts             | Charts              | 2.10   |
| Lucide React         | Icons               | 0.330  |
| clsx                 | Classnames          | 2.1    |
| date-fns             | Date formatting     | 3.3    |
| DOMPurify            | HTML Sanitization   | 3.4    |
| react-helmet-async   | SEO Head management | 2.0    |

### Backend / Database

| التقنية                  | الاستخدام                             |
| ------------------------ | ------------------------------------- |
| Supabase                 | Database + Auth + Storage             |
| PostgreSQL               | Database (via Supabase)               |
| Row Level Security (RLS) | Authorization                         |
| Supabase Edge Functions  | Server-side code (YouTube summarizer) |
| Gemini API               | AI Content Generation                 |
| Supabase Realtime        | Real-time notifications               |

### Deployment & Monitoring

| التقنية          | الاستخدام            |
| ---------------- | -------------------- |
| Vercel           | Hosting + Serverless |
| Sentry           | Error Tracking       |
| Google Analytics | User Analytics       |
| Capacitor v8     | Android App          |

---

## هيكل المشروع

### هيكلة الملفات (Structure)

```
src/
├── App.jsx                          # ملف التوجيه الرئيسي (React.lazy لكل الصفحات)
├── main.jsx                         # نقطة الدخول (Sentry، Service Worker، Router)
├── index.css                        # التنسيقات العامة
│
├── lib/                             # الملفات الأساسية
│   ├── supabase.js                  # عميل Supabase + رفع الصور + تسجيل المشاهدات
│   ├── queryClient.js               # إعدادات React Query
│   ├── utils.js                     # دوال مساعدة (slug, وقت القراءة, تاريخ)
│   └── notifications.js            # دوال الإشعارات في المتصفح
│
├── context/                         # React Contexts
│   └── ThemeContext.jsx              # الوضع المظلم/الفاتح
│
├── features/                        # Feature-based modules
│   ├── auth/
│   │   ├── context/AuthContext.jsx   # مصادقة Supabase (PKCE)
│   │   ├── components/ProtectedRoute.jsx  # حماية المسارات
│   │   └── services/
│   │       ├── auth.service.js       # تسجيل الدخول/الخروج
│   │       └── profile.service.js    # CRUD الملف الشخصي
│   │
│   └── posts/
│       ├── components/
│       │   ├── PostCard.jsx          # بطاقة مقال
│       │   └── CommentSection.jsx    # قسم التعليقات
│       ├── hooks/usePosts.js         # React Query hooks للمقالات
│       └── services/post.service.js  # CRUD المقالات والتفاعلات
│
├── stores/                          # Zustand stores
│   ├── ui.store.js                  # حالة الواجهة (modals, mobile menu)
│   ├── settings.store.js            # إعدادات المستخدم (persisted)
│   └── notification.store.js        # حالة الإشعارات
│
├── hooks/                           # Custom React Query hooks
│   ├── useAdmin.js                  # إدارة المستخدمين والقنوات
│   ├── useAnalytics.js              # إحصائيات وتحليلات
│   ├── useComments.js               # إدارة التعليقات
│   ├── useNotifications.js          # إشعارات مع Realtime
│   └── useSettings.js              # إعدادات المنصة
│
├── components/
│   ├── editor/RichEditor.jsx        # Tiptap Editor
│   ├── layout/
│   │   ├── Header.jsx               # الهيدر الرئيسي مع بحث + إشعارات
│   │   ├── Footer.jsx               # الفوتر مع روابط اجتماعية
│   │   └── MainLayout.jsx           # الـ layout الأساسي
│   └── shared/
│       ├── LoadingSpinner.jsx        # مؤشر التحميل
│       ├── ErrorBoundary.jsx         # معالجة الأخطاء
│       ├── NotificationCenter.jsx    # لوحة الإشعارات
│       ├── OptimizedImage.jsx        # صورة محسنة
│       ├── ToastProvider.jsx         # نظام الإشعارات المنبثقة
│       ├── ConfirmModal.jsx          # مربع تأكيد
│       ├── NoticeModal.jsx           # مربع إشعار
│       └── Skeletons.jsx            # شاشات التحميل
│
├── pages/
│   ├── public/                      # صفحات عامة (16 صفحة)
│   │   ├── HomePage.jsx             # الصفحة الرئيسية (Hero + Trending + Feed)
│   │   ├── PostPage.jsx             # صفحة المقال
│   │   ├── LoginPage.jsx            # تسجيل الدخول
│   │   ├── RegisterPage.jsx         # إنشاء حساب
│   │   ├── AuthorPage.jsx           # صفحة كاتب/قناة
│   │   ├── WritersList.jsx          # قائمة الكتاب
│   │   ├── CategoriesPage.jsx       # التصنيفات
│   │   ├── TagsPage.jsx             # الوسوم
│   │   ├── PublicProfile.jsx        # ملف شخصي عام
│   │   ├── ContactPage.jsx          # اتصل بنا
│   │   ├── FAQPage.jsx              # الأسئلة الشائعة
│   │   ├── StaticPage.jsx           # صفحات ثابتة (about, privacy, terms)
│   │   └── AuthCallback.jsx         # معالجةCallback OAuth
│   │
│   ├── admin/                       # صفحات الاستوديو (16 صفحة)
│   │   ├── AdminLayout.jsx          # الـ layout مع سايدبار
│   │   ├── AdminDashboard.jsx       # Dashboard مع إحصائيات + إدارة المحتوى المتميز
│   │   ├── PostEditor.jsx           # محرر المقالات مع ذكاء يوتيوب
│   │   ├── AdminPosts.jsx           # إدارة مقالاتي
│   │   ├── AdminAllPosts.jsx        # جميع مقالات المنصة (أدمن)
│   │   ├── AdminTags.jsx            # إدارة التصنيفات
│   │   ├── AdminUsers.jsx           # إدارة الأعضاء
│   │   ├── AdminChannels.jsx        # إدارة القنوات
│   │   ├── AdminComments.jsx        # إدارة التعليقات
│   │   ├── AdminCreatorRequests.jsx # طلبات الانضمام كمبدع
│   │   ├── AdminInviteCodes.jsx     # أكواد الدعوة
│   │   ├── AdminSettings.jsx        # إعدادات المنصة
│   │   ├── AdminSiteSettings.jsx    # إعدادات القناة
│   │   ├── AdminGroups.jsx          # سلاسل المحتوى
│   │   └── AdminNotifications.jsx   # إرسال إشعارات
│   │
│   └── dashboard/                   # صفحات لوحة التحكم الموحدة
│       ├── DashboardLayout.jsx
│       ├── MyPosts.jsx              # مقالاتي
│       ├── SavedPosts.jsx           # المقالات المحفوظة
│       └── UserProfile.jsx          # إعدادات الحساب
│
├── services/notification.service.js # خدمة الإشعارات (إعلام المتابعين)
└── __tests__/                       # اختبارات (unit + integration)
```

### الـ Routing (App.jsx)

```
/                    → MainLayout > HomePage
/posts               → MainLayout > HomePage
/categories          → MainLayout > CategoriesPage
/tag/:tag            → MainLayout > HomePage (مفلتر بوسم)
/post/:slug          → MainLayout > PostPage
/writers             → MainLayout > WritersList
/c/:slug             → MainLayout > AuthorPage (قناة)
/@:slug              → MainLayout > AuthorPage
/p/:slug             → MainLayout > StaticPage
/about, /privacy, /terms, /cookies → StaticPage
/faq                 → FAQPage
/contact             → ContactPage
/u/:id               → PublicProfile

/login, /register, /auth/callback   → بدون layout

/studio              → ProtectedRoute > AdminLayout
  /studio            → Dashboard
  /studio/posts      → My Posts
  /studio/all-posts  → All Posts (admin)
  /studio/posts/new  → PostEditor
  /studio/posts/edit/:id → PostEditor
  /studio/saved      → Saved Posts
  /studio/profile    → User Profile
  /studio/tags       → Tags (admin)
  /studio/users      → Users (admin)
  /studio/comments   → Comments (admin)
  /studio/groups     → Groups
  /studio/channels   → Channels (admin)
  /studio/requests   → Creator Requests (admin)
  /studio/site-settings → Site Settings
  /studio/settings   → Platform Settings (admin)
  /studio/notifications → Send Notifications (admin)
  /studio/invite-codes → Invite Codes (admin)
```

---

## قاعدة البيانات (Database Schema)

### الجداول (17 جدول)

#### 1. `profiles`

```sql
id UUID PK → auth.users(id)
email TEXT UNIQUE NOT NULL
full_name TEXT
avatar_url TEXT
bio TEXT
role TEXT DEFAULT 'reader' CHECK (reader, author, admin)
is_banned BOOLEAN DEFAULT false
points INTEGER DEFAULT 0
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 2. `posts`

```sql
id UUID PK DEFAULT gen_random_uuid()
title TEXT NOT NULL
slug TEXT UNIQUE NOT NULL
content TEXT
cover_image_url TEXT
tags TEXT[] DEFAULT '{}'
status TEXT DEFAULT 'draft' CHECK (draft, published, scheduled)
published_at TIMESTAMPTZ
scheduled_for TIMESTAMPTZ
views INTEGER DEFAULT 0
likes_count INTEGER DEFAULT 0
comments_count INTEGER DEFAULT 0
reading_time INTEGER DEFAULT 0
author_id UUID FK → profiles(id)
seo_title TEXT
seo_description TEXT
excerpt TEXT
comments_disabled BOOLEAN DEFAULT false
featured_type TEXT
search_vector TSVECTOR (generated by DB trigger)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### 3. `comments`

```sql
id UUID PK
post_id UUID FK → posts(id)
user_id UUID FK → profiles(id)
content TEXT NOT NULL
parent_id UUID FK → comments(id)  -- للردود
is_approved BOOLEAN DEFAULT true
created_at, updated_at
```

#### 4. `post_reactions`

```sql
id UUID PK
post_id UUID FK → posts(id)
user_id UUID FK → auth.users(id)
type TEXT CHECK (like, love, haha, sad, angry)
created_at
```

#### 5. `post_views`

```sql
id UUID PK
post_id UUID FK → posts(id)
user_id UUID FK → profiles(id)
viewer_ip TEXT
viewed_at
```

#### 6. `saved_posts`

```sql
id UUID PK
post_id UUID FK → posts(id)
user_id UUID FK → profiles(id)
created_at
```

#### 7. `tags`

```sql
id UUID PK
name TEXT UNIQUE NOT NULL
slug TEXT UNIQUE
usage_count INTEGER DEFAULT 0
created_at
```

#### 8. `collections`

```sql
id UUID PK
author_id UUID FK → auth.users(id)
name TEXT NOT NULL
description TEXT
created_at, updated_at
```

#### 9. `collection_posts`

```sql
id UUID PK
collection_id UUID FK → collections(id)
post_id UUID FK → posts(id)
added_at
```

#### 10. `follows`

```sql
id UUID PK
follower_id UUID FK → auth.users(id)
following_id UUID FK → auth.users(id)
created_at
```

#### 11. `notifications`

```sql
id UUID PK
recipient_id UUID FK → auth.users(id)
actor_id UUID FK → auth.users(id)
type TEXT NOT NULL
title TEXT
message TEXT NOT NULL
entity_type TEXT
entity_id UUID
metadata JSONB DEFAULT '{}'
read_at TIMESTAMPTZ
created_at
```

#### 12. `site_settings`

```sql
id UUID PK
author_id UUID UNIQUE FK → profiles(id)
site_name TEXT DEFAULT 'مدونتي الخاصة'
site_description TEXT
logo_url TEXT
footer_text TEXT
theme_color TEXT DEFAULT '#000000'
channel_slug TEXT UNIQUE
hero_post_id UUID FK → posts(id)
trending_post_ids UUID[] DEFAULT '{}'
created_at, updated_at
```

#### 13. `invite_codes`

```sql
id UUID PK
code TEXT UNIQUE NOT NULL
role TEXT DEFAULT 'author'
is_used BOOLEAN DEFAULT false
created_at
```

#### 14. `creator_requests`

```sql
id UUID PK
user_id UUID FK → profiles(id)
status TEXT DEFAULT 'pending'
message TEXT
created_at
```

#### 15. `push_subscriptions`

```sql
id UUID PK
user_id UUID FK → auth.users(id)
endpoint TEXT NOT NULL
p256dh TEXT NOT NULL
auth TEXT NOT NULL
user_agent TEXT
created_at
```

#### 16. `newsletter_subscriptions`

```sql
id UUID PK
email TEXT UNIQUE NOT NULL
created_at
```

#### 17. `settings` (General platform settings)

```sql
id UUID PK
site_name TEXT
site_description TEXT
social_links JSONB
contact_email TEXT
maintenance_mode BOOLEAN
updated_at
```

### RLS Policies

الـ RLS مُفعّل على كل الجداول:

**Posts:**

- SELECT: published + author's own + admin
- INSERT: author أو admin فقط
- UPDATE: المؤلف أو admin
- DELETE: المؤلف أو admin

**Comments:**

- SELECT: approved + own + admin
- INSERT: أي مستخدم مسجل
- UPDATE/DELETE: صاحب التعليق أو admin

**Post Reactions:**

- SELECT:任何人 (general read)
- INSERT/DELETE/UPDATE: فقط صاحب التفاعل

**Saved Posts:** فقط صاحبها يشوف/يحذف

**Post Views:**

- SELECT: admin أو صاحب المقال
- INSERT: أي زائر (حتى غير مسجل)

**Tags:**

- SELECT:任何人
- INSERT/UPDATE/DELETE: admin فقط

### الدوال المساعدة (RPC Functions)

- `is_admin()` — تتأكد إذا كان المستخدم أدمن
- `increment_views(post_id)` — تزيد المشاهدات بطريقة آمنة
- `delete_user_by_admin(target_user_id)` — تحذف مستخدم بأمان (مع user ID)
- `increment_user_points(user_id, points_to_add)` — تزيد نقاط المستخدم
- `get_profiles_with_email()` — تجلب البروفايلات مع الإيميل (للأدمن)

---

## المصادقة والصلاحيات

### Auth Flow

1. **PKCE Flow** — Supabase Auth مع `flowType: 'pkce'`
2. **Session Storage** — localStorage تحت المفتاح `sb-auth-token`
3. **Google OAuth** — تسجيل الدخول بحساب Google
4. **Email/Password** — التسجيل التقليدي
5. **Invite Codes** — نظام أكواد دعوة للتسجيل كمبدع

```javascript
// ملف: src/lib/supabase.js — إنشاء عميل Supabase
const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: "sb-auth-token",
    flowType: "pkce",
  },
});
```

### نظام الصلاحيات

3 أدوار:

- **reader** — قارئ عادي (يقرأ، يعلق، يتفاعل)
- **author** — مبدع (يكتب وينشر مقالات)
- **admin** — مدير المنصة (كل الصلاحيات)

ProtectedRoute components:

```javascript
<ProtectedRoute>                    // أي مستخدم مسجل
<ProtectedRoute requireAdmin>      // أدمن فقط
<ProtectedRoute allowAuthor requireAdmin>  // أدمن أو مؤلف
```

### Realtime Profile Updates

الملف الشخصي بيتحدّث تلقائياً عن طريق Supabase Realtime:

```javascript
// AuthContext.jsx — الاستماع للتغييرات في profiles
const profileChannel = supabase
  .channel(`profile-realtime-${user.id}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "profiles",
      filter: `id=eq.${user.id}`,
    },
    (payload) => {
      setProfile(payload.new);
    },
  )
  .subscribe();
```

### نقاط ومستويات (Gamification)

- النقاط بتزيد 10 نقاط لكل مقال منشور
- المستوى = `Math.floor(points / 100) + 1`
- النقاط بتتحدّث عن طريق RPC `increment_user_points`
- لو الـ RPC مش موجود، فيه fallback يدوي

---

## كل صفحة بالمشروع ووظيفتها

### 1. الصفحة الرئيسية — HomePage (`src/pages/public/HomePage.jsx`)

**وظيفتها:** عرض المحتوى الرئيسي للمنصة

**المكونات الداخلية:**

- Hero Section: المقال الرئيسي (إما من اختيار الأدمن في site_settings أو أول مقال)
- Trending Sidebar: 3 مقالات رائجة (يختارهم الأدمن)
- Posts Grid: شبكة مقالات مع pagination (تحميل المزيد)
- Featured Authors: قنوات مميزة
- Newsletter: الاشتراك في النشرة البريدية

**حالات البحث:**

- `?search=query` — يبحث في العناوين والوسوم
- `?tag=tagname` — يصفي المقالات بوسم معين
- وضع البحث يخفي الـ Hero والـ Trending

**API Calls:**

- `PostService.getPosts({ searchQuery, tag })` — المقالات
- `PostService.getFeaturedChannels()` — القنوات
- `PostService.searchChannels(searchQuery)` — البحث عن قنوات
- `supabase.from('site_settings').select('hero_post_id, trending_post_ids')` — الإعدادات

### 2. صفحة المقال — PostPage (`src/pages/public/PostPage.jsx`)

**وظيفتها:** عرض المقال كاملًا مع التفاعلات

**المكونات الداخلية:**

- Cover Image Header: صورة الغلاف بخلفية ضبابية
- Reading Progress Bar: شريط تقدم القراءة
- Table of Contents: فهرس المحتويات (من h2, h3)
- Article Content: محتوى المقال (مع DOMPurify)
- Author Info: معلومات الكاتب مع زر متابعة
- Floating Action Bar: شريط عائم (Reactions, Comments, Share, Save)
- Emoji Reactions: 5 أنواع تفاعل (like, love, haha, sad, angry)
- Comment Section: تعليقات مع ردود

**التفاصيل التقنية:**

- استخدام `DOMPurify.sanitize()` لتنظيف HTML (قائمة tags و attributes مسموحة فقط)
- Increment views مرة واحدة لكل session (sessionStorage)
- Debouncing على الـ reactions (500ms)
- Long-press للايموجي (500ms)
- Optimistic UI update للـ reactions

### 3. محرر المقالات — PostEditor (`src/pages/admin/PostEditor.jsx`)

**وظيفتها:** إنشاء وتعديل المقالات

**المكونات الداخلية:**

- عنوان المقال مع توليد slug تلقائي
- رفع صورة الغلاف (مع validation بالماجيك بايتس)
- RichEditor (Tiptap) مع أدوات تنسيق
- Tags: إضافة/إزالة تصنيفات
- Series: سلسلة مقالات
- Scheduling: جدولة النشر
- Comments Toggle: تعطيل/تفعيل التعليقات
- AI Features: يوتيوب summarize + تحسين المحتوى
- Autosave: حفظ تلقائي في localStorage كل 2 ثانية

**AI Features:**

1. **YouTube Summarize:** يدخل رابط يوتيوب → الـ Edge Function تجيب الـ transcript → Gemini تحوله لمقال
2. **Manual Text:** يلصق نص → Gemini تحوله لمقال
3. **تحسين المحتوى:** يحسن النص الموجود

### 4. لوحة التحكم — Admin Dashboard (`src/pages/admin/AdminDashboard.jsx`)

**وظيفتها:** عرض إحصائيات المنصة للمبدع/الأدمن

**المكونات الداخلية:**

- 4 بطاقات إحصائية (نقاط، مستوى، مقالات، مشاهدات)
- Chart: تحليل المشاهدات (Recharts AreaChart—lazy loaded)
- Top Content: أكثر 5 مقالات مشاهدة
- Category Breakdown: (للأدمن فقط)
- Admin Featured Manager: (للأدمن فقط) اختيار Hero + Trending
- Quick Actions: أزرار سريعة

### 5. باقي الصفحات العامة

| الصفحة                                | الوظيفة                                      |
| ------------------------------------- | -------------------------------------------- |
| **LoginPage**                         | تسجيل الدخول (email/password + Google OAuth) |
| **RegisterPage**                      | إنشاء حساب (مع invite code للأدمن/مؤلف)      |
| **AuthorPage** (`/c/:slug`, `/:slug`) | صفحة قناة الكاتب                             |
| **WritersList**                       | قائمة الكتاب والمبدعين                       |
| **CategoriesPage**                    | التصنيفات والوسوم                            |
| **TagsPage**                          | الوسوم المتاحة                               |
| **PublicProfile** (`/u/:id`)          | ملف شخصي عام                                 |
| **ContactPage**                       | نموذج تواصل                                  |
| **FAQPage**                           | أسئلة شائعة                                  |
| **StaticPage**                        | صفحات ثابتة (about, privacy, terms, cookies) |
| **AuthCallback**                      | معالجة بعد OAuth callback                    |

### 6. صفحات الاستوديو (Admin)

| الصفحة                          | الوظيفة                                       |
| ------------------------------- | --------------------------------------------- |
| **AdminPosts**                  | إدارة مقالاتي (تصفية بالحالة)                 |
| **AdminAllPosts** (أدمن)        | جميع مقالات المنصة                            |
| **AdminTags** (أدمن)            | إضافة/تعديل/حذف تصنيفات                       |
| **AdminUsers** (أدمن)           | إدارة المستخدمين + تغيير الأدوار + ban/delete |
| **AdminChannels** (أدمن)        | إدارة القنوات مع إحصائيات                     |
| **AdminComments** (أدمن)        | إدارة التعليقات                               |
| **AdminCreatorRequests** (أدمن) | الموافقة/رفض طلبات المبدعين                   |
| **AdminInviteCodes** (أدمن)     | إنشاء/إدارة أكواد الدعوة                      |
| **AdminSettings** (أدمن)        | إعدادات المنصة العامة                         |
| **AdminNotifications** (أدمن)   | إرسال إشعارات جماعية                          |
| **AdminSiteSettings**           | إعدادات القناة (site name, logo, slug)        |
| **AdminGroups**                 | إدارة السلاسل والمجموعات                      |
| **SavedPosts**                  | المقالات المحفوظة                             |
| **UserProfile**                 | إعدادات الحساب الشخصي                         |

---

## API Endpoints

### ملاحظة مهمة

**لا يوجد backend API خلفي.** التطبيق بيتكلم مع Supabase مباشرة عن طريق:

1. **Supabase Client** — للاستعلامات المباشرة (SELECT, INSERT, UPDATE, DELETE)
2. **Supabase Functions** — Edge function واحدة (youtube-summarize)
3. **Supabase RPC** — دوال قاعدة البيانات (increment_views, delete_user_by_admin, etc.)
4. **Supabase Realtime** — الاشتراك في التحديثات الفورية

### 1. Authentication

| العملية                 | الطريقة                                             | المكان            |
| ----------------------- | --------------------------------------------------- | ----------------- |
| تسجيل دخول (email/pass) | `supabase.auth.signInWithPassword()`                | `auth.service.js` |
| تسجيل دخول (Google)     | `supabase.auth.signInWithOAuth(provider: 'google')` | `auth.service.js` |
| تسجيل خروج              | `supabase.auth.signOut()`                           | `auth.service.js` |
| استعادة الجلسة          | `supabase.auth.getSession()`                        | `AuthContext.jsx` |
| مراقبة تغيير الحالة     | `supabase.auth.onAuthStateChange()`                 | `AuthContext.jsx` |
| تحديث كلمة المرور       | `supabase.auth.updateUser({ password })`            | `auth.service.js` |

### 2. Posts CRUD

| العملية           | الدالة                                                             | المكان            |
| ----------------- | ------------------------------------------------------------------ | ----------------- |
| جلب المقالات      | `PostService.getPosts()`                                           | `post.service.js` |
| مقال بالـ slug    | `PostService.getPostBySlug(slug)`                                  | `post.service.js` |
| مقال بالـ id      | `PostService.getPostById(id)`                                      | `post.service.js` |
| إنشاء مقال        | `useUpsertPost()` → `supabase.from('posts').insert()`              | `usePosts.js`     |
| تحديث مقال        | `useUpsertPost()` → `supabase.from('posts').update()`              | `usePosts.js`     |
| حذف مقال          | `useDeletePost()` → `supabase.from('posts').delete()`              | `usePosts.js`     |
| زيادة المشاهدات   | `PostService.incrementViews()` → `supabase.rpc('increment_views')` | `post.service.js` |
| مقالات غير منتهية | `useInfinitePosts()` → `useInfiniteQuery`                          | `usePosts.js`     |

### 3. التفاعلات

| العملية            | الدالة                                              |
| ------------------ | --------------------------------------------------- |
| إضافة تفاعل        | `PostService.setReaction(postId, userId, type)`     |
| إحصائيات التفاعلات | `PostService.getReactionCounts(postId)`             |
| حفظ مقال           | `PostService.toggleSave(postId, userId)`            |
| متابعة كاتب        | `PostService.toggleFollow(followerId, followingId)` |

### 4. الإشعارات

| العملية                      | الدالة                                                  |
| ---------------------------- | ------------------------------------------------------- |
| إعلام المتابعين بعد نشر مقال | `NotificationService.notifyFollowers()`                 |
| جلب الإشعارات                | `useNotifications()` → `supabase.from('notifications')` |
| تعيين كمقروء                 | `NotificationService.markAsRead(id)`                    |
| تعيين الكل مقروء             | `NotificationService.markAllAsRead(userId)`             |

### 5. Edge Function: YouTube Summarize

**المسار:** `supabase/functions/youtube-summarize/index.ts`

**الوظيفة:** استقبال رابط يوتيوب → جلب الـ transcript → إرساله لـ Gemini API → استلام مقال عربي

**طريقة العمل:**

1. التحقق من JWT (مطلوب Authorization header)
2. استلام `{ url, text, type }`
3. إذا كان فيه URL: يحاول يجيب الـ transcript بثلاث طرق:
   - Legacy Google timedtext API
   - YouTube page scraping (ytInitialPlayerResponse)
   - youtubetranscript.com API
4. ينظف النص من HTML tags
5. يرسله لـ Gemini API: `gemini-flash-latest`
6. Gemini يرجع JSON: `{ title, article }`
7. يرجع النتيجة للـ client

**أنماط التشغيل:**

- `url` → YouTube summarize
- `text` → convert text to article
- `text + type: 'improve'` → تحسين المحتوى

---

## المشاكل اللي واجهتنا وازاي حاربناها

### 1. مشكلة: YouTube بيحظر الـ scraping

**المشكلة:** يوتيوب بيحظر الطلبات اللي بتجيب الـ transcript، وخصوصاً من Edge Functions.

**الحل:** استخدمنا 3 طرق مختلفة للـ fallback:

1. **الطريقة الأولى:** `video.google.com/timedtext` — API قديم لكنه شغال
2. **الطريقة الثانية:** scraping صفحة يوتيوب مباشرة مع `ytInitialPlayerResponse`
3. **الطريقة الثالثة:** `youtubetranscript.com` — خدمة خارجية

كمان ضفنا `CONSENT` cookie في الـ headers عشان نخدع يوتيوب إننا وافقنا على الكوكيز.

### 2. مشكلة: Gemini API Key في Client Bundle

**المشكلة:** مفتاح Gemini كان موجود في `VITE_GEMINI_API_KEY` وبيتضمن في كل build — أي واحد يقدر يستخرجه.

**الحل:** المفتاح انتقل للـ Edge Function (بيئة Deno side). الحين الـ Edge function تستخدم `Deno.env.get('GEMINI_API_KEY')` والمفتاح موجود كـ environment variable في Supabase Dashboard — مش في الكود ولا في الـ bundle.

**ملاحظة:** لسّه في client-side استخدامات لـ VITE_GEMINI_API_KEY محتاجة مراجعة.

### 3. مشكلة: Supabase RLS مش مفعّل على كل الجداول

**المشكلة:** في بداية المشروع، الجداول الأساسية (posts, comments, reactions) ماكانش فيها RLS — أي مستخدم authenticated يقرأ/يكتب أي حاجة.

**الحل:** ضفنا RLS policies على كل الجداول:

- كل جدول عنده `ENABLE ROW LEVEL SECURITY`
- Policies مخصصة لكل عملية (SELECT, INSERT, UPDATE, DELETE)
- دالة `is_admin()` بتتأكد من صلاحية الأدمن

### 4. مشكلة: رفع صور مزيفة (تزوير MIME type)

**المشكلة:** المستخدم ممكن يغير extension الملف من `.exe` لـ `.jpg` ويرفعه كصورة.

**الحل:** أضفنا validation بـ Magic Bytes:

```javascript
function validateImageMagicBytes(file) {
  // يقرأ أول 4 bytes من الملف ويتأكد إنها:
  // PNG: 89504e47, JPEG: ffd8ff, WebP: 52494646, GIF: 47494638
}
```

### 5. مشكلة: الـ Session بتخلص من غير إنذار

**المشكلة:** الـ session بتاع Supabase بينتهي والمستخدم فجأة يتعملوله logout.

**الحل:**

1. استخدام `autoRefreshToken: true`
2. دالة `forceRefreshSession()` في `lib/supabase.js` — تجبر تحديث الـ token لو قرب يخلص
3. دالة `getProfileWithRetry()` — تحاول 3 مرات في حالة فشل الشبكة
4. Timeout 8 ثواني في AuthContext — لو الجلسة متحملتش بسرعة، يفتح الموقع عادي

### 6. مشكلة: الـ Tiptap Editor بيفقد المحتوى

**المشكلة:** في وضع التعديل، المحتوى القديم ماكنش بيظهر في الـ editor.

**الحل:** ضفنا `setContent` في `useEffect` وبنقارن المحتوى قبل التحديث:

```javascript
useEffect(() => {
  if (editor && content !== editor.getHTML()) {
    editor.commands.setContent(content, false);
  }
}, [content, editor]);
```

### 7. مشكلة: Spamming على الـ API (Reactions)

**المشكلة:** المستخدمين يضغطوا على الـ Like كذا مرة في ثانية — كل ضغطة تطلب API call.

**الحل:** Debouncing:

```javascript
// PostPage.jsx — 500ms debounce
if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
reactionTimeoutRef.current = setTimeout(async () => {
  await PostService.setReaction(post.id, user.id, type);
}, 500);
```

### 8. مشكلة: التعامل مع المقالات المجدولة

**المشكلة:** المقالات المجدولة لازم تظهر بس بعد ما يوعد الميعاد.

**الحل:**

```javascript
// في استعلام جلب المقالات، article scheduled content is fetched
const now = new Date().toISOString();
query = query.or(
  `status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${now})`,
);
```

كمان فيه migration في SQL schema بتستخدم `pg_cron` عشان تنشر المقالات تلقائياً (full_upgrade.sql).

### 9. مشكلة: الصور المرفوعة مش بتظهر

**المشكلة:** مسار الصورة من Supabase Storage مش متوافق مع طريقة العرض.

**الحل:** دالة `getFullImageUrl()` في `utils.js`:

```javascript
export function getFullImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${url}`;
}
```

### 10. مشكلة: إدارة المقال الرئيسي والرائج

**المشكلة:** كانوا مخزنين في localStorage بس — كل مستخدم يشوف ترتيب مختلف.

**الحل:** نقلناهم لـ Supabase table `site_settings` مع `hero_post_id` و `trending_post_ids` (array). الأدمن يضبط الترتيب وكل المستخدمين يشوفوا نفس الحاجة.

### 11. مشكلة: Chunk Loading Errors

**المشكلة:** أحياناً الـ Vite chunks ما تتحملش (خصوصاً بعد deployment جديد) وبيظهر error.

**الحل:** في `main.jsx`:

```javascript
window.addEventListener("error", (e) => {
  if (e.message?.includes("Failed to fetch dynamically imported module")) {
    window.location.reload();
  }
});
```

### 12. مشكلة: النقاط مش بتتحدّث بعد نشر المقال

**المشكلة:** بعد ما ينشر المستخدم مقال، النقاط ما كانت بتزيد فوراً.

**الحل:** استخدمنا RPC `increment_user_points` مع fallback يدوي لو الـ RPC مش موجود:

```javascript
try {
  await supabase.rpc("increment_user_points", {
    user_id: user.id,
    points_to_add: 10,
  });
} catch (err) {
  // Manual fallback
  const { data: pData } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();
  await supabase
    .from("profiles")
    .update({ points: (pData.points || 0) + 10 })
    .eq("id", user.id);
}
```

---

## أسئلة تقنية وأجوبتها

### Q1: ليه اخترت Supabase من غير Backend API؟

**الجواب:** لأنه مشروع تدوين — العمليات الأساسية (قراءة، كتابة) بسيطة وما تحتاج logic معقدة على السيرفر. Supabase مع RLS يغطي 99% من احتياجاتنا. الأمان معتمد على:

1. RLS policies على مستوى الصف
2. Service key مش مكشوف للـ client
3. Edge Functions للمهام الحساسة (زي الـ YouTube summarize)

العيوب: لو احتجنا logic معقدة، هنضطر نضيف Edge Functions أو backend منفصل.

### Q2: كيف تتعامل مع 1000 مستخدم يدخلوا على المقال في نفس الوقت؟

**الجواب:**

1. **Supabase Connection Pooling:** Supabase بيديرPool اتصالاته بنفسه.
2. **React Query Caching:** كل استعلام عنده `staleTime` و `cacheTime` — لو المستخدم دخل تاني، بيجيب من الـ cache بدل ما يضرب API.
3. **Debouncing:** الـ reactions عندها 500ms debounce.
4. **Session Storage:** كل مقال بيتشاف مرة واحدة فقط لكل session.
5. **Edge Functions:** الأمور التقيلة (زي YouTube summarize) مش على حساب المستخدم.

### Q3: ليه اخترت Vite على Next.js أو Remix؟

**الجواب:**

1. المشروع SPA بحت — مفيش حاجة SSR مطلوبة حاليًا.
2. المحتوى ثابت نوعًا ما — السيو معمول عن طريق react-helmet-async + meta tags يدويًا.
3. Vite أسرع في الـ build (esbuild).
4. لو احتجنا SSR في المستقبل، ممكن نضيف Vite SSR أو نستخدم Next.js.

### Q4: إزاي بتأمن الـ API Keys?

**الجواب:**

- **Supabase Anon Key:** آمن لأنه connected بـ RLS — أي استعلام بدون صلاحية بيرجع empty.
- **Gemini Key:** في الأول كان في الـ bundle (غلطة)، دلوقتي في Edge Function environment variable.
- **Sentry DSN:** اختياري، لو مش مضبوط، Sentry مش بيشتغل.

### Q5: إزاي بتدير الـ local state vs server state?

**الجواب:**

- **Server State (React Query):** المقالات، التعليقات، البروفايل، الإشعارات، التحليلات.
- **Client State (Zustand):** الـ modals، الـ mobile menu، الإشعارات المقروءة، الإعدادات (بـ persist).
- **URL State:** البحث (`?search=`)، الفلترة (`?tag=`).

### Q6: ليه في 3 طرق مختلفة لجلب الـ YouTube transcript?

**الجواب:** لأن يوتيوب بيحظر الـ scraping. جربنا:

1. **Google timedtext API** — قديم، بيشتغل مع فيديوهات قديمة.
2. **YouTube page scraping** — بيشتغل مع بعض الفيديوهات.
3. **youtubetranscript.com** — service تابع لجهة ثالثة، ساعات بيوقف.

الحل الحالي: نجرب كل واحد بالترتيب، لو الأول فشل، نجرب التاني، وهكذا.

### Q7: ليه بتستخدم DOMPurify وبتحدد الـ allowed tags يدويًا؟

**الجواب:** الأمان. لو سمحنا بأي HTML، المستخدم يقدر يحقن JavaScript (XSS). الـ DOMPurify بيمسح أي script tags أو event handlers (`onclick`, `onload`). ونسمح بـ tags أساسية فقط: p, h1-3, strong, em, ul, ol, li, blockquote, code, pre, a, img, br.

### Q8: ليه اخترت Tiptap على Quill أو Draft.js?

**الجواب:**

1. **Modular:** كل extension لوحده (CharacterCount, Image, Link, YouTube).
2. **React Native:** مبني على ProseMirror، وله دعم React ممتاز.
3. **خفيف:** مش متضخم.
4. **سهل التخصيص:** نقدر نضيف extensions جديدة بسهولة.

### Q9: إزاي بتعرف وقت القراءة؟

**الجواب:** عن طريق دالة `calculateReadingTime()` في `utils.js`:

```javascript
export function calculateReadingTime(htmlContent) {
  if (!htmlContent) return 1;
  const text = htmlContent
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200)); // 200 كلمة/دقيقة
}
```

### Q10: إزاي الـ slug بيتولّد للعناوين العربية؟

**الجواب:** في `generateSlug()` في `utils.js`: بنعrb Letters to ASCII characters first, removing special characters, then join with hyphens. If all fails, generates `post-{timestamp}` as fallback.

```javascript
// مثال: "مرحبا بالعالم" → "marhaba-bi-alalam"
```

### Q11: ليه في AdminLayout.jsx استخدمت CSS transitions بدل framer-motion للموبايل مينيو؟

**الجواب:** عشان الـ mobile menu يشتغل بموثوقية على الأجهزة الضعيفة. الـ CSS transitions بتستخدم GPU acceleration (translate3d) بدون JavaScript overhead. Framer-motion استخدمناه للـ dropdowns والأجزاء التانية.

### Q12: إزاي بتتعامل مع الصور المحسّنة؟

**الجواب:** عن طريق `OptimizedImage` component: بيستخدم `loading="lazy"` افتراضيًا، و `fetchpriority="high"` للصور المهمة (زي Hero). بنحط `width` و `height` لمنع Cumulative Layout Shift.

### Q13: ازاي بتعرف إذا المستخدم محظور (banned)؟

**الجواب:** في `AuthContext.jsx`:

```javascript
isBanned: profile?.is_banned === true;
```

الـ `ProtectedRoute` بتشيك على `isBanned` وتروجع المستخدم لـ `/login` لو هو محظور. وRLS بتضمن إن المحظور يقرأ بس (مش يكتب).

---

## قرارات معمارية (Architecture Decisions)

### 1. No Backend API

- **قرار:** Frontend يتكلم مع Supabase مباشرة
- **السبب:** تقليل التعقيد، السرعة في التطوير
- **التضحية:** أمان أقل (معتمد على RLS)، صعوبة في الـ business logic المعقد

### 2. Feature-Based Structure

- **قرار:** `src/features/{auth,posts}/` بدل `src/{services,components}/`
- **السبب:** فصل الاهتمامات، سهولة الصيانة
- **مثال:** `features/auth/` فيها context + services + components كلها متعلقة بالأوث

### 3. React Query + Zustand

- **قرار:** فصل server state عن client state
- **السبب:** React Query بيدير الـ caching, refetching, و optimistic updates. Zustand بيدير حالة الواجهة.
- **استثناء:** الإشعارات — عندها store في Zustand + query في React Query (React Query يجيب البيانات، Zustand يحتفظ بالحالة المقروءة)

### 4. Lazy Loading لكل الصفحات

- **قرار:** `React.lazy()` لكل الصفحات + Suspense
- **السبب:** تقليل حجم الـ bundle الأولي
- **تقسيم الـ chunks في Vite:**
  ```
  vendor-react (react, react-dom)
  vendor-router (react-router-dom)
  vendor-motion (framer-motion)
  vendor-supabase (@supabase/supabase-js)
  ```

### 5. Lazy Loading Recharts في AdminDashboard

- **قرار:** Recharts (300KB) يتحمّل فقط لما يدخل الأدمن على الـ dashboard
- **السبب:** توفير bandwidth للمستخدم العادي

### 6. Dark Mode via Tailwind `class` strategy

- **قرار:** `darkMode: 'class'` — نحط الـ class على `<html>`
- **السبب:** CSS custom properties للـ theming، دعم 3 حالات (light, dark, sepia) عن طريق ThemeContext

### 7. Arabic-First Design

- **قرار:** RTL by default، Arabic fonts (Cairo)، Arabic date format (Intl.DateTimeFormat('ar-EG'))
- **السبب:** السوق المستهدف هو العالم العربي

### 8. Points System Gamification

- **قرار:** نقاط + مستويات للمبدعين
- **السبب:** تحفيز المستخدمين على نشر المحتوى
- **آلية العمل:** 10 نقاط لكل مقال منشور، المستوى = `floor(points / 100) + 1`

---

## ملاحظات هامة

### أخطاء أمنية موجودة (must-fix قبل الإطلاق)

1. **✅ RLS على معظم الجداول** — متأكد من RLS على: posts, comments, reactions, saved_posts, tags, post_views
2. **⚠️ RLS غير مُفعّل على:** `invite_codes`, `creator_requests`, `settings`
3. **✅ Edge function مع JWT check** — youtube-summarize يتطلب Authorization header
4. **⚠️ Error messages بتكشف تفاصيل** — `getErrorMessage()` بترجع رسائل عامة، بس بعض الأماكن لسّه تمرر `err.message` مباشرة
5. **⚠️ Admin features (hero/trending) في localStorage سابقاً** — الحين في DB بس الكود القديم لسه موجود؟

### المتغيرات البيئية المطلوبة

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_GEMINI_API_KEY=<key>
VITE_SENTRY_DSN=<optional>
VITE_SENTRY_TRACES_SAMPLE_RATE=0.2
```

### أوامر التشغيل

```bash
npm run dev              # Dev server (http://localhost:5173)
npm run build            # Production build
npm run preview          # Preview build
npm run test             # Vitest unit + integration
npm run test:e2e         # Playwright E2E
npm run test:coverage    # مع التغطية
```

### SQL Migrations (ترتيب التشغيل يدويًا من Supabase Dashboard)

1. `supabase/schema_full.sql` — الهيكل الأساسي
2. `supabase/full_upgrade.sql` — الترقية (notifications, analytics views, triggers)
3. `supabase/full_features_upgrade.sql` — features إضافية (collections, follows, RLS fixes)
4. `supabase/notifications_rls_fix.sql` — إصلاح RLS للإشعارات
