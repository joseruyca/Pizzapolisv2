import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPublicUsername, getAvatarLetter } from "@/lib/display-name";

function fmtDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommentsSection({ placeId, comments, user, onRequireAuth }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const addComment = useMutation({
    mutationFn: async (commentText) => {
      const { error } = await supabase.from("spot_comments").insert({
        spot_id: placeId,
        user_id: user.id,
        content: commentText,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spot-comments", placeId] });
      setText("");
      alert("Comment sent for review.");
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
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder={user ? "Share your experience..." : "Sign in to comment..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => { if (!user) onRequireAuth(); }}
          className="bg-white/5 border-white/10 text-stone-200 placeholder:text-stone-600 resize-none min-h-[80px]"
        />
        <Button type="submit" size="sm" disabled={!text.trim() || addComment.isPending} className="bg-red-600 hover:bg-red-500 text-white">
          <Send className="w-3.5 h-3.5 mr-1.5" />
          {addComment.isPending ? "Sending..." : "Send for review"}
        </Button>
      </form>

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
                    <span className="text-[10px] font-bold text-red-400">{getAvatarLetter(comment.profile, "?")}</span>
                  </div>
                  <span className="text-sm font-medium text-stone-300">{getPublicUsername(comment.profile)}</span>
                </div>
                <span className="text-xs text-stone-600">{fmtDate(comment.created_at)}</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}