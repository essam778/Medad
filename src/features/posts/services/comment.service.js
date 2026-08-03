import { supabase } from "@/lib/supabase";
import { NotificationService } from "@/services/notification.service";

export const CommentService = {
  async getComments(postId) {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles (id, full_name, avatar_url)
      `,
      )
      .eq("post_id", postId)
      .is("parent_id", null)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addComment({ postId, userId, content, parentId = null }) {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId,
      })
      .select()
      .single();
    if (error) throw error;

    // Fetch post author and slug for notification
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
        type: "new_comment",
        title: "تعليق جديد",
        message: `قام ${userData?.full_name || "مستخدم"} بالتعليق على مقالك "${postData.title}"`,
        entityType: "comment",
        entityId: data.id,
        metadata: { slug: postData.slug },
      });
    }

    return data;
  },

  async deleteComment(commentId) {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
    return true;
  },

  async getAdminComments(page = 0) {
    const { data, count, error } = await supabase
      .from("comments")
      .select(
        `
        *, profiles (full_name, email),
        posts (title, slug)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1);
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async toggleCommentReaction(commentId, userId, type = "like") {
    const { data: existing, error: selectError } = await supabase
      .from("comment_reactions")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      if (existing.type === type) {
        const { error: deleteError } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("id", existing.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from("comment_reactions")
          .update({ type })
          .eq("id", existing.id);
        if (updateError) throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from("comment_reactions")
        .insert({ comment_id: commentId, user_id: userId, type });
      if (insertError) throw insertError;
    }
  },

  async getCommentReactionCounts(commentId) {
    const { data, error } = await supabase
      .from("comment_reactions")
      .select("type")
      .eq("comment_id", commentId);

    if (error) return { data: {}, error };

    const counts = data.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    return { data: counts, total: data.length, error: null };
  },
};
