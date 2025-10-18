import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Settings, Users, Crown, Shield, Ban, AlertTriangle } from 'lucide-react';
import type { Suite, SuiteParticipant } from '@/shared/types';

interface SuiteSettingsModalProps {
  suite: Suite;
  participants: SuiteParticipant[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function SuiteSettingsModal({ 
  suite, 
  participants, 
  onClose, 
  onUpdate 
}: SuiteSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'participants' | 'moderation'>('general');
  const [suiteData, setSuiteData] = useState({
    title: suite.title,
    description: suite.description || '',
    is_public: suite.is_public,
    is_active: suite.is_active,
  });

  const updateSuiteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/suites/${suite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update suite');
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
      onClose();
    },
  });

  const deleteSuiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/suites/${suite.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete suite');
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/suites';
    },
  });

  const handleSave = () => {
    updateSuiteMutation.mutate(suiteData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this suite? This action cannot be undone.')) {
      deleteSuiteMutation.mutate();
    }
  };

  const adminCount = participants.filter(p => p.role === 'admin').length;
  const regularParticipants = participants.filter(p => p.role === 'participant');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <Settings className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-xl font-bold text-white">Suite Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Suite Title
                </label>
                <input
                  type="text"
                  value={suiteData.title}
                  onChange={(e) => setSuiteData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={suiteData.description}
                  onChange={(e) => setSuiteData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Public Suite</h4>
                    <p className="text-gray-400 text-sm">Allow anyone to discover and join</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suiteData.is_public}
                      onChange={(e) => setSuiteData(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Active Suite</h4>
                    <p className="text-gray-400 text-sm">Suite is available for participants</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suiteData.is_active}
                      onChange={(e) => setSuiteData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Participant Overview</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">1</div>
                    <div className="text-gray-400 text-sm">Host</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{adminCount}</div>
                    <div className="text-gray-400 text-sm">Admins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{regularParticipants.length}</div>
                    <div className="text-gray-400 text-sm">Participants</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4">Current Participants</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {participant.user_id.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            User {participant.user_id.slice(-4)}
                          </p>
                          <div className="flex items-center space-x-2 text-xs">
                            {participant.role === 'host' && (
                              <span className="flex items-center space-x-1 text-yellow-400">
                                <Crown className="w-3 h-3" />
                                <span>Host</span>
                              </span>
                            )}
                            {participant.role === 'admin' && (
                              <span className="flex items-center space-x-1 text-blue-400">
                                <Shield className="w-3 h-3" />
                                <span>Admin</span>
                              </span>
                            )}
                            {participant.is_muted && (
                              <span className="text-red-400">Muted</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Joined {new Date(participant.joined_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-yellow-400 font-medium">Moderation Guidelines</h4>
                </div>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• You can promote up to 3 participants to admin</li>
                  <li>• Admins can mute, kick, and ban other participants</li>
                  <li>• Banned users cannot rejoin the suite</li>
                  <li>• All moderation actions are logged</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
                  <Ban className="w-5 h-5 text-red-400" />
                  <span>Admin Slots</span>
                </h4>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Used Admin Slots</span>
                    <span className="text-white font-medium">{adminCount} / 3</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(adminCount / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {3 - adminCount} admin slot{3 - adminCount !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-3">Danger Zone</h4>
                <button
                  onClick={handleDelete}
                  disabled={deleteSuiteMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  {deleteSuiteMutation.isPending ? 'Deleting...' : 'Delete Suite'}
                </button>
                <p className="text-gray-400 text-xs mt-2">
                  This will permanently delete the suite and remove all participants.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateSuiteMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-black rounded-lg font-medium transition-colors"
            >
              {updateSuiteMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
