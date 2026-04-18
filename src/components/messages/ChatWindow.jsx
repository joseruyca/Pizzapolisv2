import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

async function loadMessages(planId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id,content,created_at,user_id,profiles(username,email)")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export default function ChatWindow({ match, currentUser }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const planId = match?.id;

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-window", planId],
    enabled: Boolean(planId),
    queryFn: () => loadMessages(planId),
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const trimmed = text.trim();
      if (!trimmed || !planId || !currentUser?.id) return;
      const { error } = await supabase.from("messages").insert({ plan_id: planId, user_id: currentUser.id, content: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat-window", planId] });
    },
  });

  return (
    <div className="flex h-full flex-col rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-white">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg) => {
          const mine = msg.user_id === currentUser?.id;
          const author = msg.profiles?.username || msg.profiles?.email || "Usuario";
          return (
            <div key={msg.id} className={`max-w-[78%] rounded-[22px] px-4 py-3 ${mine ? "ml-auto bg-[#df5b43] text-white" : "bg-[#141414] text-white border border-white/10"}`}>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">{author}</div>
              <div className="mt-2 text-sm leading-7">{msg.content}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#111111] p-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje..." className="h-12 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-stone-500" />
        <button onClick={() => sendMutation.mutate()} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#df5b43] text-white"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
