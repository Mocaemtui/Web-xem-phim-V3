import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/hooks/useWatchTogether';
import { Send } from 'lucide-react';

interface RoomChatProps {
  messages: ChatMessage[];
  typingUsers: string[];
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  isTheaterMode?: boolean;
}

export default function RoomChat({ messages, typingUsers, onSendMessage, onTyping, isTheaterMode }: RoomChatProps) {
  const [text, setText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Auto scroll to bottom of chat container only, avoiding scrolling the whole webpage
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping(true);
    }

    // Clear typing state after 2s of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !text.trim() && isTheaterMode) {
      e.preventDefault();
      window.dispatchEvent(new Event("toggle-chat-visibility"));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
      isTypingRef.current = false;
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };


  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-transparent overflow-hidden border-0 shadow-none pointer-events-none" style={{ backgroundColor: "transparent" }}>
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth pointer-events-auto">
        {messages.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center mt-4">Chưa có tin nhắn nào. Hãy gửi lời chào!</p>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-xs text-zinc-500 italic bg-zinc-900/50 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm text-blue-400">{msg.sender}</span>
                  <span className="text-xs text-zinc-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm mt-1 bg-zinc-900/40 w-fit py-1.5 px-3 rounded-lg rounded-tl-none break-words max-w-[90%]">
                  {msg.text}
                </p>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs mt-2 transition-all">
            <div className="bg-zinc-900/60 border border-zinc-800/40 px-3.5 py-2 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm backdrop-blur-md">
              <span className="font-semibold text-zinc-300">{typingUsers.length > 1 ? `${typingUsers.length} người` : typingUsers[0]}</span>
              <span className="text-zinc-400">đang nhập</span>
              <div className="flex gap-1.5 items-center ml-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`p-3 bg-transparent pointer-events-auto ${isTheaterMode ? "mb-4 md:mb-0" : ""}`}>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            id="chat-input-field"
            type="text"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-200 text-base md:text-sm rounded-xl px-4 py-2.5 outline-none transition-all duration-200 placeholder-zinc-500"
          />
        </form>
      </div>
    </div>
  );
}


