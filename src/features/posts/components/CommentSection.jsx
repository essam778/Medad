import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Send, LogIn, Clock, ThumbsUp } from "lucide-react";
import { formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { PostService } from "../services/post.service";
import OptimizedImage from "@/components/shared/OptimizedImage";
import NoticeModal from "@/components/shared/NoticeModal";
import {
  useToggleCommentReaction,
  useCommentReactions,
} from "@/hooks/useComments";

function CommentReactionButton({ commentId, userId }) {
  const { data: reactionsData } = useCommentReactions(commentId);
  const toggleReaction = useToggleCommentReaction();

  const total = reactionsData?.total || 0;

  const handleReact = () => {
    if (!userId) return;
    toggleReaction.mutate({ commentId, userId, type: "like" });
  };

  return (
    <button
      onClick={handleReact}
      disabled={!userId || toggleReaction.isPending}
      className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-purple-400 font-bold transition-all px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-purple-500/30 disabled:opacity-50"
    >
      <ThumbsUp size={12} />
      <span>{total > 0 ? total : "إعجاب"}</span>
    </button>
  );
}

export function CommentSection({
  postId,
  initialComments = [],
  user,
  profile,
  onCommentAdded,
  disabled = false,
}) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [notice, setNotice] = useState({
    open: false,
    title: "",
    message: "",
    variant: "info",
  });

  // Restore comment draft on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(`comment_draft_${postId}`);
    if (saved) setNewComment(saved);
  }, [postId]);

  // Save comment draft on change
  React.useEffect(() => {
    if (newComment) {
      localStorage.setItem(`comment_draft_${postId}`, newComment);
    } else {
      localStorage.removeItem(`comment_draft_${postId}`);
    }
  }, [newComment, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    // Rate Limiting (Operational Safety): Prevent spamming comments too quickly
    const now = Date.now();
    const COOLDOWN_MS = 15000; // 15 seconds cooldown
    if (now - lastCommentTime < COOLDOWN_MS) {
      const remaining = Math.ceil(
        (COOLDOWN_MS - (now - lastCommentTime)) / 1000,
      );
      setNotice({
        open: true,
        title: "مهلاً قليلاً",
        message: `يرجى الانتظار ${remaining} ثانية قبل إضافة تعليق آخر للحفاظ على جودة النقاش.`,
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await PostService.addComment(
        postId,
        user.id,
        newComment,
        replyingTo?.id,
      );

      const updatedComments = [data, ...comments];
      setComments(updatedComments);
      setNewComment("");
      localStorage.removeItem(`comment_draft_${postId}`);
      setReplyingTo(null);
      setLastCommentTime(Date.now()); // Update last success time
      if (onCommentAdded) onCommentAdded(data);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const topLevelComments = comments.filter((c) => c && !c.parent_id);
  const getReplies = (parentId) =>
    comments
      .filter((c) => c && c.parent_id === parentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const renderCommentTree = (commentList, depth = 0) => (
    <div
      className={`space-y-10 ${depth > 0 ? "mt-8 pr-6 md:pr-12 border-r-2 border-white/5" : ""}`}
    >
      {commentList.map((comment, idx) => {
        const replies = getReplies(comment.id);
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={comment.id}
            className="group"
          >
            <div className="flex gap-4 md:gap-6">
              <Link
                to={`/u/${comment.user_id}`}
                className={`rounded-2xl overflow-hidden bg-[#0d0d0d] flex-shrink-0 border border-white/5 group-hover:border-purple-500/30 transition-all shadow-xl ${depth > 0 ? "w-10 h-10 md:w-12 md:h-12" : "w-12 h-12 md:w-16 md:h-16"}`}
              >
                {comment.profiles?.avatar_url ? (
                  <OptimizedImage
                    src={comment.profiles.avatar_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black bg-purple-600/20 text-purple-400 text-xs">
                    {comment.profiles?.full_name?.[0]}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/u/${comment.user_id}`}
                      className="font-black text-xs md:text-sm text-white hover:text-purple-400 transition-colors truncate"
                    >
                      {comment.profiles?.full_name}
                    </Link>
                    <span className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CommentReactionButton
                      commentId={comment.id}
                      userId={user?.id}
                    />
                    {user &&
                      depth < 3 && ( // Limit nesting to 3 levels for UI sanity
                        <button
                          onClick={() => {
                            setReplyingTo(comment);
                            document
                              .getElementById("comment-form")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            document.getElementById("comment-input")?.focus();
                          }}
                          className="text-[9px] text-white/30 hover:text-white font-bold transition-all px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-purple-500/30"
                        >
                          رد
                        </button>
                      )}
                  </div>
                </div>
                <div className="bg-[#0d0d0d]/40 backdrop-blur-3xl p-5 md:p-6 rounded-[1.5rem] rounded-tr-none border border-white/5 shadow-2xl">
                  <p className="text-white/80 font-medium text-sm md:text-base leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
                {replies.length > 0 && renderCommentTree(replies, depth + 1)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <section className="pt-24 border-t border-white/5 mb-32">
      <h2 className="text-3xl font-black mb-16 flex items-center gap-4 italic">
        <MessageCircle className="text-purple-500" size={32} /> النقاشات (
        {comments.length})
      </h2>

      {disabled ? (
        <div className="p-12 bg-white/5 rounded-[3rem] text-center border border-dashed border-white/10 mb-16">
          <p className="text-white/40 font-black italic text-lg">
            التعليقات مغلقة لهذا المقال من قِبل المبدع.
          </p>
        </div>
      ) : user ? (
        <form
          onSubmit={handleSubmit}
          className="mb-20 bg-[#0d0d0d]/50 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/5 focus-within:border-purple-500/30 transition-all shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex gap-6 md:gap-8">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-purple-600/20 text-purple-400 flex items-center justify-center font-black flex-shrink-0 shadow-xl border border-purple-500/20">
              {profile?.avatar_url ? (
                <OptimizedImage
                  src={profile.avatar_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.full_name?.[0]
              )}
            </div>
            <div className="flex-1 space-y-4">
              {replyingTo && (
                <div className="flex items-center justify-between bg-purple-600/10 text-purple-400 p-3 rounded-2xl border border-purple-500/20">
                  <span className="text-xs font-black">
                    جاري الرد على {replyingTo.profiles?.full_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-purple-400/50 hover:text-purple-400 font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              )}
              <textarea
                id="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  replyingTo ? "اكتب ردك هنا..." : "بماذا تفكر؟ أضف رأيك هنا..."
                }
                className="w-full bg-transparent border-none outline-none font-bold text-lg md:text-xl resize-none min-h-[120px] text-white placeholder:text-white/20"
              />
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  disabled={submitting || !newComment.trim()}
                  className="bg-purple-600 text-white px-10 md:px-14 py-4 md:py-4.5 rounded-2xl font-black text-sm flex items-center gap-3 disabled:opacity-50 transition-all shadow-xl shadow-purple-600/20 hover:bg-purple-500 active:scale-95"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send size={20} />
                  )}
                  <span>نشر التعليق</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="mb-20 p-12 bg-white/5 backdrop-blur-2xl rounded-[3rem] text-center border border-white/10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
          <p className="text-white/40 font-black italic text-xl mb-10">
            يجب عليك تسجيل الدخول لتتمكن من الانضمام للنقاش.
          </p>
          <Link
            to="/login"
            className="bg-white text-black px-12 py-5 rounded-2xl font-black shadow-2xl inline-flex items-center gap-3 hover:scale-105 transition-all"
          >
            <LogIn size={20} /> تسجيل الدخول الآن
          </Link>
        </motion.div>
      )}

      {renderCommentTree(topLevelComments)}

      <NoticeModal
        open={notice.open}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
      />
    </section>
  );
}
