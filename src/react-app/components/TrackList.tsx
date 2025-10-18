import { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Music, AudioWaveform, MoreVertical, Eye } from 'lucide-react';
import type { AudioFile } from '@/shared/types';
import type { Track } from '@/react-app/types/studio';

interface TrackListProps {
  tracks: Track[];
  selectedTrack: string | null;
  onTrackSelect: (trackId: string | null) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  audioFiles: AudioFile[];
}

export default function TrackList({ 
  tracks, 
  selectedTrack, 
  onTrackSelect, 
  onTrackUpdate,
  audioFiles 
}: TrackListProps) {
  const [draggedFile, setDraggedFile] = useState<AudioFile | null>(null);

  const handleDragStart = (file: AudioFile) => {
    setDraggedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    if (draggedFile) {
      const track = tracks.find(t => t.id === trackId);
      if (track && track.type === 'audio') {
        const updatedFiles = [...track.audioFiles, draggedFile];
        onTrackUpdate(trackId, { audioFiles: updatedFiles });
      }
    }
    setDraggedFile(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {tracks.map((track) => (
        <div
          key={track.id}
          className={`border-b border-gray-800 ${
            selectedTrack === track.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'
          } transition-colors cursor-pointer`}
          onClick={() => onTrackSelect(selectedTrack === track.id ? null : track.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, track.id)}
        >
          <div className="p-4">
            {/* Track Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <div className="flex items-center space-x-1">
                  {track.type === 'audio' ? (
                    <AudioWaveform className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Music className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-white font-medium text-sm">{track.name}</span>
                </div>
              </div>
              
              <button className="text-gray-400 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Track Controls */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {/* Mute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackUpdate(track.id, { muted: !track.muted });
                }}
                className={`p-2 rounded transition-colors ${
                  track.muted 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
                title="Mute"
              >
                {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>

              {/* Solo */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackUpdate(track.id, { solo: !track.solo });
                }}
                className={`p-2 rounded transition-colors ${
                  track.solo 
                    ? 'bg-yellow-600 text-black' 
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
                title="Solo"
              >
                <Eye className="w-3 h-3" />
              </button>

              {/* Arm */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackUpdate(track.id, { armed: !track.armed });
                }}
                className={`p-2 rounded transition-colors ${
                  track.armed 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:text-white'
                }`}
                title="Record Arm"
              >
                {track.armed ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              </button>

              {/* Monitor */}
              <button
                className="p-2 bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
                title="Monitor"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Volume</span>
                <span>{Math.round(track.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={track.volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onTrackUpdate(track.id, { volume: parseFloat(e.target.value) });
                }}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Pan Control */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Pan</span>
                <span>{track.pan > 0 ? `R${Math.round(track.pan * 100)}` : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : 'C'}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={track.pan}
                onChange={(e) => {
                  e.stopPropagation();
                  onTrackUpdate(track.id, { pan: parseFloat(e.target.value) });
                }}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Instrument Info */}
            {track.type === 'midi' && track.instrument && (
              <div className="bg-gray-800 rounded p-2 mb-2">
                <div className="text-xs text-gray-400 mb-1">Instrument</div>
                <div className="text-sm text-white">{track.instrument}</div>
              </div>
            )}

            {/* Audio Files */}
            {track.type === 'audio' && track.audioFiles.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Audio Files</div>
                {track.audioFiles.slice(0, 3).map((file) => (
                  <div
                    key={file.id}
                    className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 truncate"
                  >
                    {file.filename}
                  </div>
                ))}
                {track.audioFiles.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{track.audioFiles.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Available Files for Dragging */}
      {audioFiles.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Drag files to tracks:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {audioFiles.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={() => handleDragStart(file)}
                className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 cursor-move hover:bg-gray-700 transition-colors truncate"
              >
                {file.filename}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
