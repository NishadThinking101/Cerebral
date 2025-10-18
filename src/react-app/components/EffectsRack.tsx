import { useState } from 'react';
import { Settings, Power, Volume2, RotateCcw, Filter } from 'lucide-react';
import type { Track, Effect } from '@/react-app/types/studio';

interface EffectsRackProps {
  selectedTrack: string | null;
  tracks: Track[];
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
}

export default function EffectsRack({ selectedTrack, tracks, onTrackUpdate }: EffectsRackProps) {
  const [availableEffects] = useState([
    { id: 'reverb', name: 'Reverb', type: 'spatial', icon: Volume2 },
    { id: 'delay', name: 'Delay', type: 'temporal', icon: RotateCcw },
    { id: 'eq', name: 'EQ', type: 'frequency', icon: Filter },
    { id: 'compressor', name: 'Compressor', type: 'dynamics', icon: Settings },
    { id: 'distortion', name: 'Distortion', type: 'saturation', icon: Power },
    { id: 'chorus', name: 'Chorus', type: 'modulation', icon: Volume2 },
  ]);

  const selectedTrackData = selectedTrack ? tracks.find(t => t.id === selectedTrack) : null;
  const trackEffects = selectedTrackData?.effects || [];

  const addEffect = (effectType: string) => {
    if (!selectedTrack) return;

    const newEffect: Effect = {
      id: Date.now().toString(),
      name: availableEffects.find(e => e.id === effectType)?.name || effectType,
      type: effectType,
      enabled: true,
      parameters: getDefaultParameters(effectType),
    };

    const updatedEffects = [...trackEffects, newEffect];
    onTrackUpdate(selectedTrack, { effects: updatedEffects });
  };

  const updateEffect = (effectId: string, updates: Partial<Effect>) => {
    if (!selectedTrack) return;

    const updatedEffects = trackEffects.map(effect =>
      effect.id === effectId ? { ...effect, ...updates } : effect
    );
    onTrackUpdate(selectedTrack, { effects: updatedEffects });
  };

  const removeEffect = (effectId: string) => {
    if (!selectedTrack) return;

    const updatedEffects = trackEffects.filter(effect => effect.id !== effectId);
    onTrackUpdate(selectedTrack, { effects: updatedEffects });
  };

  const getDefaultParameters = (effectType: string): { [key: string]: number } => {
    switch (effectType) {
      case 'reverb':
        return { roomSize: 0.5, damping: 0.5, wetLevel: 0.3 };
      case 'delay':
        return { delayTime: 0.25, feedback: 0.3, wetLevel: 0.25 };
      case 'eq':
        return { lowGain: 0, midGain: 0, highGain: 0 };
      case 'compressor':
        return { threshold: -18, ratio: 4, attack: 5, release: 100 };
      case 'distortion':
        return { drive: 0.3, tone: 0.5, level: 0.7 };
      case 'chorus':
        return { rate: 0.5, depth: 0.3, mix: 0.5 };
      default:
        return { level: 0.5 };
    }
  };

  const renderEffectControls = (effect: Effect) => {
    const parameterNames = Object.keys(effect.parameters);
    
    return (
      <div className="space-y-2">
        {parameterNames.map((paramName) => (
          <div key={paramName}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="capitalize">{paramName.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span>{Math.round(effect.parameters[paramName] * 100)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effect.parameters[paramName]}
              onChange={(e) => updateEffect(effect.id, {
                parameters: {
                  ...effect.parameters,
                  [paramName]: parseFloat(e.target.value)
                }
              })}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-2">Effects Rack</h3>
        {selectedTrackData ? (
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTrackData.color }}
            />
            <span className="text-gray-300 text-sm">{selectedTrackData.name}</span>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Select a track to add effects</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedTrackData ? (
          <div className="p-4 text-center">
            <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">
              Select a track to view and edit its effects
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Current Effects */}
            {trackEffects.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Active Effects</h4>
                {trackEffects.map((effect, effectIndex) => {
                  const EffectIcon = availableEffects.find(e => e.id === effect.type)?.icon || Settings;
                  return (
                    <div key={effect.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <EffectIcon className="w-4 h-4 text-yellow-400" />
                          <span className="text-white text-sm font-medium">{effect.name}</span>
                          <span className="text-xs text-gray-500">#{effectIndex + 1}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateEffect(effect.id, { enabled: !effect.enabled })}
                            className={`p-1 rounded transition-colors ${
                              effect.enabled 
                                ? 'text-green-400 hover:text-green-300' 
                                : 'text-gray-500 hover:text-gray-400'
                            }`}
                            title={effect.enabled ? 'Disable' : 'Enable'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeEffect(effect.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      
                      {effect.enabled && renderEffectControls(effect)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Effects */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Add Effects</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableEffects.map((effect) => {
                  const Icon = effect.icon;
                  const isAdded = trackEffects.some(e => e.type === effect.id);
                  return (
                    <button
                      key={effect.id}
                      onClick={() => addEffect(effect.id)}
                      disabled={isAdded}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        isAdded
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{effect.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {effect.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Effect Chain Order */}
            {trackEffects.length > 1 && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Signal Chain</h4>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Input</span>
                  {trackEffects.map((effect) => (
                    <div key={effect.id} className="flex items-center space-x-2">
                      <span>→</span>
                      <span className={effect.enabled ? 'text-white' : 'text-gray-500'}>
                        {effect.name}
                      </span>
                    </div>
                  ))}
                  <span>→ Output</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
