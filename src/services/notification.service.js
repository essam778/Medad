import { supabase } from '../lib/supabase'

export const NotificationService = {
  async notifyFollowers(authorId, authorName, postData) {
    try {
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', authorId)

      if (!followers?.length) return { success: true, count: 0 }

      const notifications = followers.map(f => ({
        recipient_id: f.follower_id,
        actor_id: authorId,
        type: 'new_post',
        title: 'مقال جديد من قناتك المفضلة',
        message: `نشر ${authorName} مقالاً جديداً: "${postData.title}"`,
        entity_type: 'post',
        entity_id: postData.id,
        metadata: { slug: postData.slug },
      }))

      const { error } = await supabase.from('notifications').insert(notifications)
      if (error) throw error

      return { success: true, count: notifications.length }
    } catch (error) {
      console.error('NotificationService Error:', error)
      return { success: false, error }
    }
  },

  async markAsRead(notificationId) {
    return await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
  },

  async markAllAsRead(userId) {
    return await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null)
  }
}
