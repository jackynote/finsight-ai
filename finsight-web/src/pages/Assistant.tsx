import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AssistantView } from '../features/assistant/AssistantView';
import { useFinance } from '../contexts/FinanceContext';
import { ChatMessage } from '../types';
import api from '../api/api';

const AssistantPage: React.FC = () => {
  const { totals, refreshTotals } = useFinance();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [offset, setOffset] = useState(50);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const historyLoadedRef = useRef(false);

  // Helper to remove duplicate messages by id while preserving order
  const uniqueById = (msgs: ChatMessage[]) => {
    const seen = new Set<string>();
    return msgs.filter((m) => {
      if (!m?.id) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  };

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
      setChatHistory(prev => uniqueById([...prev, assistantMsg]));

      if (response.actionResult) {
        refreshTotals();
      }
    });

    newSocket.on('isTyping', (typing) => {
      setIsAITyping(typing);
    });

    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [refreshTotals]);

  useEffect(() => {
    if (historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    const loadHistory = async () => {
      try {
        const response = await api.get('/chat/history', { params: { offset: 0 } });
        const { messages, hasMore: hasMoreMessages, nextOffset } = response.data;

        const formatted = messages.map((h: any) => ({
          id: h.id,
          role: h.role,
          content: h.content,
          timestamp: h.created_at,
          action: h.action_type ? { type: h.action_type, data: h.action_data } : undefined
        }));

        setChatHistory(uniqueById(formatted));
        setOffset(nextOffset ?? 50);
        setHasMore(hasMoreMessages);
      } catch (error) {
        console.error('Failed to load chat history', error);
      }
    };

    loadHistory();
  }, []);

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

  const handleLoadOlderMessages = async () => {
    if (isLoadingOlder || !hasMore) return;
    setIsLoadingOlder(true);

    try {
      const response = await api.get('/chat/history', { params: { offset } });
      const { messages, hasMore: hasMoreMessages, nextOffset } = response.data;

      const formatted = messages.map((h: any) => ({
        id: h.id,
        role: h.role,
        content: h.content,
        timestamp: h.created_at,
        action: h.action_type ? { type: h.action_type, data: h.action_data } : undefined
      }));

      setChatHistory(prev => uniqueById([...formatted, ...prev]));
      setOffset(nextOffset ?? (offset + 50));
      setHasMore(hasMoreMessages);
    } catch (error) {
      console.error('Failed to load older chat history', error);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  return (
    <AssistantView 
      totals={totals}
      onSendMessage={handleSendMessage}
      chatHistory={chatHistory}
      isAITyping={isAITyping}
      onLoadOlderMessages={handleLoadOlderMessages}
      hasMore={hasMore}
      isLoadingOlder={isLoadingOlder}
      historyOffset={offset}
    />
  );
};

export default AssistantPage;
