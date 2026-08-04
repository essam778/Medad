import { supabase } from "@/lib/supabase";
import { sanitizeSearchInput } from "@/lib/utils";
import { NotificationService } from "@/services/notification.service";

export const PostService = {
  async getPosts(options = {}) {
    const {
      searchQuery = "",
      tag = "",
      isPopular = false,
      status = "published",
      limit = 20,
      offset = 0,
    } = options;

    let query = supabase
      .from("posts")
      .select(
        "id, title, slug, cover_image_url, published_at, created_at, tags, views, profiles(id, full_name, avatar_url, bio, role, points, created_at), comments(count), post_reactions(count)",
        { count: "exact" },
      );

    if (status === "published") {
      // عرض المقالات المنشورة + المقالات المجدولة التي حان وقتها
      const now = new Date().toISOString();
      query = query.or(
        `status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${now})`,
      );
    } else {
      query = query.eq("status", status);
    }

    if (isPopular) {
      query = query
        .order("views", { ascending: false })
        .order("published_at", { ascending: false });
    } else {
      query = query.order("published_at", { ascending: false });
    }

    if (searchQuery) {
      // البحث في العنوان أو في مصفوفة الوسوم
      // استخدام % قبل وبعد الكلمة للبحث الجزئي
      const q = sanitizeSearchInput(searchQuery);
      if (q) query = query.or(`title.ilike.%${q}%,tags.cs.{${q}}`);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (limit) query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    // Flatten counts
    if (data) {
      data.forEach((post) => {
        post.comments_count = post.comments?.[0]?.count || 0;
        post.reactions_count = post.post_reactions?.[0]?.count || 0;
      });
    }

    return { data, error, count };
  },

  async searchChannels(searchQuery) {
    const q = sanitizeSearchInput(searchQuery);
    if (!q) return { data: [], error: null };
    return await supabase
      .from("site_settings")
      .select("site_name, channel_slug, logo_url, site_description")
      .or(
        `site_name.ilike.%${q}%,site_description.ilike.%${q}%,channel_slug.ilike.%${q}%`,
      )
      .limit(10);
  },

  async getPostBySlug(slug) {
    return await supabase
      .from("posts")
      .select(
        "*, profiles(id, full_name, avatar_url, bio, role, points, created_at)",
      )
      .eq("slug", slug)
      .single();
  },

  async getPostById(id) {
    return await supabase.from("posts").select("*").eq("id", id).single();
  },

  async createPost(postData) {
    const res = await supabase.from("posts").insert(postData).select().single();
    if (res.error) throw res.error;
    return res;
  },

  async updatePost(postId, updates) {
    const res = await supabase
      .from("posts")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();
    if (res.error) throw res.error;
    return res;
  },

  async upsertPost(payload, id = null) {
    if (id) {
      return this.updatePost(id, payload);
    }
    return this.createPost(payload);
  },

  async getRelatedPosts(postId, tags = []) {
    if (!tags || tags.length === 0) return [];

    // Convert array of tags to Postgres array literal for overlaps operator: {tag1,tag2}
    const tagsArrayLiteral = `{${tags.map((t) => `"${t}"`).join(",")}}`;

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, title, slug, cover_image_url, reading_time, published_at, profiles!posts_author_id_fkey(full_name, avatar_url)",
      )
      .eq("status", "published")
      .neq("id", postId)
      .overlaps("tags", tagsArrayLiteral)
      .order("views", { ascending: false })
      .limit(3);

    if (error) throw error;
    return data || [];
  },

  async deletePost(postId) {
    const res = await supabase.from("posts").delete().eq("id", postId);
    if (res.error) throw res.error;
    return res;
  },

  async incrementViews(postId) {
    return await supabase.rpc("increment_views", { post_id: postId });
  },

  async getTags() {
    const { data: tagsData, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    if (error) throw error;

    const { data: postsData } = await supabase.from("posts").select("tags");
    const tagCounts = {};
    postsData?.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      } else if (typeof p.tags === "string") {
        try {
          const parsed = JSON.parse(p.tags);
          if (Array.isArray(parsed)) {
            parsed.forEach((t) => {
              tagCounts[t] = (tagCounts[t] || 0) + 1;
            });
          }
        } catch (e) {
          // ignore
        }
      }
    });

    return (tagsData || []).map((tag) => ({
      ...tag,
      usage_count: tagCounts[tag.name] || 0,
    }));
  },

  async createTag(name) {
    return await supabase
      .from("tags")
      .insert({ name: name.trim().toLowerCase() })
      .select()
      .single();
  },

  async updateTag(id, name) {
    return await supabase
      .from("tags")
      .update({ name: name.trim().toLowerCase() })
      .eq("id", id);
  },

  async deleteTag(tagId) {
    return await supabase.from("tags").delete().eq("id", tagId);
  },

  // =============================================
  // Infinite Scroll & Lists
  // =============================================
  async getInfinitePosts({
    pageParam = 0,
    tag = null,
    search = "",
    perPage = 9,
  }) {
    let query = supabase
      .from("posts")
      .select(
        `
        id, title, slug, cover_image_url, tags, status,
        published_at, views, likes_count, comments_count,
        reading_time, created_at, content,
        profiles!posts_author_id_fkey (id, full_name, avatar_url)
      `,
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(pageParam * perPage, (pageParam + 1) * perPage - 1);

    if (tag) query = query.contains("tags", [tag]);
    if (search) {
      const q = sanitizeSearchInput(search);
      if (q) query = query.or(`title.ilike.%${q}%,tags.cs.{"${q}"}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAdminPostsList({
    status = "",
    page = 0,
    authorId = null,
    excludeMe = null,
  }) {
    let query = supabase
      .from("posts")
      .select(
        `
        id, title, slug, status, published_at, views,
        likes_count, comments_count, reading_time, tags, created_at,
        profiles!posts_author_id_fkey (id, full_name)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1);

    if (status) query = query.eq("status", status);
    if (authorId) query = query.eq("author_id", authorId);
    if (excludeMe) query = query.neq("author_id", excludeMe);

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getMyPosts(userId) {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, title, slug, status, published_at, views, likes_count, comments_count, reading_time, tags, created_at",
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSavedPosts(userId) {
    const { data, error } = await supabase
      .from("saved_posts")
      .select(
        `
        id, created_at,
        posts (id, title, slug, cover_image_url, published_at, reading_time,
          profiles!posts_author_id_fkey (full_name))
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async setReaction(postId, userId, type) {
    const { data: existing, error: selectError } = await supabase
      .from("post_reactions")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      if (existing.type === type) {
        const { error: deleteError } = await supabase
          .from("post_reactions")
          .delete()
          .eq("id", existing.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from("post_reactions")
          .update({ type })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("post_reactions")
        .insert({ post_id: postId, user_id: userId, type });
      if (insertError) throw insertError;

      if (type === "like") {
        const { count: likeCount } = await supabase
          .from("post_reactions")
          .select("id", { count: "exact", head: true })
          .eq("post_id", postId)
          .eq("type", "like");

        if (likeCount <= 20) {
          const { data: postData } = await supabase
            .from("posts")
            .select("author_id, slug, title")
            .eq("id", postId)
            .single();
          if (postData && postData.author_id !== userId) {
            const { data: userData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .single();
            NotificationService.notifyUser({
              recipientId: postData.author_id,
              actorId: userId,
              type: "new_like",
              title: "إعجاب جديد",
              message: `أعجب ${userData?.full_name || "مستخدم"} بمقالك "${postData.title}"`,
              entityType: "post_reaction",
              entityId: postId,
              metadata: { slug: postData.slug },
            });
          }
        }
      }
    }
  },

  async getReactionCounts(postId) {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("type")
      .eq("post_id", postId);

    if (error) return { data: {}, error };

    const counts = data.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    return { data: counts, total: data.length, error: null };
  },

  async toggleLike(postId, userId) {
    // نقوم بتحويلها لاستخدام التفاعلات بنوع 'like' افتراضياً
    return this.setReaction(postId, userId, "like");
  },

  async toggleSave(postId, userId) {
    const { data: existing, error: selectError } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const { error: deleteError } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from("saved_posts")
        .insert({ post_id: postId, user_id: userId });
      if (insertError) throw insertError;
    }
  },

  async getComments(postId) {
    return await supabase
      .from("comments")
      .select(
        "*, profiles(id, full_name, avatar_url, bio, role, points, created_at, site_settings(channel_slug))",
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
  },

  async addComment(postId, userId, content, parentId = null) {
    const payload = { post_id: postId, user_id: userId, content };
    if (parentId) payload.parent_id = parentId;
    const { data, error } = await supabase
      .from("comments")
      .insert(payload)
      .select(
        "*, profiles(id, full_name, avatar_url, bio, role, points, created_at, site_settings(channel_slug))",
      )
      .single();
    if (error) throw error;
    return data;
  },

  async getAuthorChannel(authorId) {
    return await supabase
      .from("site_settings")
      .select("channel_slug, site_name, logo_url")
      .eq("author_id", authorId)
      .maybeSingle();
  },

  async getFeaturedChannels() {
    return await supabase
      .from("site_settings")
      .select("site_name, channel_slug, logo_url")
      .limit(8);
  },

  async checkLikeStatus(postId, userId) {
    return await supabase
      .from("post_reactions")
      .select("type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async checkSaveStatus(postId, userId) {
    return await supabase
      .from("saved_posts")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async checkFollowStatus(followerId, followingId) {
    if (!followerId || !followingId) return null;
    return await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
  },

  async toggleFollow(followerId, followingId) {
    const { data: existing, error: selectError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("id", existing.id);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from("follows")
        .insert({ follower_id: followerId, following_id: followingId });
      if (insertError) throw insertError;

      const { count: followerCount } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", followingId);

      if (followerCount <= 20) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", followerId)
          .single();
        NotificationService.notifyUser({
          recipientId: followingId,
          actorId: followerId,
          type: "new_follow",
          title: "متابع جديد",
          message: `قام ${userData?.full_name || "مستخدم"} بمتابعة قناتك`,
          entityType: "profile",
          entityId: followerId,
          metadata: { author_id: followerId },
        });
      }
    }
  },

  async getAdminStats(isAdmin, userId) {
    let postsQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true });
    if (!isAdmin) postsQuery = postsQuery.eq("author_id", userId);
    const { count: postsCount } = await postsQuery;

    let viewsQuery = supabase.from("posts").select("views");
    if (!isAdmin) viewsQuery = viewsQuery.eq("author_id", userId);
    const { data: viewsData } = await viewsQuery;
    const viewsCount =
      viewsData?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;

    let commentsCount = 0;
    if (isAdmin) {
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true });
      commentsCount = count || 0;
    } else {
      const { data: posts } = await supabase
        .from("posts")
        .select("id")
        .eq("author_id", userId);
      const postIds = posts?.map((p) => p.id) || [];
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .in("post_id", postIds);
        commentsCount = count || 0;
      }
    }

    let topPostsQuery = supabase
      .from("posts")
      .select("id, title, views, slug")
      .order("views", { ascending: false })
      .limit(5);
    if (!isAdmin) topPostsQuery = topPostsQuery.eq("author_id", userId);
    const { data: topPosts } = await topPostsQuery;

    return { postsCount, viewsCount, commentsCount, topPosts };
  },

  async getSiteSettings() {
    return await supabase
      .from("site_settings")
      .select("hero_post_id, trending_post_ids")
      .limit(1)
      .single();
  },

  async getCreatorRequests() {
    const { count } = await supabase
      .from("creator_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count || 0;
  },

  async getGeneralSettings() {
    return await supabase.from("settings").select("*").limit(1).single();
  },

  async getSiteSettingsByAuthor(authorId) {
    return await supabase
      .from("site_settings")
      .select("*")
      .eq("author_id", authorId)
      .maybeSingle();
  },

  async getChannelBySlug(slug) {
    return await supabase
      .from("site_settings")
      .select("*")
      .eq("channel_slug", slug)
      .maybeSingle();
  },

  async getAuthorPosts(authorId) {
    return await supabase
      .from("posts")
      .select("*")
      .eq("author_id", authorId)
      .eq("status", "published")
      .order("published_at", { ascending: false });
  },

  async getCollectionsByAuthor(authorId) {
    return await supabase
      .from("collections")
      .select(`*, collection_posts(posts(*))`)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });
  },

  async getFollowersCount(followingId) {
    const { count } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", followingId);
    return count || 0;
  },

  async upsertChannelSettings(authorId, settings) {
    return await supabase.from("site_settings").upsert(
      {
        ...settings,
        author_id: authorId,
        updated_at: new Date(),
      },
      { onConflict: "author_id" },
    );
  },

  async deleteChannelSettings(authorId) {
    return await supabase
      .from("site_settings")
      .delete()
      .eq("author_id", authorId);
  },
};
