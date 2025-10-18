import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Mic, MicOff, Volume2, Settings, 
  UserPlus, Users, LogOut
} from 'lucide-react';
import { Link } from 'react-router';
import Navbar from '@/react-app/components/Navbar';
import SuiteParticipant from '@/react-app/components/SuiteParticipant';
import SuiteSettingsModal from '@/react-app/components/SuiteSettingsModal';
import ReportModal from '@/react-app/components/ReportModal';
import type { Suite, SuiteParticipant as SuiteParticipantType } from '@/shared/types';

export default function SuitePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const audioRef = useRef<MediaStream | null>(null);
  const queryClient = useQueryClient();

  const { data: suite, isLoading: suiteLoading } = useQuery({
    queryKey: ['suite', id],
    queryFn: async () => {
      const response = await fetch(`/api/suites/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Suite not found');
        if (response.status === 403) throw new Error('Access denied');
        throw new Error('Failed to fetch suite');
      }
      return response.json() as Promise<Suite>;
    },
    enabled: !!id && !!user,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['suite-participants', id],
    queryFn: async () => {
      const response = await fetch(`/api/suites/${id}/participants`);
      if (!response.ok) throw new Error('Failed to fetch participants');
      return response.json() as Promise<SuiteParticipantType[]>;
    },
    enabled: !!id && !!user,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const joinSuiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/suites/${id}/join`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to join suite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-participants', id] });
    },
  });

  const leaveSuiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/suites/${id}/leave`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to leave suite');
      return response.json();
    },
    onSuccess: () => {
      navigate('/suites');
    },
  });

  const updateParticipantMutation = useMutation({
    mutationFn: async ({ participantId, updates }: { participantId: string; updates: any }) => {
      const response = await fetch(`/api/suites/${id}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update participant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-participants', id] });
    },
  });

  const kickParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      const response = await fetch(`/api/suites/${id}/participants/${participantId}/kick`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to kick participant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-participants', id] });
    },
  });

  const banParticipantMutation = useMutation({
    mutationFn: async ({ participantId, reason }: { participantId: string; reason?: string }) => {
      const response = await fetch(`/api/suites/${id}/participants/${participantId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to ban participant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suite-participants', id] });
    },
  });

  // Check if user is in the suite
  const currentUserParticipant = participants.find(p => p.user_id === user?.id);
  const isHost = suite?.host_id === user?.id;
  const isAdmin = currentUserParticipant?.role === 'admin';
  const canModerate = isHost || isAdmin;

  // Auto-join suite when component mounts
  useEffect(() => {
    if (suite && user && !currentUserParticipant && !joinSuiteMutation.isPending) {
      joinSuiteMutation.mutate();
    }
  }, [suite, user, currentUserParticipant]);

  // Audio management
  useEffect(() => {
    if (currentUserParticipant && !isMuted) {
      // Request microphone access
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioRef.current = stream;
        })
        .catch(error => {
          console.error('Failed to get microphone access:', error);
          setIsMuted(true);
        });
    } else if (audioRef.current) {
      // Stop audio stream
      audioRef.current.getTracks().forEach(track => track.stop());
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentUserParticipant, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleMakeAdmin = (participantId: string) => {
    updateParticipantMutation.mutate({
      participantId,
      updates: { role: 'admin' }
    });
  };

  const handleRemoveAdmin = (participantId: string) => {
    updateParticipantMutation.mutate({
      participantId,
      updates: { role: 'participant' }
    });
  };

  const handleMuteParticipant = (participantId: string) => {
    updateParticipantMutation.mutate({
      participantId,
      updates: { is_muted: true }
    });
  };

  const handleKickParticipant = (participantId: string) => {
    kickParticipantMutation.mutate(participantId);
  };

  const handleBanParticipant = (participantId: string) => {
    banParticipantMutation.mutate({ participantId, reason: 'Banned by moderator' });
  };

  const handleReportUser = (userId: string) => {
    setReportUserId(userId);
    setShowReport(true);
  };

  const handleLeaveSuite = () => {
    leaveSuiteMutation.mutate();
  };

  if (suiteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Suite not found</h2>
            <Link
              to="/suites"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Back to Suites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminCount = participants.filter(p => p.role === 'admin').length;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/suites"
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white">{suite.title}</h1>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">LIVE</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">{suite.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-white text-sm">
                {participants.length}/{suite.max_participants}
              </span>
            </div>
            
            {isHost && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={handleLeaveSuite}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Participants Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {participants.map((participant) => (
              <SuiteParticipant
                key={participant.id}
                participant={participant}
                isCurrentUser={participant.user_id === user?.id}
                canModerate={canModerate && participant.user_id !== user?.id}
                onMute={() => handleMuteParticipant(participant.id)}
                onKick={() => handleKickParticipant(participant.id)}
                onBan={() => handleBanParticipant(participant.id)}
                onReport={() => handleReportUser(participant.user_id)}
                onMakeAdmin={() => handleMakeAdmin(participant.id)}
                onRemoveAdmin={() => handleRemoveAdmin(participant.id)}
                isHost={isHost}
                adminCount={adminCount}
              />
            ))}
            
            {/* Empty seats */}
            {Array.from({ length: suite.max_participants - participants.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center"
              >
                <UserPlus className="w-8 h-8 text-gray-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      {currentUserParticipant && (
        <div className="bg-gray-900 border-t border-gray-800 p-6">
          <div className="max-w-md mx-auto flex items-center justify-center space-x-6">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all duration-200 ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            
            <div className="text-center">
              <p className="text-white font-medium">
                {isMuted ? 'Muted' : 'Unmuted'}
              </p>
              <p className="text-gray-400 text-sm">
                {isSpeaking ? 'Speaking...' : 'Silent'}
              </p>
            </div>
            
            <button className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors">
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSettings && isHost && (
        <SuiteSettingsModal
          suite={suite}
          participants={participants}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['suite', id] });
            queryClient.invalidateQueries({ queryKey: ['suite-participants', id] });
          }}
        />
      )}

      {showReport && reportUserId && (
        <ReportModal
          suiteId={id!}
          reportedUserId={reportUserId}
          onClose={() => {
            setShowReport(false);
            setReportUserId(null);
          }}
          onSuccess={() => {
            setShowReport(false);
            setReportUserId(null);
          }}
        />
      )}
    </div>
  );
}
