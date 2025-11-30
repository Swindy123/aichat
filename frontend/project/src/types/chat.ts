export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatRoom {
  id: number;
  messages: Message[];
}
