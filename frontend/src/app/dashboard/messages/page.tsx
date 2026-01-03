'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Send, 
  ArrowLeft,
  Bot,
  Sparkles,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { useAuthStore, useChatStore, useAIStore, Conversation, Message } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import api from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// AI Assistant as a virtual conversation
const AI_ASSISTANT_CONVERSATION: Conversation = {
  id: 'ai-assistant',
  participant_one: 'ai',
  participant_two: 'user',
  other_user_id: 'ai-assistant',
  other_first_name: 'AMBOT',
  other_last_name: 'AI',
  other_avatar_url: undefined,
  other_role: 'alumni' as const,
  last_message: 'Ask me anything about careers, mentorship, or professional development!',
  last_message_at: new Date().toISOString(),
  unread_count: 0,
};

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { 
    conversations, 
    messages, 
    loadConversations, 
    loadMessages,
    markAsRead,
    addMessage,
    isLoading 
  } = useChatStore();
  const {
    messages: aiMessages,
    isLoading: aiIsLoading,
    sendMessage: sendAIMessage,
    checkAvailability,
    isAvailable: aiIsAvailable,
    clearChat: clearAIChat
  } = useAIStore();
  const { joinConversation, leaveConversation, markAsRead: socketMarkAsRead } = useSocket();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAIChat = selectedConversation?.id === 'ai-assistant';

  useEffect(() => {
    loadConversations();
    checkAvailability();
  }, [loadConversations, checkAvailability]);

  useEffect(() => {
    if (selectedConversation && !isAIChat) {
      loadMessages(selectedConversation.id);
      joinConversation(selectedConversation.id);
      markAsRead(selectedConversation.id);
      socketMarkAsRead(selectedConversation.id);

      return () => {
        leaveConversation(selectedConversation.id);
      };
    }
  }, [selectedConversation, isAIChat, loadMessages, joinConversation, leaveConversation, markAsRead, socketMarkAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation, aiMessages]);

  // Check if message contains @AI mention
  const hasAIMention = (message: string) => {
    return /@AI\b/i.test(message);
  };

  // Handle @AI mention in regular conversations
  const handleAIMention = async (messageContent: string) => {
    if (!hasAIMention(messageContent) || !selectedConversation || isAIChat) {
      return false;
    }

    setIsProcessingAI(true);
    try {
      const currentMsgs = messages[selectedConversation.id] || [];
      const conversationHistory = currentMsgs.slice(-10).map(msg => ({
        content: msg.content,
        senderName: `${msg.sender_first_name} ${msg.sender_last_name}`
      }));

      const response = await api.handleAIMention(messageContent, conversationHistory);
      
      if (response.success && response.data.response) {
        const aiResponseMessage: Message = {
          id: `ai-response-${Date.now()}`,
          conversation_id: selectedConversation.id,
          sender_id: 'ai-assistant',
          content: `🤖 **AMBOT AI:** ${response.data.response}`,
          is_read: true,
          created_at: new Date().toISOString(),
          sender_first_name: 'AMBOT',
          sender_last_name: 'AI',
          sender_avatar_url: undefined
        };
        
        addMessage(selectedConversation.id, aiResponseMessage);
      }
      return true;
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      toast.error('Failed to get AI response');
      return false;
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // AI Chat Mode
    if (isAIChat) {
      await sendAIMessage(messageContent);
      return;
    }

    // Regular chat mode
    if (!selectedConversation) return;

    setIsSending(true);
    
    try {
      await api.sendMessage(selectedConversation.id, messageContent);
      
      // Check for @AI mention and handle it
      if (hasAIMention(messageContent)) {
        await handleAIMention(messageContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);
      toast.error('Failed to send message');
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

  // Include AI Assistant in conversations list
  const allConversations = aiIsAvailable 
    ? [AI_ASSISTANT_CONVERSATION, ...conversations]
    : conversations;

  const filteredConversations = allConversations.filter(conv => {
    const name = `${conv.other_first_name} ${conv.other_last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || 
           (conv.id === 'ai-assistant' && 'ai assistant bot ambot'.includes(searchQuery.toLowerCase()));
  });

  const currentMessages = selectedConversation 
    ? (isAIChat ? [] : messages[selectedConversation.id] || [])
    : [];

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
              {filteredConversations.map((conv) => {
                const isAI = conv.id === 'ai-assistant';
                
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => setSelectedConversation(conv)}
                    className={clsx(
                      "flex items-center gap-3 p-4 cursor-pointer border-b border-[#1a1a22] hover:bg-[#1a1a22] transition-colors",
                      selectedConversation?.id === conv.id && "bg-[#1a1a22]",
                      isAI && "bg-gradient-to-r from-purple-500/5 to-transparent"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {isAI ? (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <img
                          src={getAvatarUrl(conv.other_first_name, conv.other_last_name, conv.other_avatar_url)}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#e8b931] rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">{conv.unread_count}</span>
                        </div>
                      )}
                      {isAI && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0f0f12]">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white truncate flex items-center gap-2">
                          {conv.other_first_name} {conv.other_last_name}
                          {isAI && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                        </h3>
                        {!isAI && (
                          <span className="text-xs text-[#7a7a8c]">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded-full",
                          isAI 
                            ? "bg-purple-500/20 text-purple-400"
                            : conv.other_role === 'alumni' 
                              ? "bg-purple-500/20 text-purple-400" 
                              : "bg-blue-500/20 text-blue-400"
                        )}>
                          {isAI ? 'AI Assistant' : conv.other_role}
                        </span>
                        {conv.last_message && (
                          <p className="text-sm text-[#7a7a8c] truncate flex-1">
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
            <div className={clsx(
              "p-4 border-b border-[#1a1a22] flex items-center gap-3",
              isAIChat && "bg-gradient-to-r from-purple-500/10 to-transparent"
            )}>
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-[#1a1a22] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              
              {isAIChat ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              ) : (
                <img
                  src={getAvatarUrl(selectedConversation.other_first_name, selectedConversation.other_last_name, selectedConversation.other_avatar_url)}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {selectedConversation.other_first_name} {selectedConversation.other_last_name}
                  {isAIChat && <Sparkles className="w-4 h-4 text-purple-400" />}
                </h3>
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-full",
                  isAIChat
                    ? "bg-purple-500/20 text-purple-400"
                    : selectedConversation.other_role === 'alumni' 
                      ? "bg-purple-500/20 text-purple-400" 
                      : "bg-blue-500/20 text-blue-400"
                )}>
                  {isAIChat ? 'AI Assistant' : selectedConversation.other_role}
                </span>
              </div>

              {isAIChat && (
                <button
                  onClick={clearAIChat}
                  className="text-xs px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  Clear Chat
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* AI Chat Welcome Message */}
              {isAIChat && aiMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">AMBOT AI Assistant</h3>
                  <p className="text-[#7a7a8c] max-w-md mb-6">
                    I'm here to help you with career advice, interview tips, mentorship guidance, and professional development. Ask me anything!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {[
                      "How can I prepare for a tech interview?",
                      "What skills should I learn?",
                      "How do I network effectively?",
                      "Tips for my resume"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setNewMessage(suggestion)}
                        className="px-3 py-2 bg-[#1a1a22] border border-[#2a2a35] rounded-lg text-sm text-[#7a7a8c] hover:text-white hover:border-purple-500/50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Messages */}
              {isAIChat && aiMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx(
                    "flex items-end gap-2",
                    !msg.isAI ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.isAI && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={clsx(
                      "max-w-[70%] px-4 py-2 rounded-2xl",
                      !msg.isAI 
                        ? "bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black rounded-br-md" 
                        : "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white rounded-bl-md border border-purple-500/30"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={clsx(
                      "flex items-center gap-1 mt-1",
                      !msg.isAI ? "justify-end" : "justify-start"
                    )}>
                      <span className={clsx(
                        "text-xs",
                        !msg.isAI ? "text-black/60" : "text-purple-300"
                      )}>
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Regular Messages */}
              {!isAIChat && currentMessages.map((msg, index) => {
                const isOwn = msg.sender_id === user?.id;
                const isAIResponse = msg.sender_id === 'ai-assistant';
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
                      isAIResponse ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <img
                          src={getAvatarUrl(msg.sender_first_name, msg.sender_last_name, msg.sender_avatar_url)}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )
                    )}
                    {!showAvatar && !isOwn && <div className="w-8" />}

                    {/* Message Bubble */}
                    <div
                      className={clsx(
                        "max-w-[70%] px-4 py-2 rounded-2xl",
                        isOwn 
                          ? "bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black rounded-br-md" 
                          : isAIResponse
                            ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white rounded-bl-md border border-purple-500/30"
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
                          isOwn ? "text-black/60" : isAIResponse ? "text-purple-300" : "text-[#7a7a8c]"
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

              {/* AI Loading indicator */}
              {(aiIsLoading || isProcessingAI) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl rounded-bl-md border border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-sm text-purple-300">AMBOT AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#1a1a22]">
              {!isAIChat && (
                <p className="text-xs text-[#7a7a8c] mb-2">
                  💡 Type <span className="text-purple-400 font-medium">@AI</span> followed by your question to get AI assistance
                </p>
              )}
              <div className="flex items-center gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isAIChat ? "Ask AMBOT AI anything..." : "Type a message... (use @AI for AI help)"}
                  rows={1}
                  className={clsx(
                    "flex-1 px-4 py-3 bg-[#1a1a22] border rounded-xl text-white placeholder-[#7a7a8c] focus:outline-none resize-none",
                    isAIChat ? "border-purple-500/30 focus:border-purple-500" : "border-[#2a2a35] focus:border-[#e8b931]"
                  )}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending || aiIsLoading}
                  className={clsx(
                    "p-3 rounded-xl transition-all",
                    newMessage.trim() && !isSending && !aiIsLoading
                      ? isAIChat 
                        ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                        : "bg-gradient-to-r from-[#e8b931] to-[#d4a82a] text-black"
                      : "bg-[#1a1a22] text-[#7a7a8c]"
                  )}
                >
                  {isSending || aiIsLoading ? (
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
            <p className="text-center max-w-sm mb-4">
              Select a conversation to start chatting or visit a mentor's profile to send a message
            </p>
            {aiIsAvailable && (
              <button
                onClick={() => setSelectedConversation(AI_ASSISTANT_CONVERSATION)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Bot className="w-4 h-4" />
                Chat with AMBOT AI
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
