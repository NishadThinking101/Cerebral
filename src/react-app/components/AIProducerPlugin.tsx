import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Brain, Wand2, Music, Loader2, Play, Download, X, Settings, Sparkles } from 'lucide-react';
import type { Track } from '@/react-app/types/studio';

interface AIProducerPluginProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: string | null;
  tracks: Track[];
  projectId: string;
  projectData: {
    bpm: number;
    keySignature: string;
    timeSignature: string;
  };
  onTrackGenerated: (newTrack: Track) => void;
}

interface GenerationRequest {
  type: 'analyze_rhythm' | 'generate_by_params' | 'generate_by_prompt';
  prompt?: string;
  trackId?: string;
  bpm?: number;
  keySignature?: string;
  genre?: string;
  length?: number;
  instruments?: string[];
}

export default function AIProducerPlugin({
  isOpen,
  onClose,
  selectedTrack,
  tracks,
  projectId,
  projectData,
  onTrackGenerated
}: AIProducerPluginProps) {
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate' | 'prompt'>('analyze');
  const [textPrompt, setTextPrompt] = useState('');
  const [generationParams, setGenerationParams] = useState({
    genre: 'electronic',
    bpm: projectData.bpm,
    keySignature: projectData.keySignature,
    length: 30,
    instruments: ['bass', 'drums', 'melody'],
  });
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);

  const generateMutation = useMutation({
    mutationFn: async (request: GenerationRequest) => {
      const response = await fetch(`/api/projects/${projectId}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to generate music');
      return response.json();
    },
    onSuccess: (result) => {
      setGeneratedResults(prev => [result, ...prev]);
    },
  });

  const selectedTrackData = selectedTrack ? tracks.find(t => t.id === selectedTrack) : null;

  const genres = [
    'electronic', 'hip-hop', 'rock', 'pop', 'jazz', 'classical',
    'ambient', 'house', 'techno', 'trap', 'r&b', 'country'
  ];

  const instruments = [
    'drums', 'bass', 'melody', 'harmony', 'lead', 'pad',
    'pluck', 'strings', 'brass', 'vocals', 'percussion'
  ];

  const handleAnalyzeRhythm = () => {
    if (!selectedTrack) return;
    
    generateMutation.mutate({
      type: 'analyze_rhythm',
      trackId: selectedTrack,
      bpm: projectData.bpm,
      keySignature: projectData.keySignature,
    });
  };

  const handleGenerateByParams = () => {
    generateMutation.mutate({
      type: 'generate_by_params',
      ...generationParams,
    });
  };

  const handleGenerateByPrompt = () => {
    if (!textPrompt.trim()) return;
    
    generateMutation.mutate({
      type: 'generate_by_prompt',
      prompt: textPrompt,
      bpm: projectData.bpm,
      keySignature: projectData.keySignature,
    });
  };

  const addToProject = (result: any) => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: result.title || 'AI Generated Track',
      type: 'audio',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      color: '#9d4edd',
      audioFiles: result.audioFiles || [],
      effects: [],
    };
    onTrackGenerated(newTrack);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl h-[80vh] shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Co-Producer</h2>
                <p className="text-gray-400">Powered by advanced music AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'analyze', label: 'Analyze & Extend', icon: Wand2 },
              { id: 'generate', label: 'Generate by Params', icon: Settings },
              { id: 'prompt', label: 'Text to Music', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Controls */}
          <div className="w-1/2 p-6 border-r border-gray-800">
            {activeTab === 'analyze' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Analyze & Extend Track</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    AI will analyze the rhythm and musical patterns of your selected track and generate complementary parts.
                  </p>
                </div>

                {selectedTrackData ? (
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedTrackData.color }}
                      />
                      <span className="text-white font-medium">{selectedTrackData.name}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedTrackData.audioFiles.length} audio file(s) • {selectedTrackData.type}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                    <div className="text-yellow-400 text-sm">
                      Select a track to analyze its rhythm and generate complementary parts.
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Generate
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Bass Line', 'Melody', 'Harmony', 'Drums', 'Percussion', 'Lead'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            defaultChecked={['Bass Line', 'Melody', 'Drums'].includes(type)}
                            className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-300">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeRhythm}
                    disabled={!selectedTrack || generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                    <span>{generateMutation.isPending ? 'Analyzing...' : 'Analyze & Generate'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Generate by Parameters</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Create music by specifying musical parameters like genre, tempo, and instruments.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre
                    </label>
                    <select
                      value={generationParams.genre}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, genre: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {genres.map((genre) => (
                        <option key={genre} value={genre} className="capitalize">
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        BPM
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="200"
                        value={generationParams.bpm}
                        onChange={(e) => setGenerationParams(prev => ({ ...prev, bpm: parseInt(e.target.value) }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Length (sec)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={generationParams.length}
                        onChange={(e) => setGenerationParams(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Instruments
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {instruments.map((instrument) => (
                        <label key={instrument} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={generationParams.instruments.includes(instrument)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGenerationParams(prev => ({
                                  ...prev,
                                  instruments: [...prev.instruments, instrument]
                                }));
                              } else {
                                setGenerationParams(prev => ({
                                  ...prev,
                                  instruments: prev.instruments.filter(i => i !== instrument)
                                }));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-300 capitalize">{instrument}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateByParams}
                    disabled={generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Music className="w-5 h-5" />
                    )}
                    <span>{generateMutation.isPending ? 'Generating...' : 'Generate Music'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'prompt' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Text to Music</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Describe the music you want and AI will generate it for you.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Describe your music
                    </label>
                    <textarea
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      placeholder="e.g., 'Upbeat electronic dance track with heavy bass and ethereal pads, perfect for a late night club scene'"
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white p-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-300 mb-2">Examples:</div>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div>"Chill lo-fi hip hop beat with jazz piano and vinyl crackle"</div>
                      <div>"Epic orchestral theme with powerful brass and soaring strings"</div>
                      <div>"Minimal techno track with hypnotic arpeggios and deep kick"</div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateByPrompt}
                    disabled={!textPrompt.trim() || generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <span>{generateMutation.isPending ? 'Creating...' : 'Generate from Text'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="w-1/2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Generated Results</h3>
              <div className="text-sm text-gray-400">
                {generatedResults.length} result{generatedResults.length !== 1 ? 's' : ''}
              </div>
            </div>

            {generateMutation.isPending && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                  <div className="text-white font-medium mb-2">AI is composing...</div>
                  <div className="text-gray-400 text-sm">This may take a few moments</div>
                </div>
              </div>
            )}

            {generateMutation.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <div className="text-red-400 text-sm">
                  {generateMutation.error.message}
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {generatedResults.map((result, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-white font-medium">{result.title || `Generated Track ${index + 1}`}</div>
                      <div className="text-xs text-gray-400">
                        {result.duration}s • {result.genre} • {result.bpm} BPM
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => addToProject(result)}
                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                        title="Add to Project"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {result.description && (
                    <div className="text-sm text-gray-400 mb-3">
                      {result.description}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {result.instruments?.map((instrument: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded"
                      >
                        {instrument}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {generatedResults.length === 0 && !generateMutation.isPending && (
              <div className="text-center py-16">
                <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <div className="text-gray-400">
                  No results yet. Use the controls on the left to generate music with AI.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
