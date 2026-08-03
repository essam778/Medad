# Midad (مداد) — خطة التطوير المستقبلي

> **From: Arabic Blogging Platform > Facebook-Scale Social Ecosystem**
> **Target: 100,000+ DAU, High Performance, Enterprise Security**

---

## Table of Contents

1. [Vision & Strategic Direction](#1-vision--strategic-direction)
2. [Phase 0 - Critical Security (Week 1)](#2-phase-0---critical-security-week-1)
3. [Phase 1 - Architecture Overhaul (Month 1-2)](#3-phase-1---architecture-overhaul-month-1-2)
4. [Phase 2 - Database & Storage Scaling (Month 2-3)](#4-phase-2---database--storage-scaling-month-2-3)
5. [Phase 3 - Feature Expansion to Social Platform (Month 3-6)](#5-phase-3---feature-expansion-to-social-platform-month-3-6)
6. [Phase 4 - Infrastructure & DevOps (Month 4-7)](#6-phase-4---infrastructure--devops-month-4-7)
7. [Phase 5 - Performance Optimization (Ongoing)](#7-phase-5---performance-optimization-ongoing)
8. [Phase 6 - Monitoring & Observability (Month 5-8)](#8-phase-6---monitoring--observability-month-5-8)
9. [Cost Optimization Strategy](#9-cost-optimization-strategy)
10. [Summary & Timeline](#10-summary--timeline)

---

## 1. Vision & Strategic Direction

Midad evolves from a single-server SPA blogging platform to a distributed, microservices-based social ecosystem. The roadmap balances three pillars: **Security** (fix existing gaps), **Scale** (architect for 100K+ concurrent users), and **Features** (transform into a full social network).

### Key Architectural Shifts

| Current                                 | Future                                  |
| --------------------------------------- | --------------------------------------- |
| SPA with direct Supabase calls          | Backend API layer (Node.js/Python)      |
| Supabase monolith (DB + Auth + Storage) | Supabase as pure DB + separate services |
| Single PostgreSQL instance              | PostgreSQL cluster + read replicas      |
| No caching layer                        | Redis + CDN multi-layer cache           |
| Vite build = monolithic frontend        | Module Federation micro-frontends       |
| No queue system                         | Message queue (RabbitMQ/Redis Streams)  |
| Client-side only auth                   | Server-verified sessions + JWT rotation |
| Manual deployment                       | Kubernetes + GitOps (ArgoCD)            |

---

## 2. Phase 0 - Critical Security (Week 1)

Before any feature work, fix all critical vulnerabilities identified in the pre-production audit (score: 42/100).

### 2.1 RLS on All 6 Unprotected Tables

Tables currently **missing RLS**: `notifications`, `follows`, `collection_posts`, `invite_codes`, `push_subscriptions`, `newsletter_subscriptions`.

Execute RLS policies for each:

- `notifications`: users can read their own, insert with valid recipient
- `follows`: users manage their own follows
- `collection_posts`: respect collection ownership
- `invite_codes`: admin-only
- `push_subscriptions`: user manages own
- `newsletter_subscriptions`: public insert, admin read/delete

**Priority order:** `notifications` > `follows` > `invite_codes` > `push_subscriptions` > `newsletter_subscriptions` > `collection_posts`

### 2.2 Remove Client-Side Gemini API Key

`VITE_GEMINI_API_KEY` is bundled into production JS - anyone can extract it.

**Action:** Delete `src/lib/gemini.js`, remove all client-side Gemini calls from `PostEditor.jsx`. Route ALL AI features through the existing Edge Function (`youtube-summarize`) which already has JWT auth + server-side `GEMINI_API_KEY`.

### 2.3 Fix 20+ Error Message Leaks

Supabase errors expose table names, column names, and SQL fragments via `toast.error('... ' + err.message)`.

**Action:** Create a centralized error mapping in `src/lib/utils.js`:

```javascript
const SUPABASE_ERROR_MAP = {
  23505: "this element already exists",
  23503: "element linked to other data",
  42501: "you do not have permission",
};
export function getErrorMessage(err) {
  const code = err?.code;
  return SUPABASE_ERROR_MAP[code] || "unexpected error, try again";
}
```

Replace ALL 17 instances of `err.message` in toast calls with `getErrorMessage(err)`.

### 2.4 Add Rate Limiting

No rate limiting exists - a single user can spam reactions, comments, or auth endpoints.

**Action:** Implement rate limiting via:

- Supabase RLS `statement_timeout` for heavy queries
- Vercel WAF rules for auth endpoints
- Edge Function middleware for API routes
- Client-side debouncing (already partially done for reactions - extend to all mutations)

### 2.5 Security Audit Automation

Add `npm run audit:security` script that runs ESLint security plugin + checks for common vulns. Integrate into CI pipeline.

### 2.6 DOMPurify All Output Paths

User-generated HTML flows through comments, bios, and excerpts without sanitization.

**Action:** Create a shared `SanitizedHTML` component and use it everywhere user content renders. Sanitize at render time (not just at save).

---

## 3. Phase 1 - Architecture Overhaul (Month 1-2)

### 3.1 Backend API Layer (Node.js + Express/Fastify)

Current architecture has the browser talking directly to Supabase - this is the #1 blocker for scaling.

**Why a backend API is necessary for 100K users:**

1. **Connection pooling** - Supabase has hard limits on concurrent connections. A backend pools DB connections efficiently.
2. **Business logic** - Feed algorithms, recommendation engine, content moderation can't be done in RLS.
3. **Caching** - API layer caches hot data (feed, trending posts) in Redis.
4. **Rate limiting** - Backend enforces per-user and per-IP limits.
5. **Security** - Sensitive operations (admin, user deletion) verified server-side.

**Implementation plan:**

```
midad-api/
  src/
    services/        # Business logic
      auth.service.js
      post.service.js
      feed.service.js
      notification.service.js
      moderation.service.js
    middleware/       # Auth, rate-limit, validation
    routes/          # Express routers
    db/              # Knex/Drizzle query builders
    cache/           # Redis client
  supabase/          # Edge Functions for AI tasks
  Dockerfile
```

### 3.2 API Gateway (Kong/Envoy)

Single entry point for all microservices:

- **Auth:** JWT verification, token rotation
- **Rate limiting:** Per-endpoint, per-user tiers
- **Routing:** /api/v1/posts to Post Service, /api/v1/social to Social Service
- **Caching:** Response cache for GET endpoints
- **Monitoring:** Request logging, metrics, tracing

### 3.3 Service Layer Enforcement

**Current problem:** 15+ files bypass the service layer and call `supabase.from()` directly.

**Action:** Create dedicated service modules in `src/services/`:

- `src/services/post.service.js` (already exists - clean up god object)
- `src/services/auth.service.js` (already exists)
- `src/services/comment.service.js`
- `src/services/admin.service.js`
- `src/services/analytics.service.js`
- `src/services/settings.service.js`
- `src/services/feed.service.js`

Add ESLint rule: `no-restricted-imports` to block direct `supabase.from()` calls outside `src/services/`.

### 3.4 Split God Components

**Current:** PostEditor (403 lines), AdminDashboard (427 lines), PostPage (500+ lines)

**Action:** Extract into sub-components and custom hooks:

- PostEditor: `usePostEditor` hook + `AIPanel`, `EditorToolbar`, `PublishPanel`
- AdminDashboard: `AdminStats`, `HeroSettings`, `TrendingManager`, `TagBreakdown`
- PostPage: `ReadingProgress`, `FloatingActionBar`, `ReactionPanel`, `TableOfContents`

### 3.5 Message Queue (RabbitMQ / Redis Streams)

For async operations:

- **Notification dispatch** - when a user publishes, notify 1000+ followers asynchronously
- **View counting** - batch post view increments, flush to DB every 60s
- **Feed generation** - fan-out writes to followers' feeds
- **Email delivery** - newsletter, password reset, digest emails

```
publish > queue > worker > DB update + notification dispatch
view > queue > batch worker > DB flush every 60s
```

---

## 4. Phase 2 - Database & Storage Scaling (Month 2-3)

### 4.1 Database Indexing Strategy

Current schema has indexes only on primary keys and `posts.slug`. For 100K users with millions of posts, views, and reactions:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_post_user ON post_reactions(post_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following ON follows(following_id);
```

### 4.2 PostgreSQL Read Replicas

Supabase Pro plan includes up to 5 read replicas.

**Strategy:**

- **Primary (write):** All INSERT/UPDATE/DELETE
- **Read replica 1:** Feed queries, post listing, search
- **Read replica 2:** Analytics, admin dashboards, heavy aggregation queries
- **Read replica 3:** Notification polling, background jobs

### 4.3 Table Partitioning

| Table          | Partition Key | Strategy            |
| -------------- | ------------- | ------------------- |
| post_views     | viewed_at     | Monthly range       |
| notifications  | created_at    | Monthly range       |
| comments       | post_id       | Hash (8 partitions) |
| post_reactions | post_id       | Hash (4 partitions) |

### 4.4 Materialized Views for Analytics

Replace N+1 queries in admin panels:

```sql
CREATE MATERIALIZED VIEW mv_channel_stats AS
SELECT
  p.author_id,
  COUNT(DISTINCT po.id) as post_count,
  COUNT(DISTINCT f.follower_id) as follower_count,
  COALESCE(SUM(po.views), 0) as total_views,
  COALESCE(SUM(po.likes_count), 0) as total_likes
FROM profiles p
LEFT JOIN posts po ON po.author_id = p.id
LEFT JOIN follows f ON f.following_id = p.id
GROUP BY p.author_id;
```

Refresh with `REFRESH MATERIALIZED VIEW CONCURRENTLY` every 5 minutes via pg_cron.

### 4.5 Redis Caching Strategy

3-tier cache:

- **Tier 1 - Hot (5 min TTL):** Trending posts, top 100, session data, site settings
- **Tier 2 - Warm (30 min TTL):** Post content, author profiles, tag lists
- **Tier 3 - Cold (1 hour TTL):** Analytics aggregations, leaderboard

**Cache-aside pattern:**

```
READ: check Redis > miss > query DB > set Redis > return
WRITE: write DB > invalidate Redis key
```

### 4.6 CDN Strategy

Migrate to Cloudflare or AWS CloudFront:

- **Static assets:** JS/CSS bundles cached at edge (1 year, content-hashed)
- **Images:** Supabase Storage origin via CDN, WebP/AVIF auto-conversion
- **API responses:** Cache public GET endpoints at edge (feed, post slugs)
- **HTML shell:** Cache at edge with service worker fallback

Estimated CDN hit rate: 85%+ = 5x reduction in origin server load.

---

## 5. Phase 3 - Feature Expansion to Social Platform (Month 3-6)

### 5.1 Personalized Feed Algorithm

Replace chronological feed with ML-powered ranked feed:

**Algorithm inputs:**

- Recency (time decay function)
- User interests (tags they interact with)
- Engagement velocity (likes/comments per minute)
- Follow network (posts from followed creators)
- Content quality score (reading time, completion rate)

**Implementation:**

1. Track user interactions in `user_interactions` table
2. Periodic batch job computes affinity scores
3. Feed service combines: candidate*posts * affinity*score * recency_factor
4. Serve via cursor-based pagination

```sql
CREATE TABLE user_interactions (
  id UUID PK,
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES posts(id),
  interaction_type TEXT CHECK (view, like, comment, save, share, read_complete),
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Real-Time Messaging (Chat)

Direct messaging between users:

- **WebSocket server:** Node.js + Socket.io
- **Message storage:** `messages` table partitioned by conversation
- **Presence:** Redis pub/sub for online status
- **Push:** FCM for mobile, Web Push for desktop

### 5.3 Groups & Communities

Facebook-style groups:

- Public, closed, and secret privacy modes
- Group posts, member management, roles
- Group discovery feed

### 5.4 Stories / Status Updates

Ephemeral content (24h expiry):

- Store in Redis with TTL or DB with scheduled cleanup
- Image/video upload via Supabase Storage
- View tracking per story

### 5.5 Hashtag System

`#hashtag` in posts, comments, and stories:

- Auto-extract and index in junction table
- Hashtag search page with real-time feed
- Trending hashtags computed hourly

### 5.6 Content Moderation System

For 100K users, automated moderation:

1. **AI pre-moderation:** Edge Function calls Gemini to flag hate speech, spam, NSFW
2. **Auto-filter:** Block known spam patterns, repeated URLs
3. **User reports:** `reports` table + admin queue
4. **Shadow bans:** Rate-limit without notifying the user

### 5.7 Advanced Notification System

- **Channels:** In-app (Realtime), Push (Web Push/FCM), Email (SendGrid/Resend)
- **Preferences:** Per-user notification settings per type
- **Digest:** Daily/weekly email digest of top content
- **Batch:** Batch notification delivery via worker queue

### 5.8 Gamification 2.0

Enhance current points system:

- Badges (verified, top writer, 100 posts)
- Leaderboards (weekly/monthly top authors)
- Streaks (consecutive days publishing/reading)
- Tiers with perks (custom theme, priority support)

---

## 6. Phase 4 - Infrastructure & DevOps (Month 4-7)

### 6.1 Containerization & Orchestration

**Current:** Vercel serverless deployment (limited compute, cold starts).

**Target:** Kubernetes (EKS/GKE) for microservices.

| Service        | Replicas | CPU    | Memory | Scaling Trigger |
| -------------- | -------- | ------ | ------ | --------------- |
| API Gateway    | 3        | 2 vCPU | 4GB    | HPA CPU > 70%   |
| Auth Service   | 5        | 1 vCPU | 2GB    | HPA CPU > 60%   |
| Post Service   | 5        | 2 vCPU | 4GB    | HPA CPU > 70%   |
| Feed Service   | 5        | 2 vCPU | 4GB    | HPA CPU > 70%   |
| Social Service | 3        | 2 vCPU | 4GB    | HPA CPU > 60%   |
| Chat WS        | 3        | 4 vCPU | 8GB    | HPA conn > 10K  |
| Worker (Queue) | 10       | 1 vCPU | 2GB    | HPA queue depth |
| Frontend (SPA) | 5        | 1 vCPU | 2GB    | HPA CPU > 80%   |

### 6.2 CI/CD Pipeline (GitOps with ArgoCD)

**Current:** Pre-commit hook + GitHub Actions CI.

**Target:** Full GitOps:

```
PR merge > CI (test, lint, build) > Docker image > push to ECR
> ArgoCD detects drift > apply to staging
> smoke tests pass > promote to production
> canary deploy (10% > 50% > 100%)
```

### 6.3 Database Migrations Strategy

**Current:** SQL files run manually via Supabase Dashboard.

**Target:** Automated migrations with Flyway or node-pg-migrate:

```
supabase/migrations/
  V001__initial_schema.sql
  V002__add_rls_policies.sql
  V003__add_indexes.sql
  V004__add_partitioning.sql
  V005__add_materialized_views.sql
```

### 6.4 Multi-Region Deployment

- **Primary:** Europe (Frankfurt) - Supabase region
- **CDN edge:** 50+ Cloudflare POPs
- **DR:** Middle East (Bahrain/AE) read replicas
- **Future:** Saudi Arabia (local data residency)

---

## 7. Phase 5 - Performance Optimization (Ongoing)

### 7.1 Frontend Bundle Optimization

**Target:** < 100KB initial load, 90+ Lighthouse score.

1. Replace `framer-motion` with CSS animations for simple transitions (~45KB saving)
2. Lazy load `recharts` only on dashboard (~85KB saving)
3. Dynamic import Tiptap only on editor page
4. Tree-shake `lucide-react` imports
5. `React.memo` on: `PostCard`, `OptimizedImage`, `Header`
6. Virtual scrolling using `@tanstack/virtual` for long lists

### 7.2 API & Database Optimization

- Brotli compression at API gateway
- Cursor-based pagination (not offset) for feed
- Never `SELECT *` - explicit columns only
- `pg_stat_statements` for slow query monitoring
- Read/write splitting - analytics routes to read replicas
- `statement_timeout = 10s`

### 7.3 Service Worker Enhancements

Upgrade `public/sw.js`:

- Cache feed pages for offline reading
- Background sync for comments when offline
- Push notification handling
- Stale-while-revalidate for post pages

---

## 8. Phase 6 - Monitoring & Observability (Month 5-8)

### 8.1 APM & Infrastructure

| Tool                 | Purpose                                   |
| -------------------- | ----------------------------------------- |
| Sentry               | Error tracking + performance transactions |
| Prometheus + Grafana | Metrics (CPU, latency, error rate)        |
| Grafana Loki         | Log aggregation                           |
| OpenTelemetry        | Distributed tracing across microservices  |
| K6                   | Load testing                              |

### 8.2 Business Intelligence

Events pipeline:

```
Events (clicks, views, reactions) > Kafka > ClickHouse
> Batch job > Supabase materialized views
```

- **ClickHouse** for real-time analytics on 100M+ events
- **PostHog** for product analytics (funnels, retention)
- **Google Analytics 4** for marketing

### 8.3 SLOs

| Metric          | Target  | Alert            |
| --------------- | ------- | ---------------- |
| API P99 latency | < 500ms | > 2s for 5 min   |
| API error rate  | < 0.1%  | > 1% for 5 min   |
| Uptime          | 99.9%   | Downtime > 5 min |
| CDN hit rate    | > 85%   | < 70% for 1 hour |
| Replica lag     | < 100ms | > 1s for 5 min   |

---

## 9. Cost Optimization Strategy

### 9.1 Estimated Monthly at 100K DAU

| Service              | Est. Cost      | Optimization                      |
| -------------------- | -------------- | --------------------------------- |
| Supabase Pro         | $500-1000/mo   | Read replicas, connection pooling |
| Vercel Pro           | $200/mo        | Move static to CDN                |
| Cloudflare CDN + WAF | $200/mo        | Cache everything possible         |
| AWS EKS (10 nodes)   | $1500-2000/mo  | Spot instances, right-sizing      |
| Redis (ElastiCache)  | $300/mo        | Reserved instances                |
| RabbitMQ (Amazon MQ) | $200/mo        | Serverless option initially       |
| Total                | ~$2900-3900/mo |                                   |

### 9.2 Saving Strategies

1. **Reserved instances:** 30-50% discount with 1-year commitment
2. **Spot instances:** 60-70% discount for stateless workers
3. **CDN-first:** 85%+ from edge = fewer origin calls
4. **Batch processing:** Aggregate DB writes = fewer connections
5. **Image optimization:** WebP saves 30% bandwidth vs JPEG

---

## 10. Summary & Timeline

### Phase Timeline

| Phase                  | Duration  | Key Deliverables                              | Est. Infra Cost |
| ---------------------- | --------- | --------------------------------------------- | --------------- |
| Phase 0 - Security     | Week 1    | RLS fix, API key removal, error leak fix      | $0              |
| Phase 1 - Architecture | Month 1-2 | Backend API, service layer, message queue     | $500-1000/mo    |
| Phase 2 - DB Scaling   | Month 2-3 | Indexes, replicas, partitioning, Redis, CDN   | $1000-1500/mo   |
| Phase 3 - Social       | Month 3-6 | Feed, chat, groups, moderation, notifications | $1500-2000/mo   |
| Phase 4 - Infra        | Month 4-7 | Kubernetes, GitOps, multi-region              | $2000-3000/mo   |
| Phase 5 - Performance  | Ongoing   | Bundle, queries, SW upgrades                  | Minimal         |
| Phase 6 - Monitoring   | Month 5-8 | APM, BI pipeline, SLOs                        | $500-1000/mo    |

### Success Metrics

| Metric          | Current | Target at 100K DAU  |
| --------------- | ------- | ------------------- |
| DAU             | ~50     | 100,000             |
| Page load time  | ~2s     | < 1s (TTFB < 200ms) |
| API P99 latency | ~1s     | < 500ms             |
| CDN hit rate    | 0%      | > 85%               |
| Uptime          | ~99%    | 99.9%+              |
| Security score  | 42/100  | 95/100+             |
| Active creators | ~10     | > 5,000             |

---

> **This roadmap transforms Midad from a vulnerable blogging prototype into a social platform capable of serving 100,000+ daily active users with enterprise-grade security, performance, and reliability. First priority: Phase 0 security fixes. Do not deploy to production without them.**
