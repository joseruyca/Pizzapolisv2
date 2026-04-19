import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ match, otherUser, currentUser }) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", match.id],
    queryFn: () =>
      base44.entities.Message.filter(
        { match_id: match.id },
        "created_date"
      ),
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  const sendMutation = useMutation({
    mutationFn: async (texto) => {
      return base44.entities.Message.create({
        match_id: match.id,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        texto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", match.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser.id] });
      setMessageText("");
    },
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        m => m.receiver_id === currentUser.id && !m.leido
      );
      
      for (const msg of unreadMessages) {
        await base44.entities.Message.update(msg.id, { leido: true });
      }
    };
    
    if (unreadMessages.length > 0) {
      markAsRead();
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser.id] });
    }
  }, [messages, currentUser.id]);

  const unreadMessages = messages.filter(
    m => m.receiver_id === currentUser.id && !m.leido
  ).length;

  const handleSend = () => {
    if (messageText.trim()) {
      sendMutation.mutate(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-stone-400 text-sm">Inicia la conversación</p>
              <p className="text-stone-600 text-xs mt-1">
                Envía un mensaje a {otherUser?.full_name}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/5 bg-[#111]">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="bg-white/[0.04] border-white/8 text-stone-100 placeholder:text-stone-700 h-10 focus:border-red-500/40"
            disabled={sendMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !messageText.trim()}
            className="bg-red-600 hover:bg-red-500 text-white h-10 w-10 p-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}