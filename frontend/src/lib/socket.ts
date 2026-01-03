'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useNotificationStore, Message, Notification } from './store';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Singleton socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let globalSocketToken: string | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const chatStore = useChatStore();
  const notificationStore = useNotificationStore();
  
  // Use refs to avoid recreating socket on store function changes
  const chatStoreRef = useRef(chatStore);
  const notificationStoreRef = useRef(notificationStore);
  
  // Keep refs updated
  useEffect(() => {
    chatStoreRef.current = chatStore;
    notificationStoreRef.current = notificationStore;
  }, [chatStore, notificationStore]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        globalSocketToken = null;
      }
      socketRef.current = null;
      return;
    }

    // Reuse existing socket if token hasn't changed
    if (globalSocket && globalSocketToken === token && globalSocket.connected) {
      socketRef.current = globalSocket;
      return;
    }

    // Disconnect old socket if token changed
    if (globalSocket && globalSocketToken !== token) {
      globalSocket.disconnect();
    }

    // Create new socket connection
    globalSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    globalSocketToken = token;
    socketRef.current = globalSocket;

    const socket = globalSocket;

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('📴 Disconnected from WebSocket');
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Handle new messages
    socket.on('new_message', (message: Message) => {
      chatStoreRef.current.addMessage(message.conversation_id, message);
    });

    // Handle message notifications (when not in conversation)
    socket.on('message_notification', (data: { conversationId: string; message: Message }) => {
      if (chatStoreRef.current.activeConversation !== data.conversationId) {
        chatStoreRef.current.loadUnreadCount();
      }
    });

    // Handle general notifications
    socket.on('notification', (notification: Notification) => {
      notificationStoreRef.current.addNotification(notification);
    });

    // Handle typing indicators
    socket.on('user_typing', (data: { userId: string }) => {
      console.log('User typing:', data.userId);
    });

    socket.on('user_stopped_typing', (data: { userId: string }) => {
      console.log('User stopped typing:', data.userId);
    });

    socket.on('messages_read', (data: { userId: string }) => {
      console.log('Messages read by:', data.userId);
    });

    return () => {
      // Don't disconnect on cleanup - socket is global
      // Only remove listeners
      socket.off('new_message');
      socket.off('message_notification');
      socket.off('notification');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('messages_read');
    };
  }, [isAuthenticated, token]);

  const setActiveConversation = chatStore.setActiveConversation;

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_conversation', conversationId);
      setActiveConversation(conversationId);
    }
  }, [setActiveConversation]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_conversation', conversationId);
      setActiveConversation(null);
    }
  }, [setActiveConversation]);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send_message', { conversationId, content });
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', conversationId);
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', conversationId);
    }
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_read', conversationId);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
