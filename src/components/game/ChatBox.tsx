import React, { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../../network/protocol";
import { Send } from "lucide-react";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-72 bg-[#1c0f08] border border-[#523628] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#2d1b10] border-b border-[#523628] px-4 py-2 text-xs font-bold text-[#e5a93b] uppercase tracking-wider">
        Discussion du Saloon 💬
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm text-amber-100/90 font-sans">
        {messages.length === 0 ? (
          <div className="text-center text-amber-500/50 text-xs mt-8">
            Aucun message. Clavardez avec les autres marchands...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="bg-[#3b251b]/40 rounded-lg p-2 border border-[#523628]/40">
              <div className="flex justify-between items-center text-[10px] text-amber-400/60 mb-0.5 font-bold">
                <span>{msg.sender}</span>
                <span>{msg.time}</span>
              </div>
              <div className="break-all">{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="p-2 bg-[#2d1b10] border-t border-[#523628] flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Un pot-de-vin en secret ?..."
          className="flex-1 bg-[#1c0f08] border border-[#523628] rounded-lg px-3 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-[#e5a93b]"
        />
        <button
          onClick={handleSend}
          className="bg-[#e5a93b] hover:bg-[#f6bd4f] text-[#1c0f08] w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          title="Envoyer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
