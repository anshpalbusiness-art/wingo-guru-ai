import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import wolfLogo from "@/assets/wolf-logo.jpg";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn(
      "flex w-full animate-fade-in gap-3 md:gap-4",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {/* AI Avatar (Left) */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10 mt-1 self-end mb-1">
           <img src={wolfLogo} alt="WOLF AI" className="w-full h-full object-cover" />
        </div>
      )}
      
      {/* Message Bubble */}
      <div className={cn(
        "relative max-w-[85%] sm:max-w-[75%] px-5 py-3.5 shadow-lg transition-all text-sm leading-relaxed group",
        isAssistant 
          ? "rounded-2xl rounded-bl-none bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-slate-100 backdrop-blur-md" 
          : "rounded-2xl rounded-br-none bg-gradient-to-br from-white to-slate-200 text-black font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]"
      )}>
        {/* Content */}
        <div className={cn(
            "prose prose-sm max-w-none break-words",
            isAssistant ? "prose-invert" : "text-black prose-headings:text-black prose-strong:text-black"
        )}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className={isAssistant ? "font-bold text-white/90" : "font-bold text-black"}>{children}</strong>,
              ul: ({ children }) => <ul className={cn("list-disc pl-4 space-y-1 my-2", isAssistant ? "text-white/80" : "text-black/80")}>{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ children }) => <code className={cn("px-1.5 py-0.5 rounded font-mono text-xs border", isAssistant ? "bg-black/30 border-white/10" : "bg-black/5 border-black/10")}>{children}</code>
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        
        {/* Timestamp/Status (Optional, visible on hover) */}
        <div className={cn(
            "absolute -bottom-5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
            isAssistant ? "left-0" : "right-0"
        )}>
            {isAssistant ? "AI Analyst" : "You"}
        </div>
      </div>

      {/* User Avatar (Right) */}
      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white to-slate-300 flex items-center justify-center border border-white/20 mt-1 self-end mb-1 text-black shadow-lg">
          <User className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
