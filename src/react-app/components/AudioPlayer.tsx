import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, SkipBack, SkipForward } from 'lucide-react';
import type { AudioFile } from '@/shared/types';

interface AudioPlayerProps {
  audioFile: AudioFile;
  onClose: () => void;
}

export default function AudioPlayer({ audioFile, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioFile]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <audio
        ref={audioRef}
        src={`/api/files/${encodeURIComponent(audioFile.file_key)}`}
        preload="metadata"
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* File Info */}
          <div className="min-w-0">
            <h3 className="text-white font-medium truncate">{audioFile.filename}</h3>
            <p className="text-gray-400 text-sm">{audioFile.file_type}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 flex-1 justify-center">
          <button
            onClick={() => skip(-10)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={() => skip(10)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Progress and Volume */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Time */}
          <div className="text-sm text-gray-400 min-w-[80px] text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      
    </div>
  );
}
