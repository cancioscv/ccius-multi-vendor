"use client";

import type { PickerProps } from "emoji-picker-react";
import { ImageIcon, Send, Smile } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const EmojiPicker = dynamic(() => import("emoji-picker-react").then((mod) => mod.default as React.FC<PickerProps>), {
  ssr: false,
});

interface Props {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}
export default function ChatInput({ onSendMessage, message, setMessage }: Props) {
  const [showEmoji, setShowEmoji] = useState(false);

  function handleEmojiClick(emojiData: any) {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Uploading image:", file.name);
    }
  }

  return (
    <form onSubmit={onSendMessage} className="border-t border-t-slate-700 bg-slate-950 px-4 py-3 flex items-center gap-2 relative">
      {/* Upload Icon */}
      <label className="cursor-pointer p-2 hover:bg-slate-800 rounded-md">
        <ImageIcon className="w-5 h-5 text-gray-300" />
        <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
      </label>

      {/* Emoji Picker Toggle */}
      <div className="relative">
        <button type="button" onClick={() => setShowEmoji((prev) => !prev)} className="p-2 hover:bg-slate-800 rounded-md">
          <Smile className="w-5 h-5 text-gray-300" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-12 left-0 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-4 py-2 bg-transparent text-sm border outline-none border-slate-700 rounded-md"
      />

      {/* Send Button */}
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 transition text-white p-2 rounded-md">
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
