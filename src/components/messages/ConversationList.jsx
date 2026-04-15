import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ConversationList({
  conversations,
  selectedMatchId,
  onSelectConversation,
  currentUserId,
}) {
  return (
    <div className="space-y-1 p-2">
      {conversations.map((convo) => (
        <button
          key={convo.match.id}
          onClick={() => onSelectConversation(convo)}
          className={`w-full text-left p-3 rounded-xl transition-colors ${
            selectedMatchId === convo.match.id
              ? "bg-red-600/10 border border-red-500/20"
              : "hover:bg-white/5 border border-transparent"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-stone-200 truncate">
              {convo.otherUser?.full_name || "User"}
            </h4>
            {convo.unreadCount > 0 && (
              <Badge className="bg-red-600 text-white text-[10px] h-5 min-w-5 flex items-center justify-center">
                {convo.unreadCount}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-stone-500 mb-1.5 truncate">
            {convo.lastMessage?.texto || "No hay mensajes"}
          </p>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-600">{convo.match.quedada_titulo}</p>
            {convo.lastMessage && (
              <p className="text-xs text-stone-700">
                {formatDistanceToNow(new Date(convo.lastMessage.created_date), {
                  addSuffix: false,
                  locale: es,
                })}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}