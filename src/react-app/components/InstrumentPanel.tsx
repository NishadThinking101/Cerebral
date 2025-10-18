import { useState } from 'react';
import { Music, Piano, Volume2, Settings } from 'lucide-react';
import type { Track } from '@/react-app/types/studio';

interface InstrumentPanelProps {
  selectedTrack: string | null;
  tracks: Track[];
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
}

export default function InstrumentPanel({ selectedTrack, tracks, onTrackUpdate }: InstrumentPanelProps) {
  const [instrumentCategories] = useState([
    {
      name: 'Keyboards',
      instruments: [
        'Grand Piano', 'Electric Piano', 'Synth Lead', 'Synth Pad', 
        'Organ', 'Clavinet', 'Harpsichord'
      ]
    },
    {
      name: 'Synthesizers',
      instruments: [
        'Analog Lead', 'Digital Lead', 'Bass Synth', 'Arp Synth',
        'Vintage Synth', 'Modern Synth', 'Ambient Pad'
      ]
    },
    {
      name: 'Strings',
      instruments: [
        'String Ensemble', 'Violin Section', 'Cello Section', 'Chamber Strings',
        'Pizzicato Strings', 'Tremolo Strings'
      ]
    },
    {
      name: 'Brass',
      instruments: [
        'Trumpet Section', 'Saxophone', 'Trombone Section', 'French Horn',
        'Jazz Brass', 'Orchestra Brass'
      ]
    },
    {
      name: 'Bass',
      instruments: [
        'Electric Bass', 'Acoustic Bass', 'Synth Bass', 'Slap Bass',
        'Picked Bass', 'Fretless Bass'
      ]
    },
    {
      name: 'Drums & Percussion',
      instruments: [
        'Acoustic Kit', 'Electronic Kit', 'Hip Hop Kit', 'Jazz Kit',
        'Rock Kit', 'Vintage Kit', 'Percussion'
      ]
    }
  ]);

  const selectedTrackData = selectedTrack ? tracks.find(t => t.id === selectedTrack) : null;
  const isMidiTrack = selectedTrackData?.type === 'midi';

  const handleInstrumentChange = (instrument: string) => {
    if (!selectedTrack || !isMidiTrack) return;
    onTrackUpdate(selectedTrack, { instrument });
  };

  const renderInstrumentControls = () => {
    if (!selectedTrackData?.instrument) return null;

    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h4 className="text-white font-medium flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>{selectedTrackData.instrument} Controls</span>
        </h4>

        {/* Volume */}
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Volume</span>
            <span>{Math.round(selectedTrackData.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedTrackData.volume}
            onChange={(e) => onTrackUpdate(selectedTrack!, { volume: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Pan */}
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Pan</span>
            <span>
              {selectedTrackData.pan > 0 
                ? `R${Math.round(selectedTrackData.pan * 100)}` 
                : selectedTrackData.pan < 0 
                ? `L${Math.round(Math.abs(selectedTrackData.pan) * 100)}` 
                : 'Center'}
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={selectedTrackData.pan}
            onChange={(e) => onTrackUpdate(selectedTrack!, { pan: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Mock instrument-specific controls */}
        {selectedTrackData.instrument.includes('Piano') && (
          <div>
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Brightness</span>
              <span>50%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.5"
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {selectedTrackData.instrument.includes('Synth') && (
          <>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Cutoff</span>
                <span>70%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.7"
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Resonance</span>
                <span>30%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.3"
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </>
        )}

        {selectedTrackData.instrument.includes('Drums') && (
          <>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Room Size</span>
                <span>40%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.4"
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-2">Instruments</h3>
        {selectedTrackData ? (
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTrackData.color }}
            />
            <span className="text-gray-300 text-sm">{selectedTrackData.name}</span>
            <span className="text-xs text-gray-500">
              ({selectedTrackData.type.toUpperCase()})
            </span>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Select a MIDI track to choose instruments</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedTrackData ? (
          <div className="p-4 text-center">
            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">
              Select a MIDI track to browse and select instruments
            </p>
          </div>
        ) : !isMidiTrack ? (
          <div className="p-4 text-center">
            <Volume2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">
              Audio tracks don't use virtual instruments.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Create a MIDI track to use instruments
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Current Instrument */}
            {selectedTrackData.instrument && (
              <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Piano className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-medium">Current Instrument</span>
                </div>
                <p className="text-yellow-300 text-lg font-semibold">
                  {selectedTrackData.instrument}
                </p>
              </div>
            )}

            {/* Instrument Controls */}
            {renderInstrumentControls()}

            {/* Instrument Categories */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Available Instruments</h4>
              {instrumentCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h5 className="text-gray-300 text-sm font-medium">{category.name}</h5>
                  <div className="grid grid-cols-1 gap-1">
                    {category.instruments.map((instrument) => (
                      <button
                        key={instrument}
                        onClick={() => handleInstrumentChange(instrument)}
                        className={`p-2 text-left rounded transition-colors text-sm ${
                          selectedTrackData.instrument === instrument
                            ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                        }`}
                      >
                        {instrument}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Instrument Info */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">
                <p className="mb-1">💡 <strong>Tip:</strong> Try different instruments to find the perfect sound for your track.</p>
                <p>Use the controls above to adjust the instrument's parameters in real-time.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
