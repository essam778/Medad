import { supabase } from "@/lib/supabase";
import { sanitizeSearchInput } from "@/lib/utils";

export const AdminService = {
  async getUsers({ page = 0, search = "", role = "", pageSize = 20 }) {
    let query = supabase
      .rpc("get_profiles_with_email", {}, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (role) query = query.eq("role", role);
    if (search) {
      const q = sanitizeSearchInput(search);
      if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getChannels({ page = 0, search = "", pageSize = 20 }) {
    let query = supabase
      .from("site_settings")
      .select(
        `
        *,
        profiles:author_id (id, full_name, email, avatar_url, role, is_banned)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (search) {
      const q = sanitizeSearchInput(search);
      if (q)
        query = query.or(`site_name.ilike.%${q}%,channel_slug.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // Enriched data with post counts and follower counts
    const enriched = await Promise.all(
      (data || []).map(async (ch) => {
        const { count: postsCount } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("author_id", ch.author_id)
          .eq("status", "published");

        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", ch.author_id);

        return {
          ...ch,
          postsCount: postsCount || 0,
          followersCount: followersCount || 0,
        };
      }),
    );

    return { data: enriched, count: count || 0 };
  },

  async updateUserRole(userId, role) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteUser(userId) {
    const { data, error } = await supabase.rpc("delete_user_by_admin", {
      target_user_id: userId,
    });
    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    return true;
  },
};
