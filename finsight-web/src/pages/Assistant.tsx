
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AssistantView } from '../features/assistant/AssistantView';
import { useFinance } from '../contexts/FinanceContext';
import { ChatMessage } from '../types';

const AssistantPage: React.FC = () => {
  const { totals, refreshTotals } = useFinance();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || socketRef.current) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
      auth: { token }
    });

    socketRef.current = newSocket;
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('messageResponse', (response) => {
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        action: response.action
      };
      setChatHistory(prev => [...prev, assistantMsg]);

      // If an action was executed, refresh totals to keep sidebar updated
      if (response.actionResult) {
        refreshTotals();
      }
    });

    newSocket.on('isTyping', (typing) => {
      setIsAITyping(typing);
    });

    newSocket.on('chatHistory', (history) => {
      const formatted = history.map((h: any) => ({
        id: h.id,
        role: h.role,
        content: h.content,
        timestamp: h.created_at,
        action: h.action_type ? { type: h.action_type, data: h.action_data } : undefined
      }));
      setChatHistory(formatted);
    });

    newSocket.emit('getChatHistory');

    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [refreshTotals]);

  const handleSendMessage = (content: string) => {
    if (!socket) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMsg]);
    
    socket.emit('sendMessage', { message: content });
  };

  return (
    <AssistantView 
      totals={totals}
      onSendMessage={handleSendMessage}
      chatHistory={chatHistory}
      isAITyping={isAITyping}
    />
  );
};

export default AssistantPage;
