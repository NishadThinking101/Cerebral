import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Radio, Users, Clock, Crown, Lock, Globe } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import CreateSuiteModal from '@/react-app/components/CreateSuiteModal';
import type { Suite } from '@/shared/types';

export default function Suites() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: suites = [], isLoading } = useQuery({
    queryKey: ['suites'],
    queryFn: async () => {
      const response = await fetch('/api/suites');
      if (!response.ok) throw new Error('Failed to fetch suites');
      return response.json() as Promise<Suite[]>;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds to show active suites
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeSuites = suites.filter(suite => suite.is_active);
  const mySuites = suites.filter(suite => suite.host_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Radio className="w-8 h-8 text-yellow-400" />
              <span>Audio Suites</span>
            </h1>
            <p className="text-gray-300">Join live audio conversations with up to 10 people</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
          >
            <Plus className="w-5 h-5" />
            <span>Create Suite</span>
          </button>
        </div>

        {/* Active Suites */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span>Live Suites ({activeSuites.length})</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : activeSuites.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Radio className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No active suites</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Be the first to start a live audio conversation. Create a suite and invite others to join.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-8 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Suite</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSuites.map((suite) => (
                <Link
                  key={suite.id}
                  to={`/suite/${suite.id}`}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 border border-gray-700/50 hover:border-yellow-500/50 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-sm font-medium">LIVE</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {suite.is_public ? (
                        <Globe className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                      {suite.host_id === user?.id && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {suite.title}
                  </h3>
                  
                  {suite.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {suite.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>0/{suite.max_participants}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(suite.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Suites */}
        {mySuites.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span>My Suites ({mySuites.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySuites.map((suite) => (
                <Link
                  key={suite.id}
                  to={`/suite/${suite.id}`}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500/50 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {suite.is_active ? (
                        <>
                          <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-sm font-medium">ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 bg-gray-500 rounded-full" />
                          <span className="text-gray-400 text-sm font-medium">INACTIVE</span>
                        </>
                      )}
                    </div>
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {suite.title}
                  </h3>
                  
                  {suite.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {suite.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>0/{suite.max_participants}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(suite.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSuiteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['suites'] });
          }}
        />
      )}
    </div>
  );
}
