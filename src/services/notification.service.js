import { supabase } from "../lib/supabase";

export const NotificationService = {
  async notifyUser({
    recipientId,
    actorId,
    type,
    title,
    message,
    entityType,
    entityId,
    metadata = {},
  }) {
    try {
      // Prevent duplicate notifications (same type, same entity, unread)
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("recipient_id", recipientId)
        .eq("actor_id", actorId)
        .eq("type", type)
        .eq("entity_id", entityId)
        .is("read_at", null)
        .maybeSingle();

      if (existing) return { success: true, duplicated: true };

      const payload = {
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        title,
        message,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      };

      const { error } = await supabase.from("notifications").insert(payload);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("NotificationService Error:", error);
      return { success: false, error };
    }
  },
  async notifyFollowers(authorId, authorName, postData) {
    try {
      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", authorId);

      if (!followers?.length) return { success: true, count: 0 };

      const { data: existingUnread } = await supabase
        .from("notifications")
        .select("recipient_id")
        .in(
          "recipient_id",
          followers.map((f) => f.follower_id),
        )
        .eq("actor_id", authorId)
        .eq("type", "new_post")
        .eq("entity_id", postData.id)
        .is("read_at", null);

      const existingIds = new Set(
        existingUnread?.map((e) => e.recipient_id) || [],
      );

      const notifications = followers
        .filter((f) => !existingIds.has(f.follower_id))
        .map((f) => ({
          recipient_id: f.follower_id,
          actor_id: authorId,
          type: "new_post",
          title: "مقال جديد من قناتك المفضلة",
          message: `نشر ${authorName} مقالاً جديداً: "${postData.title}"`,
          entity_type: "post",
          entity_id: postData.id,
          metadata: { slug: postData.slug },
        }));

      if (notifications.length > 0) {
        const { error } = await supabase
          .from("notifications")
          .insert(notifications);
        if (error) throw error;
      }

      return { success: true, count: notifications.length };
    } catch (error) {
      console.error("NotificationService Error:", error);
      return { success: false, error };
    }
  },

  async markAsRead(notificationId) {
    return await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
  },

  async markAllAsRead(userId) {
    return await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .is("read_at", null);
  },
};
