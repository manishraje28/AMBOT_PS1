'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Send, 
  ArrowLeft,
  User,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuthStore, useChatStore, Conversation, Message } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import api from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { 
    conversations, 
    messages, 
    loadConversations, 
    loadMessages,
    markAsRead,
    isLoading 
  } = useChatStore();
  const { joinConversation, leaveConversation, markAsRead: socketMarkAsRead } = useSocket();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      joinConversation(selectedConversation.id);
      markAsRead(selectedConversation.id);
      socketMarkAsRead(selectedConversation.id);

      return () => {
        leaveConversation(selectedConversation.id);
      };
    }
  }, [selectedConversation, loadMessages, joinConversation, leaveConversation, markAsRead, socketMarkAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    
    try {
      // Only use REST API - it will emit socket event to all participants
      await api.sendMessage(selectedConversation.id, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const name = `${conv.other_first_name} ${conv.other_last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const currentMessages = selectedConversation ? messages[selectedConversation.id] || [] : [];

  return (
    <div className="h-[calc(100vh-120px)] flex bg-[#0f0f12] rounded-2xl overflow-hidden border border-[#1a1a22]">
      {/* Conversations List */}
      <div className={clsx(
        "w-full md:w-96 border-r border-[#1a1a22] flex flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a22]">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#7a7a8c]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a22] border border-[#2a2a35] rounded-lg text-white placeholder-[#7a7a8c] focus:outline-none focus:border-[#e8b931]"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#e8b931] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#7a7a8c]">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a chat with a mentor or student</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={clsx(
                    "flex items-center gap-3 p-4 cursor-pointer border-b border-[#1a1a22] hover:bg-[#1a1a22] transition-colors",
                    selectedConversation?.id === conv.id && "bg-[#1a1a22]"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={getAvatarUrl(conv.other_first_name, conv.other_last_name, conv.other_avatar_url)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#e8b931] rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">{conv.unread_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {conv.other_first_name} {conv.other_last_name}
                      </h3>
                      <span className="text-xs text-[#7a7a8c]">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full",
                        conv.other_role === 'alumni' 
                          ? "bg-purple-500/20 text-purple-400" 
                          : "bg-blue-500/20 text-blue-400"
                      )}>
                        {conv.other_role}
                      </span>
                      {conv.last_message && (
                        <p className="text-sm text-[#7a7a8c] truncate flex-1">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#1a1a22] flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-[#1a1a22] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              
              <img
                src={getAvatarUrl(selectedConversation.other_first_name, selectedConversation.other_last_name, selectedConversation.other_avatar_url)}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              
              <div>
                <h3 className="font-semibold text-white">
                  {selectedConversation.other_first_name} {selectedConversation.other_last_name}
                </h3>
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedConversation.other_role === 'alumni' 
                    ? "bg-purple-500/20 text-purple-400" 
                    : "bg-blue-500/20 text-blue-400"
                )}>
                  {selectedConversation.other_role}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((msg, index) => {
                const isOwn = msg.sender_id === user?.id;
                const showAvatar = index === 0 || currentMessages[index - 1]?.sender_id !== msg.sender_id;
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "flex items-end gap-2",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    {showAvatar && !isOwn && (
                      <img
                        src={getAvatarUrl(msg.sender_first_name, msg.sender_last_name, msg.sender_avatar_url)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    {!showAvatar && !isOwn && <div className="w-8" />}

                    {/* Message Bubble */}
                    <div
                      className={clsx(
                        "max-w-[70%] px-4 py-2 rounded-2xl",
                        isOwn 
                          ? "bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black rounded-br-md" 
                          : "bg-[#1a1a22] text-white rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={clsx(
                        "flex items-center gap-1 mt-1",
                        isOwn ? "justify-end" : "justify-start"
                      )}>
                        <span className={clsx(
                          "text-xs",
                          isOwn ? "text-black/60" : "text-[#7a7a8c]"
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {isOwn && (
                          msg.is_read ? (
                            <CheckCheck className="w-3 h-3 text-black/60" />
                          ) : (
                            <Check className="w-3 h-3 text-black/60" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#1a1a22]">
              <div className="flex items-center gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-[#1a1a22] border border-[#2a2a35] rounded-xl text-white placeholder-[#7a7a8c] focus:outline-none focus:border-[#e8b931] resize-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className={clsx(
                    "p-3 rounded-xl transition-all",
                    newMessage.trim() && !isSending
                      ? "bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black"
                      : "bg-[#1a1a22] text-[#7a7a8c]"
                  )}
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#7a7a8c]">
            <div className="w-20 h-20 rounded-full bg-[#1a1a22] flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your Messages</h3>
            <p className="text-center max-w-sm">
              Select a conversation to start chatting or visit a mentor's profile to send a message
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
