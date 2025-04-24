import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Send } from 'lucide-react';

const TextChat: React.FC = () => {
  const { inChat, messages, sendMessage } = useAppContext();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && inChat) {
      sendMessage(text.trim());
      setText('');
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            {inChat ? 'Messages will appear here' : 'Start a chat to send messages'}
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.sender === 'me'
                ? 'bg-blue-600 ml-auto rounded-br-none'
                : 'bg-gray-700 rounded-bl-none'
            }`}
          >
            <div className="text-sm">{message.text}</div>
            <div className="text-xs mt-1 opacity-70">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-700 bg-gray-800"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={inChat ? "Type a message..." : "Start a chat to send messages"}
            disabled={!inChat}
            className="flex-grow bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inChat || !text.trim()}
            className="bg-blue-600 rounded-full p-2 disabled:opacity-50 disabled:bg-gray-600 transition-colors duration-200 hover:bg-blue-700"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextChat;