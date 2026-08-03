import { useQuery, useMutation } from "@tanstack/react-query";
import { CommentService } from "@/features/posts/services/comment.service";
import { queryClient } from "../lib/queryClient";

export function useComments(postId) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      return await CommentService.getComments(postId);
    },
    enabled: !!postId,
  });
}

export function useAddComment() {
  return useMutation({
    mutationFn: async ({ postId, userId, content, parentId = null }) => {
      return await CommentService.addComment({
        postId,
        userId,
        content,
        parentId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: async ({ commentId, postId }) => {
      return await CommentService.deleteComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
  });
}

export function useAdminComments({ page = 0 } = {}) {
  return useQuery({
    queryKey: ["admin", "comments", page],
    queryFn: async () => {
      return await CommentService.getAdminComments(page);
    },
  });
}

export function useToggleCommentReaction() {
  return useMutation({
    mutationFn: async ({ commentId, userId, type }) => {
      return await CommentService.toggleCommentReaction(
        commentId,
        userId,
        type,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["commentReactions", variables.commentId],
      });
    },
  });
}

export function useCommentReactions(commentId) {
  return useQuery({
    queryKey: ["commentReactions", commentId],
    queryFn: async () => {
      return await CommentService.getCommentReactionCounts(commentId);
    },
    enabled: !!commentId,
  });
}
