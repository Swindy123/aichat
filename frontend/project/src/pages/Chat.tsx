import { useState, useEffect, useRef } from 'react';
import { Send, Trash2 } from 'lucide-react';
import MessageBubble from '../components/MessageBubble';
import { Message } from '../types/chat';
import { chatApi } from '../services/api';

interface ChatHistory {
  id: string;
  roomId: number;
  timestamp: Date;
  preview: string;
}

interface ChatProps {
  roomId: number;
}

function Chat({ roomId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
    const chatId = `chat_${Date.now()}`;
    setCurrentChatId(chatId);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveChatToHistory();
    }
  }, [messages]);

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem('chatHistory');
      if (stored) {
        const history: ChatHistory[] = JSON.parse(stored);
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatToHistory = () => {
    try {
      if (messages.length === 0) return;

      const preview =
        messages
          .find((m) => !m.isUser)
          ?.content.substring(0, 50)
          .replace(/\n/g, ' ') || '新对话';

      const newHistory: ChatHistory = {
        id: currentChatId,
        roomId,
        timestamp: new Date(),
        preview,
      };

      setChatHistory((prev) => {
        const updated = [newHistory, ...prev.filter((h) => h.id !== currentChatId)].slice(0, 10);
        // 保存历史预览列表
        localStorage.setItem('chatHistory', JSON.stringify(updated));
        // 同步保存完整对话，方便恢复查看
        try {
          localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(messages));
        } catch (err) {
          console.error('Error saving full conversation:', err);
        }
        return updated;
      });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const deleteFromHistory = (id: string) => {
    const updated = chatHistory.filter((h) => h.id !== id);
    setChatHistory(updated);
    localStorage.setItem('chatHistory', JSON.stringify(updated));
    try {
      localStorage.removeItem(`chat_${id}`);
    } catch (err) {
      console.error('Error removing conversation from storage:', err);
    }
  };

  const loadConversation = (id: string) => {
    try {
      const raw = localStorage.getItem(`chat_${id}`);
      if (!raw) {
        // 没有保存完整对话，清空消息并设置当前 id
        setMessages([]);
        setCurrentChatId(id);
        setGameStarted(false);
        setGameEnded(false);
        return;
      }

      const savedMessages: Message[] = JSON.parse(raw);
      if (!Array.isArray(savedMessages)) {
        console.warn('savedMessages is not an array for', id);
        setMessages([]);
        setCurrentChatId(id);
        return;
      }

      // 将可能被序列化为字符串的 timestamp 恢复为 Date
      const restored = savedMessages.map((m) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp as any) : new Date(),
      }));

      setMessages(restored);
      setCurrentChatId(id);

      // 简单推断游戏状态
      const hasUserStart = restored.some((m) => m.isUser && m.content === '开始');
      const botEnded = restored.some((m) => !m.isUser && m.content.includes('游戏已结束'));
      setGameStarted(hasUserStart && !botEnded);
      setGameEnded(botEnded);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleStart = async () => {
    if (gameStarted || isLoading) return;

    setIsLoading(true);
    try {
      const response = await chatApi.sendMessage(roomId, '开始');
      addMessage('开始', true);
      addMessage(response, false);
      setGameStarted(true);

      if (response.includes('游戏已结束')) {
        setGameEnded(true);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      addMessage('连接失败，请稍后重试', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = async () => {
    if (gameEnded || isLoading) return;

    setIsLoading(true);
    try {
      const response = await chatApi.sendMessage(roomId, '结束');
      addMessage('结束', true);
      addMessage(response, false);
      setGameEnded(true);
    } catch (error) {
      console.error('Error ending game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !gameStarted || gameEnded) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      addMessage(userMessage, true);
      const response = await chatApi.sendMessage(roomId, userMessage);
      addMessage(response, false);

      if (response.includes('游戏已结束')) {
        setGameEnded(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('发送失败，请重试', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex">
      <aside className="w-48 bg-white border-r border-gray-200 flex flex-col hidden md:flex fixed left-0 top-0 h-screen z-20">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">历史对话</h3>
        </div>

        <div className="flex-1 overflow-hidden">
          {chatHistory.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              暂无对话记录
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chatHistory.map((history) => (
                <div
                  key={history.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate font-medium">
                        房间 {history.roomId}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {history.preview}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(history.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteFromHistory(history.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-100 rounded transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-48">
        <div className="bg-white shadow-md px-4 py-4 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 text-center">
            AI 脑筋急转弯
          </h2>
          <p className="text-sm text-gray-500 text-center mt-1">
            房间号: {roomId}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <p className="text-lg">点击"开始"按钮开始游戏</p>
              </div>
            )}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-300">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleStart}
                disabled={gameStarted || isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  gameStarted || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md'
                }`}
              >
                开始
              </button>
              <button
                onClick={handleEnd}
                disabled={gameEnded || isLoading || !gameStarted}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  gameEnded || isLoading || !gameStarted
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md'
                }`}
              >
                结束游戏
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入内容"
                disabled={isLoading || !gameStarted || gameEnded}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !gameStarted || gameEnded}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  !inputValue.trim() || isLoading || !gameStarted || gameEnded
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
