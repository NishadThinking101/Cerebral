import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Radio, Globe, Lock, Users } from 'lucide-react';
import type { CreateSuite } from '@/shared/types';

interface CreateSuiteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSuiteModal({ onClose, onSuccess }: CreateSuiteModalProps) {
  const [suiteData, setSuiteData] = useState<CreateSuite>({
    title: '',
    description: '',
    max_participants: 10,
    is_public: true,
  });

  const createSuiteMutation = useMutation({
    mutationFn: async (data: CreateSuite) => {
      const response = await fetch('/api/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create suite');
      return response.json();
    },
    onSuccess: (data) => {
      onSuccess();
      // Redirect to the new suite
      window.location.href = `/suite/${data.id}`;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteData.title.trim()) return;
    createSuiteMutation.mutate(suiteData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <Radio className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Audio Suite</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Suite Title *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={suiteData.title}
              onChange={(e) => setSuiteData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter suite name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-400 mt-1">
              {suiteData.title.length}/100 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={suiteData.description}
              onChange={(e) => setSuiteData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what your suite is about..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {suiteData.description?.length || 0}/500 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Participants
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={suiteData.max_participants}
                onChange={(e) => setSuiteData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none"
              >
                {Array.from({ length: 9 }, (_, i) => i + 2).map(num => (
                  <option key={num} value={num}>
                    {num} participants
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={suiteData.is_public}
                  onChange={() => setSuiteData(prev => ({ ...prev, is_public: true }))}
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
                  checked={!suiteData.is_public}
                  onChange={() => setSuiteData(prev => ({ ...prev, is_public: false }))}
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

          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Suite Features</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Host controls: Manage participants and settings</li>
              <li>• Admin roles: Promote up to 3 moderators</li>
              <li>• Moderation: Mute, kick, and ban capabilities</li>
              <li>• Real-time audio with up to {suiteData.max_participants} people</li>
            </ul>
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
              disabled={!suiteData.title.trim() || createSuiteMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-all duration-200"
            >
              {createSuiteMutation.isPending ? 'Creating...' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
