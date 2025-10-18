import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Video, Users, Clock, Crown, Eye, Mic, Play } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import CreateSessionModal from '@/react-app/components/CreateSessionModal';
import type { LiveSession } from '@/shared/types';

export default function LiveSessions() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'showcase' | 'rivals' | 'playlisted'>('all');
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['live-sessions', selectedType],
    queryFn: async () => {
      const url = selectedType === 'all' 
        ? '/api/live-sessions' 
        : `/api/live-sessions?type=${selectedType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json() as Promise<LiveSession[]>;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionTypeInfo = (type: string) => {
    switch (type) {
      case 'showcase':
        return {
          color: 'from-purple-500 to-pink-500',
          icon: Play,
          title: 'Showcase',
          description: 'Promote your music live'
        };
      case 'rivals':
        return {
          color: 'from-red-500 to-orange-500',
          icon: Mic,
          title: 'Rivals',
          description: 'Head-to-head beat battles'
        };
      case 'playlisted':
        return {
          color: 'from-green-500 to-blue-500',
          icon: Users,
          title: 'Playlisted',
          description: 'Collaborative playlist creation'
        };
      default:
        return {
          color: 'from-gray-500 to-gray-600',
          icon: Video,
          title: 'Live',
          description: 'Live session'
        };
    }
  };

  const activeSessions = sessions.filter(session => session.is_active);
  const mySessions = sessions.filter(session => session.host_id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Video className="w-8 h-8 text-yellow-400" />
              <span>Live Sessions</span>
            </h1>
            <p className="text-gray-300">Real-time video sessions for music collaboration and competition</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
          >
            <Plus className="w-5 h-5" />
            <span>Go Live</span>
          </button>
        </div>

        {/* Session Type Filter */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {[
            { type: 'all', label: 'All Sessions', icon: Video },
            { type: 'showcase', label: 'Showcase', icon: Play },
            { type: 'rivals', label: 'Rivals', icon: Mic },
            { type: 'playlisted', label: 'Playlisted', icon: Users },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                selectedType === type
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Live Sessions Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>Live Now ({activeSessions.length})</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                  <div className="h-40 bg-gray-700 rounded-lg mb-4" />
                  <div className="h-6 bg-gray-700 rounded mb-2" />
                  <div className="h-4 bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No live sessions</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Be the first to go live! Start a showcase, battle, or playlist session and connect with the community.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-8 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
              >
                <Video className="w-5 h-5" />
                <span>Start Your First Session</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSessions.map((session) => {
                const typeInfo = getSessionTypeInfo(session.session_type);
                const TypeIcon = typeInfo.icon;
                
                return (
                  <Link
                    key={session.id}
                    to={`/live/${session.id}`}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-all duration-200 border border-gray-700/50 hover:border-yellow-500/50 group"
                  >
                    {/* Video Preview */}
                    <div className={`h-40 bg-gradient-to-br ${typeInfo.color} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 text-center">
                        <TypeIcon className="w-12 h-12 text-white mx-auto mb-2" />
                        <span className="text-white font-medium text-sm">{typeInfo.title}</span>
                      </div>
                      
                      {/* Live Indicator */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span>LIVE</span>
                      </div>
                      
                      {/* Viewer Count */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{session.viewer_count}</span>
                      </div>
                      
                      {/* Host Badge */}
                      {session.host_id === user?.id && (
                        <div className="absolute bottom-3 left-3">
                          <Crown className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Session Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {session.title}
                      </h3>
                      
                      {session.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {session.description}
                        </p>
                      )}
                      
                      {session.theme && (
                        <div className="text-xs text-yellow-400 mb-2">
                          Theme: {session.theme}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{session.viewer_count}/{session.max_participants}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.started_at ? formatDate(session.started_at) : 'Starting...'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* My Sessions */}
        {mySessions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span>My Sessions ({mySessions.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySessions.map((session) => {
                const typeInfo = getSessionTypeInfo(session.session_type);
                const TypeIcon = typeInfo.icon;
                
                return (
                  <Link
                    key={session.id}
                    to={`/live/${session.id}`}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500/50 group"
                  >
                    <div className={`h-32 bg-gradient-to-br ${typeInfo.color} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 text-center">
                        <TypeIcon className="w-8 h-8 text-white mx-auto mb-1" />
                        <span className="text-white text-sm">{typeInfo.title}</span>
                      </div>
                      
                      {session.is_active ? (
                        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span>LIVE</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                          ENDED
                        </div>
                      )}
                      
                      <Crown className="absolute top-2 right-2 w-4 h-4 text-yellow-400" />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {session.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{session.viewer_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(session.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
          }}
        />
      )}
    </div>
  );
}
