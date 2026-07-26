import React from "react";
import type { ChatMessage } from "p2play-core";
import { TextChatPanel } from "p2play-core/chat";

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  return (
    <TextChatPanel
      messages={messages}
      onSend={onSendMessage}
      title="Discussion du Saloon"
      placeholder="Un pot-de-vin en secret ?..."
      emptyLabel="Aucun message. Clavardez avec les autres marchands..."
      className="flex flex-col h-72 bg-[#1c0f08] border border-[#523628] rounded-xl p-3 overflow-hidden text-amber-100 font-sans"
    />
  );
};
