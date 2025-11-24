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
      "flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg animate-fade-in border transition-all",
      isAssistant 
        ? "bg-black/40 border-white/10 hover:border-white/20" 
        : "bg-white/5 border-white/5 hover:border-white/10"
    )}>
      <div className={cn(
        "flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center border shadow-sm overflow-hidden",
        isAssistant 
          ? "bg-gradient-premium text-black border-white/30 animate-glow" 
          : "bg-black/80 text-white border-white/20"
      )}>
        {isAssistant ? <img src={wolfLogo} alt="WOLF AI" className="w-full h-full object-cover" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
      </div>
      
      <div className="flex-1 space-y-2 sm:space-y-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider font-display">
            {isAssistant ? 'WOLF AI' : 'You'}
          </span>
          {isAssistant && (
            <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-white/5 px-1.5 sm:px-2 py-0.5 rounded border border-white/10">
              EXPERT
            </span>
          )}
        </div>
        <div className="text-foreground leading-relaxed text-xs sm:text-sm prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
