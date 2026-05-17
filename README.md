# مداد - Midad 🖋️
### مستقبل الحبر الرقمي العربي

**مداد** هي منصة تدوين عربية متكاملة، مصممة بأحدث التقنيات لتوفر تجربة كتابة وقراءة استثنائية. تجمع المنصة بين جمال التصميم وقوة الأداء، مع نظام تلعيب (Gamification) يحفز المبدعين على العطاء.

---

## 🚀 التقنيات المستخدمة (Tech Stack)

- **Frontend**: React 18 + Vite (أداء فائق السرعة).
- **Styling**: Vanilla CSS + Tailwind + Framer Motion (تصميم عصري وديناميكي).
- **Backend**: Supabase (قاعدة بيانات PostgreSQL + مصادقة مستخدمين + تخزين ملفات).
- **State Management**: Zustand (خفيف وسريع).
- **Performance**: Code Splitting + Lazy Loading (Bundle أقل من 50KB).

---

## ✨ المميزات الرئيسية

- **نظام المستويات والنقاط**: يحصل الكتاب على 10 نقاط لكل مقال، مع مستويات تفتح شارات جديدة.
- **سحب الترانزسكريبت**: ميزة ذكية لسحب النصوص من فيديوهات يوتيوب وتحويلها لمقالات.
- **البحث الذكي**: واجهة بحث سريعة وتفاعلية.
- **لوحة تحكم المبدعين (Studio)**: إحصائيات متقدمة، إدارة المقالات، وتخصيص القنوات.
- **نظام التفاعلات**: تفاعلات تشبه فيسبوك مع نظام تعليقات متطور.

---

[![CI](https://github.com/anomalyco/blog-cms/actions/workflows/ci.yml/badge.svg)](https://github.com/anomalyco/blog-cms/actions/workflows/ci.yml)

---

## Database Backup

A GitHub Actions workflow backs up the Supabase database daily (02:00 UTC) and pushes it to a **separate private repository**.

### Setup

1. **Create a private backup repo** on GitHub (e.g. `blog-cms-backups`).

2. **Add these 3 secrets** in your repo → Settings → Secrets and variables → Actions:

   | Secret | Value |
   |--------|-------|
   | `DATABASE_URL` | Supabase direct connection string (Project Settings → Database → Connection string → URI) |
   | `BACKUP_REPO_TOKEN` | GitHub Personal Access Token with `repo` scope (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens) |
   | `BACKUP_REPO_URL` | The private repo URL path, e.g. `github.com/YOUR_USERNAME/blog-cms-backups` (without `https://` prefix) |

3. **Run manually** from the Actions tab — select **Database Backup** → **Run workflow**.

### Local backup

```bash
DATABASE_URL='postgresql://...' BACKUP_REPO_URL='org/repo' ./scripts/backup-db.sh
```

The script dumps, compresses, and commits to the backup repo automatically. Requires `pg_dump` (install via `postgresql-client`).

---

## 📜 الترخيص
حقوق الطبع والنشر محفوظة لمنصة مداد © 2026.
