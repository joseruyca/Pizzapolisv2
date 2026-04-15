import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function CommentsSection({ placeId, comments, user, onRequireAuth }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const addComment = useMutation({
    mutationFn: (commentText) =>
      base44.entities.Comment.create({
        place_id: placeId,
        user_email: user.email,
        user_name: user.full_name || "",
        text: commentText,
        status: "visible",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", placeId] });
      setText("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!text.trim()) return;
    addComment.mutate(text.trim());
  };

  return (
    <div className="space-y-5">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder={user ? "Share your experience..." : "Sign in to comment..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => { if (!user) onRequireAuth(); }}
          className="bg-white/5 border-white/10 text-stone-200 placeholder:text-stone-600 resize-none min-h-[80px]"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || addComment.isPending}
          className="bg-red-600 hover:bg-red-500 text-white"
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {addComment.isPending ? "Posting..." : "Post"}
        </Button>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-8 h-8 text-stone-700 mx-auto mb-2" />
          <p className="text-stone-500 text-sm">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600/30 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400">
                      {(comment.user_name || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-stone-300">
                    {comment.user_name || "Anonymous"}
                  </span>
                </div>
                <span className="text-xs text-stone-600">
                  {comment.created_date ? format(new Date(comment.created_date), "MMM d, yyyy") : ""}
                </span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}