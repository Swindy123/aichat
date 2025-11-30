import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.isUser;

  return (
    <div
      className={`flex items-start gap-3 mb-4 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        {isUser ? (
          <User className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-gray-700" />
        )}
      </div>
      <div
        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
        }`}
      >
        <p className="text-sm md:text-base whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
