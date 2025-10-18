import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Video, Play, Mic, Users, Camera, Globe, Lock } from 'lucide-react';
import type { CreateLiveSession } from '@/shared/types';

interface CreateSessionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSessionModal({ onClose, onSuccess }: CreateSessionModalProps) {
  const [sessionData, setSessionData] = useState<CreateLiveSession>({
    title: '',
    description: '',
    session_type: 'showcase',
    theme: '',
    max_participants: 100,
    is_public: true,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: CreateLiveSession) => {
      const response = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (data) => {
      onSuccess();
      // Redirect to the new session
      window.location.href = `/live/${data.id}`;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData.title.trim()) return;
    createSessionMutation.mutate(sessionData);
  };

  const sessionTypes = [
    {
      type: 'showcase' as const,
      icon: Play,
      title: 'Showcase',
      description: 'Play and promote your music with real-time audience interaction',
      color: 'from-purple-500 to-pink-500',
      features: ['Live music playback', 'Real-time chat', 'Audience reactions', 'Music promotion']
    },
    {
      type: 'rivals' as const,
      icon: Mic,
      title: 'Rivals',
      description: 'Head-to-head beat battles with live voting and competition',
      color: 'from-red-500 to-orange-500',
      features: ['2 contestant slots', 'Live voting system', 'Round-based battles', 'Winner announcements']
    },
    {
      type: 'playlisted' as const,
      icon: Users,
      title: 'Playlisted',
      description: 'Collaborative playlist creation based on theme, mood, or genre',
      color: 'from-green-500 to-blue-500',
      features: ['Music submissions', 'Theme-based curation', 'Community voting', 'Playlist export']
    },
  ];

  const selectedTypeInfo = sessionTypes.find(t => t.type === sessionData.session_type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <Video className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Start Live Session</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Session Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sessionTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = sessionData.session_type === type.type;
                
                return (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setSessionData(prev => ({ ...prev, session_type: type.type }))}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-white font-medium mb-1">{type.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Details */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={sessionData.title}
              onChange={(e) => setSessionData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter session title..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-400 mt-1">
              {sessionData.title.length}/100 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={sessionData.description}
              onChange={(e) => setSessionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your session..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>

          {(sessionData.session_type === 'playlisted' || sessionData.session_type === 'showcase') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme (Optional)
              </label>
              <input
                type="text"
                maxLength={100}
                value={sessionData.theme}
                onChange={(e) => setSessionData(prev => ({ ...prev, theme: e.target.value }))}
                placeholder="e.g., '90s Hip-Hop', 'Chill Vibes', 'Workout Music'"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Participants
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={sessionData.max_participants}
                onChange={(e) => setSessionData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none"
              >
                {[25, 50, 100].map(num => (
                  <option key={num} value={num}>
                    {num} participants
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={sessionData.is_public}
                  onChange={() => setSessionData(prev => ({ ...prev, is_public: true }))}
                  className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 focus:ring-yellow-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">Public</div>
                    <div className="text-gray-400 text-xs">Anyone can discover and join</div>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!sessionData.is_public}
                  onChange={() => setSessionData(prev => ({ ...prev, is_public: false }))}
                  className="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 focus:ring-yellow-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-white font-medium">Private</div>
                    <div className="text-gray-400 text-xs">Only people with the link can join</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Session Features */}
          {selectedTypeInfo && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                <selectedTypeInfo.icon className="w-4 h-4" />
                <span>{selectedTypeInfo.title} Features</span>
              </h4>
              <ul className="text-gray-400 text-sm space-y-1">
                {selectedTypeInfo.features.map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Camera className="w-5 h-5 text-blue-400" />
              <h4 className="text-blue-400 font-medium">Camera & Audio Access</h4>
            </div>
            <p className="text-gray-300 text-sm">
              You'll be prompted to allow camera and microphone access when you start the session.
              Make sure you have a stable internet connection for the best experience.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sessionData.title.trim() || createSessionMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-all duration-200"
            >
              {createSessionMutation.isPending ? 'Starting...' : 'Go Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
