import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@getmocha/users-service/react';
import { X, Send, MessageCircle, User } from 'lucide-react';
import type { Message, Conversation } from '@/shared/types';

interface MessageModalProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export default function MessageModal({ recipientId, recipientName, onClose }: MessageModalProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversation } = useQuery({
    queryKey: ['conversation', recipientId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${recipientId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch conversation');
      }
      return response.json() as Promise<Conversation>;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversation?.id],
    queryFn: async () => {
      if (!conversation?.id) return [];
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json() as Promise<Message[]>;
    },
    enabled: !!conversation?.id,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: recipientId,
          message_text: messageText,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversation', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!conversation?.id) return;
      const response = await fetch(`/api/conversations/${conversation.id}/mark-read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when modal opens
    if (conversation?.id && messages.length > 0) {
      const hasUnreadMessages = messages.some(msg => 
        msg.sender_id !== user?.id && !msg.is_read
      );
      if (hasUnreadMessages) {
        markAsReadMutation.mutate();
      }
    }
  }, [conversation?.id, messages, user?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-lg h-[600px] shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-white font-medium">{recipientName}</h3>
              <p className="text-gray-400 text-sm">Direct Message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Start a conversation with {recipientName}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwn
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.message_text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-black/70' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-xs text-gray-500 mt-1">
            {newMessage.length}/1000 characters
          </div>
        </div>
      </div>
    </div>
  );
}
