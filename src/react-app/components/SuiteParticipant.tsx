import { useState } from 'react';
import { 
  Crown, Shield, Mic, MicOff, Volume2, MoreVertical, 
  UserMinus, Ban, Flag, UserCheck, VolumeX 
} from 'lucide-react';
import type { SuiteParticipant as SuiteParticipantType } from '@/shared/types';

interface SuiteParticipantProps {
  participant: SuiteParticipantType;
  isCurrentUser: boolean;
  canModerate: boolean;
  onMute: () => void;
  onKick: () => void;
  onBan: () => void;
  onReport: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
  isHost: boolean;
  adminCount: number;
}

export default function SuiteParticipant({
  participant,
  isCurrentUser,
  canModerate,
  onMute,
  onKick,
  onBan,
  onReport,
  onMakeAdmin,
  onRemoveAdmin,
  isHost,
  adminCount,
}: SuiteParticipantProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isParticipantHost = participant.role === 'host';
  const isParticipantAdmin = participant.role === 'admin';
  const canPromoteToAdmin = isHost && !isParticipantHost && !isParticipantAdmin && adminCount < 3;
  const canDemoteAdmin = isHost && isParticipantAdmin;

  return (
    <div className="relative">
      <div className={`aspect-square bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center relative transition-all duration-200 ${
        participant.is_speaking ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/25' : ''
      } ${
        isCurrentUser ? 'ring-2 ring-yellow-400' : ''
      }`}>
        
        {/* Role Badge */}
        <div className="absolute top-2 left-2">
          {isParticipantHost && (
            <div className="bg-yellow-500 text-black p-1 rounded-full" title="Host">
              <Crown className="w-3 h-3" />
            </div>
          )}
          {isParticipantAdmin && (
            <div className="bg-blue-500 text-white p-1 rounded-full" title="Admin">
              <Shield className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Menu Button */}
        {!isCurrentUser && (canModerate || !isParticipantHost) && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full transition-colors"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-10">
                {canModerate && (
                  <>
                    <button
                      onClick={() => {
                        onMute();
                        setShowMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>Mute</span>
                    </button>
                    
                    {canPromoteToAdmin && (
                      <button
                        onClick={() => {
                          onMakeAdmin();
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 hover:text-blue-300 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Make Admin</span>
                      </button>
                    )}

                    {canDemoteAdmin && (
                      <button
                        onClick={() => {
                          onRemoveAdmin();
                          setShowMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Remove Admin</span>
                      </button>
                    )}

                    <div className="border-t border-gray-700 my-1" />
                    
                    <button
                      onClick={() => {
                        onKick();
                        setShowMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-orange-400 hover:bg-gray-700 hover:text-orange-300 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Kick</span>
                    </button>

                    <button
                      onClick={() => {
                        onBan();
                        setShowMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Ban User</span>
                    </button>
                  </>
                )}

                {/* Non-moderators can still report */}
                {!canModerate && !isParticipantHost && (
                  <button
                    onClick={() => {
                      onReport();
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
          <span className="text-white font-bold text-lg">
            {participant.user_id.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Info */}
        <div className="text-center">
          <p className="text-white text-sm font-medium truncate max-w-full">
            User {participant.user_id.slice(-4)}
          </p>
          {isCurrentUser && (
            <p className="text-yellow-400 text-xs">You</p>
          )}
        </div>

        {/* Audio Status */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          {participant.is_muted ? (
            <div className="bg-red-500 p-1 rounded-full" title="Muted">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="bg-green-500 p-1 rounded-full" title="Unmuted">
              <Mic className="w-3 h-3 text-white" />
            </div>
          )}
          
          <div className="bg-gray-600 p-1 rounded-full" title="Speaker">
            <Volume2 className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Speaking Indicator */}
        {participant.is_speaking && (
          <div className="absolute inset-0 bg-green-400/10 rounded-xl pointer-events-none" />
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
