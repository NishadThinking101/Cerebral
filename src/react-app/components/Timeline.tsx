import { forwardRef, useEffect, useRef, useState } from 'react';
import type { AudioFile } from '@/shared/types';
import type { Track } from '@/react-app/types/studio';

interface TimelineProps {
  currentTime: number;
  totalTime: number;
  zoom: number;
  tracks: Track[];
  onSeek: (time: number) => void;
  onTrackUpdate: (trackId: string, updates: any) => void;
  isPlaying: boolean;
}

interface AudioRegion {
  id: string;
  audioFile: AudioFile;
  startTime: number;
  duration: number;
  offset: number;
}

const Timeline = forwardRef<HTMLDivElement, TimelineProps>(({
  currentTime,
  totalTime,
  zoom,
  tracks,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<{ [trackId: string]: AudioRegion[] }>({});
  const [, setDraggedRegion] = useState<{ trackId: string; regionId: string } | null>(null);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = totalTime * pixelsPerSecond;
  const trackHeight = 80;

  // Initialize regions from audio files
  useEffect(() => {
    const newRegions: { [trackId: string]: AudioRegion[] } = {};
    
    tracks.forEach(track => {
      if (track.type === 'audio' && track.audioFiles.length > 0) {
        newRegions[track.id] = track.audioFiles.map((file, index) => ({
          id: `${track.id}-${file.id}`,
          audioFile: file,
          startTime: index * 30, // Stagger files by 30 seconds
          duration: file.duration_seconds || 30,
          offset: 0,
        }));
      }
    });
    
    setRegions(newRegions);
  }, [tracks]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / pixelsPerSecond);
    onSeek(Math.max(0, Math.min(totalTime, time)));
  };

  const handleRegionDrag = (trackId: string, regionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedRegion({ trackId, regionId });
    
    const startX = e.clientX;
    const region = regions[trackId]?.find(r => r.id === regionId);
    if (!region) return;
    
    const startTime = region.startTime;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / pixelsPerSecond;
      const newStartTime = Math.max(0, startTime + deltaTime);
      
      setRegions(prev => ({
        ...prev,
        [trackId]: prev[trackId]?.map(r => 
          r.id === regionId ? { ...r, startTime: newStartTime } : r
        ) || []
      }));
    };
    
    const handleMouseUp = () => {
      setDraggedRegion(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const interval = Math.max(1, Math.floor(10 / zoom)); // Adjust interval based on zoom
    
    for (let i = 0; i <= totalTime; i += interval) {
      const x = i * pixelsPerSecond;
      const minutes = Math.floor(i / 60);
      const seconds = Math.floor(i % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      markers.push(
        <div
          key={i}
          className="absolute top-0 bottom-0 border-l border-gray-700"
          style={{ left: x }}
        >
          <div className="absolute -top-6 -left-4 text-xs text-gray-400 bg-gray-900 px-1">
            {timeLabel}
          </div>
        </div>
      );
    }
    
    return markers;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Time Ruler */}
      <div className="h-8 bg-gray-800 border-b border-gray-700 relative overflow-hidden">
        <div 
          className="relative h-full"
          style={{ width: Math.max(timelineWidth, window.innerWidth) }}
        >
          {generateTimeMarkers()}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto">
        <div
          ref={timelineRef}
          className="relative cursor-crosshair"
          style={{ 
            width: Math.max(timelineWidth, window.innerWidth),
            height: tracks.length * trackHeight + 40 
          }}
          onClick={handleTimelineClick}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical lines (time) */}
            {Array.from({ length: Math.floor(totalTime) + 1 }, (_, i) => (
              <div
                key={`vline-${i}`}
                className="absolute top-0 bottom-0 border-l border-gray-800"
                style={{ left: i * pixelsPerSecond }}
              />
            ))}
            
            {/* Horizontal lines (tracks) */}
            {tracks.map((_, index) => (
              <div
                key={`hline-${index}`}
                className="absolute left-0 right-0 border-b border-gray-800"
                style={{ top: (index + 1) * trackHeight }}
              />
            ))}
          </div>

          {/* Track Lanes */}
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="absolute left-0 right-0 bg-gray-900/50 hover:bg-gray-800/30 transition-colors"
              style={{ 
                top: index * trackHeight,
                height: trackHeight,
              }}
            >
              {/* Track Regions */}
              {regions[track.id]?.map((region) => (
                <div
                  key={region.id}
                  className="absolute top-2 bottom-2 rounded cursor-move shadow-lg border-2 border-transparent hover:border-yellow-500/50 transition-all"
                  style={{
                    left: region.startTime * pixelsPerSecond,
                    width: region.duration * pixelsPerSecond,
                    backgroundColor: track.color + '40',
                    borderLeftColor: track.color,
                    borderLeftWidth: '4px',
                  }}
                  onMouseDown={(e) => handleRegionDrag(track.id, region.id, e)}
                >
                  <div className="h-full flex flex-col justify-center px-2">
                    <div className="text-xs font-medium text-white truncate">
                      {region.audioFile.filename}
                    </div>
                    <div className="text-xs text-gray-300">
                      {formatTime(region.duration)}
                    </div>
                  </div>
                  
                  {/* Waveform Placeholder */}
                  <div className="absolute bottom-1 left-2 right-2 h-6 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded opacity-60" />
                </div>
              ))}

              {/* MIDI Clips for MIDI tracks */}
              {track.type === 'midi' && (
                <div
                  className="absolute top-2 bottom-2 rounded cursor-move shadow-lg border-2 border-transparent hover:border-gray-400/50 transition-all"
                  style={{
                    left: 0,
                    width: 4 * pixelsPerSecond, // 4 second MIDI clip
                    backgroundColor: track.color + '20',
                    borderLeftColor: track.color,
                    borderLeftWidth: '4px',
                  }}
                >
                  <div className="h-full flex flex-col justify-center px-2">
                    <div className="text-xs font-medium text-white">
                      MIDI Clip
                    </div>
                    <div className="text-xs text-gray-300">
                      {track.instrument}
                    </div>
                  </div>
                  
                  {/* MIDI Notes Visualization */}
                  <div className="absolute inset-2 grid grid-cols-8 gap-px">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div 
                        key={i}
                        className={`rounded-sm ${
                          Math.random() > 0.7 ? 'bg-white/40' : 'bg-white/10'
                        }`}
                        style={{ height: `${20 + Math.random() * 40}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-lg pointer-events-none z-10"
            style={{ left: currentTime * pixelsPerSecond }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full shadow-lg" />
          </div>

          {/* Loop Markers */}
          <div className="absolute top-0 bottom-0 pointer-events-none">
            {/* Loop start */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-green-400 opacity-50"
              style={{ left: 0 }}
            />
            {/* Loop end */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-50"
              style={{ left: totalTime * pixelsPerSecond }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

Timeline.displayName = 'Timeline';

export default Timeline;
