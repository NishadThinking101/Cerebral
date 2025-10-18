import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings, Upload, Brain } from 'lucide-react';
import TrackList from './TrackList';
import Timeline from './Timeline';
import InstrumentPanel from './InstrumentPanel';
import EffectsRack from './EffectsRack';
import FileLibrary from './FileLibrary';
import AIProducerPlugin from './AIProducerPlugin';
import type { Project, AudioFile } from '@/shared/types';
import type { Track } from '@/react-app/types/studio';

interface StudioInterfaceProps {
  project: Project;
  audioFiles: AudioFile[];
  onFileUpload: () => void;
  onFilesRefresh: () => void;
}

export default function StudioInterface({ 
  project, 
  audioFiles, 
  onFileUpload, 
  onFilesRefresh 
}: StudioInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime] = useState(240); // 4 minutes default
  const [volume, setVolume] = useState(0.8);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAIProducer, setShowAIProducer] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Lead Vocal',
      type: 'audio',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: '#ffd700',
      audioFiles: audioFiles.filter(file => file.filename.toLowerCase().includes('vocal')),
    },
    {
      id: '2', 
      name: 'Piano',
      type: 'midi',
      volume: 0.7,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: '#c0c0c0',
      instrument: 'Grand Piano',
      audioFiles: [],
    },
    {
      id: '3',
      name: 'Drums',
      type: 'audio',
      volume: 0.9,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: '#fbbf24',
      audioFiles: audioFiles.filter(file => 
        file.filename.toLowerCase().includes('drum') || 
        file.filename.toLowerCase().includes('beat')
      ),
    },
  ]);

  const timelineRef = useRef<HTMLDivElement>(null);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const skipToStart = useCallback(() => {
    setCurrentTime(0);
  }, []);

  const skipToEnd = useCallback(() => {
    setCurrentTime(totalTime);
  }, [totalTime]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, []);

  const handleTimelineSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleTrackUpdate = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  }, []);

  const addTrack = useCallback((type: 'audio' | 'midi') => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: type === 'audio' ? 'Audio Track' : 'MIDI Track',
      type,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: type === 'audio' ? '#ffd700' : '#c0c0c0',
      audioFiles: [],
      ...(type === 'midi' && { instrument: 'Synth Lead' }),
    };
    setTracks(prev => [...prev, newTrack]);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Transport Controls */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={skipToStart}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={togglePlayback}
                className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>
              
              <button
                onClick={stopPlayback}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
              
              <button
                onClick={skipToEnd}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Time Display */}
            <div className="text-lg font-mono text-white bg-gray-800 px-4 py-2 rounded-lg">
              {formatTime(currentTime)} / {formatTime(totalTime)}
            </div>

            {/* Tempo & Key Info */}
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>{project.bpm} BPM</span>
              <span>•</span>
              <span>{project.key_signature}</span>
              <span>•</span>
              <span>{project.time_signature}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Master Volume */}
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="px-2 py-1 text-gray-400 hover:text-white text-sm"
              >
                -
              </button>
              <span className="text-xs text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                className="px-2 py-1 text-gray-400 hover:text-white text-sm"
              >
                +
              </button>
            </div>

            {/* Panel Toggles */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAIProducer(!showAIProducer)}
                className={`p-2 rounded-lg transition-colors group ${
                  showAIProducer 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="AI Co-Producer"
              >
                <Brain className={`w-4 h-4 ${!showAIProducer ? 'group-hover:animate-pulse' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className={`p-2 rounded-lg transition-colors ${
                  showLibrary 
                    ? 'bg-yellow-600 text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Upload className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowInstruments(!showInstruments)}
                className={`p-2 rounded-lg transition-colors ${
                  showInstruments 
                    ? 'bg-yellow-600 text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowEffects(!showEffects)}
                className={`p-2 rounded-lg transition-colors ${
                  showEffects 
                    ? 'bg-yellow-600 text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex">
        {/* Track List */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Tracks</h2>
              <div className="flex space-x-1">
                <button
                  onClick={() => addTrack('audio')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-black text-sm rounded transition-colors"
                  title="Add Audio Track"
                >
                  Audio
                </button>
                <button
                  onClick={() => addTrack('midi')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  title="Add MIDI Track"
                >
                  MIDI
                </button>
              </div>
            </div>
          </div>
          
          <TrackList
            tracks={tracks}
            selectedTrack={selectedTrack}
            onTrackSelect={setSelectedTrack}
            onTrackUpdate={handleTrackUpdate}
            audioFiles={audioFiles}
          />
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col">
          <Timeline
            ref={timelineRef}
            currentTime={currentTime}
            totalTime={totalTime}
            zoom={zoom}
            tracks={tracks}
            onSeek={handleTimelineSeek}
            onTrackUpdate={handleTrackUpdate}
            isPlaying={isPlaying}
          />
        </div>

        {/* Side Panels */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
          {showLibrary && (
            <FileLibrary
              audioFiles={audioFiles}
              onFileUpload={onFileUpload}
              onFilesRefresh={onFilesRefresh}
            />
          )}
          
          {showInstruments && (
            <InstrumentPanel
              selectedTrack={selectedTrack}
              tracks={tracks}
              onTrackUpdate={handleTrackUpdate}
            />
          )}
          
          {showEffects && (
            <EffectsRack
              selectedTrack={selectedTrack}
              tracks={tracks}
              onTrackUpdate={handleTrackUpdate}
            />
          )}
        </div>
      </div>

      {/* AI Co-Producer Plugin */}
      <AIProducerPlugin
        isOpen={showAIProducer}
        onClose={() => setShowAIProducer(false)}
        selectedTrack={selectedTrack}
        tracks={tracks}
        projectId={project.id}
        projectData={{
          bpm: project.bpm,
          keySignature: project.key_signature,
          timeSignature: project.time_signature,
        }}
        onTrackGenerated={(newTrack) => {
          setTracks(prev => [...prev, newTrack]);
          setShowAIProducer(false);
        }}
      />
    </div>
  );
}
