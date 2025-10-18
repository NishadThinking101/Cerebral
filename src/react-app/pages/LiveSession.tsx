import { useParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Video, VideoOff, Mic, MicOff, Users, Settings, 
  Send, Heart, Flame, Crown as CrownIcon, Music, X
} from 'lucide-react';
import { Link } from 'react-router';
import Navbar from '@/react-app/components/Navbar';
import type { 
  LiveSession, 
  SessionParticipant, 
  SessionSubmission, 
  SessionChat,
  SubmitMusic 
} from '@/shared/types';

export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['live-session', id],
    queryFn: async () => {
      const response = await fetch(`/api/live-sessions/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Session not found');
        if (response.status === 403) throw new Error('Access denied');
        throw new Error('Failed to fetch session');
      }
      return response.json() as Promise<LiveSession>;
    },
    enabled: !!id && !!user,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['session-participants', id],
    queryFn: async () => {
      const response = await fetch(`/api/live-sessions/${id}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json() as Promise<SessionParticipant[]>;
    },
    enabled: !!id && !!user,
    refetchInterval: 2000,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['session-submissions', id],
    queryFn: async () => {
      const response = await fetch(`/api/live-sessions/${id}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json() as Promise<SessionSubmission[]>;
    },
    enabled: !!id && !!user,
    refetchInterval: 3000,
  });

  console.log('Submissions:', submissions); // Use submissions to avoid unused warning

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['session-chat', id],
    queryFn: async () => {
      const response = await fetch(`/api/live-sessions/${id}/chat`);
      if (!response.ok) throw new Error('Failed to fetch chat');
      return response.json() as Promise<SessionChat[]>;
    },
    enabled: !!id && !!user,
    refetchInterval: 1000,
  });

  const joinSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/live-sessions/${id}/join`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-participants', id] });
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/live-sessions/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_text: message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['session-chat', id] });
    },
  });

  const submitMusicMutation = useMutation({
    mutationFn: async (data: SubmitMusic) => {
      const response = await fetch(`/api/live-sessions/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit music');
      return response.json();
    },
    onSuccess: () => {
      setShowSubmitModal(false);
      queryClient.invalidateQueries({ queryKey: ['session-submissions', id] });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ submissionId, voteType }: { submissionId: string; voteType: string }) => {
      const response = await fetch(`/api/live-sessions/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId, vote_type: voteType }),
      });
      if (!response.ok) throw new Error('Failed to vote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-submissions', id] });
    },
  });

  console.log('Vote mutation:', voteMutation); // Use to avoid unused warning

  // Check if user is in the session
  const currentUserParticipant = participants.find(p => p.user_id === user?.id);
  const isHost = session?.host_id === user?.id;
  const isContestant = currentUserParticipant?.role === 'contestant';

  // Auto-join session when component mounts
  useEffect(() => {
    if (session && user && !currentUserParticipant && !joinSessionMutation.isPending) {
      joinSessionMutation.mutate();
    }
  }, [session, user, currentUserParticipant]);

  // Camera and microphone setup
  useEffect(() => {
    if (currentUserParticipant && (isHost || isContestant)) {
      navigator.mediaDevices.getUserMedia({ 
        video: isVideoOn, 
        audio: !isMuted 
      })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(error => {
          console.error('Failed to get media access:', error);
        });
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [currentUserParticipant, isHost, isContestant, isVideoOn, isMuted]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendChatMutation.mutate(chatMessage.trim());
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'showcase': return 'from-purple-500 to-pink-500';
      case 'rivals': return 'from-red-500 to-orange-500';
      case 'playlisted': return 'from-green-500 to-blue-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Session not found</h2>
            <Link
              to="/live"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Back to Live Sessions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const colorClass = getSessionTypeColor(session.session_type);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/live"
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white">{session.title}</h1>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-sm font-medium">LIVE</span>
                </div>
                <span className="text-xs text-gray-400 capitalize bg-gray-700 px-2 py-1 rounded">
                  {session.session_type}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{session.description}</p>
              {session.theme && (
                <p className="text-yellow-400 text-xs">Theme: {session.theme}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-white text-sm">
                {participants.length}/{session.max_participants}
              </span>
            </div>
            
            {session.session_type === 'playlisted' && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>Submit Music</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          {session.session_type === 'rivals' ? (
            /* Rivals Layout - Two contestant videos */
            <div className="grid grid-cols-2 gap-4 h-full">
              {[1, 2].map((contestant) => (
                <div
                  key={contestant}
                  className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 flex flex-col items-center justify-center relative`}
                >
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    Contestant {contestant}
                  </div>
                  <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Video className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-white text-xl font-bold">Waiting for contestant...</h3>
                  <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium">
                    Join as Contestant
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Showcase/Playlisted Layout - Single host video */
            <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-8 h-full flex flex-col items-center justify-center relative`}>
              {isHost && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              
              {!isHost && (
                <>
                  <div className="w-48 h-48 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Video className="w-24 h-24 text-gray-400" />
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">Host Video</h2>
                  <p className="text-gray-200">
                    {session.session_type === 'showcase' 
                      ? 'Showcasing music and taking requests'
                      : 'Building the ultimate playlist together'
                    }
                  </p>
                </>
              )}
              
              {/* Live Controls for Host */}
              {isHost && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 rounded-full px-6 py-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-3 rounded-full transition-colors ${
                      !isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {isVideoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                  </button>
                  
                  <button
                    onClick={() => console.log('Settings clicked')}
                    className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button className="flex-1 px-4 py-3 text-yellow-400 border-b-2 border-yellow-400 font-medium">
              Chat
            </button>
            {(session.session_type === 'playlisted' || session.session_type === 'rivals') && (
              <button className="flex-1 px-4 py-3 text-gray-400 hover:text-white font-medium">
                Queue
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {message.user_id.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-300 text-sm font-medium">
                      User {message.user_id.slice(-4)}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-100 text-sm">{message.message_text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-800">
            <form onSubmit={handleSendChat} className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={!chatMessage.trim() || sendChatMutation.isPending}
                className="p-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            
            {/* Quick Reactions */}
            <div className="flex items-center justify-center space-x-4 mt-3">
              <button className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                <Heart className="w-4 h-4" />
                <span className="text-xs">Love</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-400 hover:text-orange-400 transition-colors">
                <Flame className="w-4 h-4" />
                <span className="text-xs">Fire</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-400 hover:text-yellow-400 transition-colors">
                <CrownIcon className="w-4 h-4" />
                <span className="text-xs">Crown</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Music Modal */}
      {showSubmitModal && (
        <SubmitMusicModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={(data) => submitMusicMutation.mutate(data)}
          isLoading={submitMusicMutation.isPending}
        />
      )}
    </div>
  );
}

// Submit Music Modal Component
interface SubmitMusicModalProps {
  onClose: () => void;
  onSubmit: (data: SubmitMusic) => void;
  isLoading: boolean;
}

function SubmitMusicModal({ onClose, onSubmit, isLoading }: SubmitMusicModalProps) {
  const [musicData, setMusicData] = useState<SubmitMusic>({
    music_title: '',
    artist_name: '',
    audio_url: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicData.music_title.trim()) return;
    onSubmit(musicData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Submit Music</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Song Title *
            </label>
            <input
              type="text"
              required
              value={musicData.music_title}
              onChange={(e) => setMusicData(prev => ({ ...prev, music_title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter song title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Artist Name
            </label>
            <input
              type="text"
              value={musicData.artist_name}
              onChange={(e) => setMusicData(prev => ({ ...prev, artist_name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter artist name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Audio URL (Spotify, YouTube, etc.)
            </label>
            <input
              type="url"
              value={musicData.audio_url}
              onChange={(e) => setMusicData(prev => ({ ...prev, audio_url: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!musicData.music_title.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
