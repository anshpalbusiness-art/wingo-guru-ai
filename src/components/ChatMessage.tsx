import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2 border",
      isAssistant ? "bg-black/40 border-white/10" : "bg-white/5 border-white/5"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center border",
        isAssistant ? "bg-gradient-premium text-black border-white/30" : "bg-black text-white border-white/20"
      )}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-sm text-white">
          {isAssistant ? 'WOLF AI' : 'You'}
        </div>
        <div className="text-foreground whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
};
