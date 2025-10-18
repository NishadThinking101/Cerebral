import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Upload, Music, DollarSign, Settings, 
  FileAudio, Image, Tag, Clock, Key as KeyIcon
} from 'lucide-react';
import type { CreateBeatListing } from '@/shared/types';

interface BeatListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BeatListingModal({ onClose, onSuccess }: BeatListingModalProps) {
  const [step, setStep] = useState<'files' | 'details' | 'pricing' | 'review'>('files');
  const [files, setFiles] = useState({
    audio: null as File | null,
    coverImage: null as File | null,
    audioFull: null as File | null,
    stems: null as File | null,
  });
  
  const [beatData, setBeatData] = useState<Partial<CreateBeatListing>>({
    title: '',
    description: '',
    basic_price_cents: 2999, // $29.99 default
    bpm: undefined,
    key_signature: '',
    genre: '',
    tags: [],
    has_lease_option: false,
    lease_price_cents: 4999, // $49.99 default
    lease_terms: 'Up to 10,000 streams, 2,000 sales, non-exclusive rights',
    has_exclusive_option: false,
    exclusive_price_cents: 19999, // $199.99 default
    license_terms: 'Standard beat license terms apply',
  });

  const [currentTag, setCurrentTag] = useState('');
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioFullInputRef = useRef<HTMLInputElement>(null);
  const stemsInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();

  const createListingMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/marketplace/beats/create', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Failed to create beat listing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      onSuccess();
      onClose();
    },
  });

  const handleFileSelect = (type: keyof typeof files, file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const addTag = () => {
    if (currentTag.trim() && beatData.tags && beatData.tags.length < 10) {
      setBeatData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (index: number) => {
    setBeatData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleSubmit = () => {
    if (!files.audio || !beatData.title || !beatData.basic_price_cents) return;

    const formData = new FormData();
    formData.append('audio', files.audio);
    if (files.coverImage) formData.append('coverImage', files.coverImage);
    if (files.audioFull) formData.append('audioFull', files.audioFull);
    if (files.stems) formData.append('stems', files.stems);
    
    // Add beat data
    Object.entries(beatData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    createListingMutation.mutate(formData);
  };

  const canProceed = () => {
    switch (step) {
      case 'files':
        return files.audio !== null;
      case 'details':
        return beatData.title && beatData.title.length > 0;
      case 'pricing':
        return beatData.basic_price_cents && beatData.basic_price_cents >= 99;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'files':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Upload Files</h3>
              <p className="text-gray-400 mb-6">Upload your beat files. Preview track is required, others are optional.</p>
            </div>

            {/* Audio Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio Preview * (30-60 seconds)
              </label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileSelect('audio', e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => audioInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
              >
                <FileAudio className="w-5 h-5" />
                <span>{files.audio ? files.audio.name : 'Choose audio preview'}</span>
              </button>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Image (Optional)
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect('coverImage', e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
              >
                <Image className="w-5 h-5" />
                <span>{files.coverImage ? files.coverImage.name : 'Choose cover image'}</span>
              </button>
            </div>

            {/* Full Audio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Audio Track (For paid downloads)
              </label>
              <input
                ref={audioFullInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileSelect('audioFull', e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => audioFullInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
              >
                <Music className="w-5 h-5" />
                <span>{files.audioFull ? files.audioFull.name : 'Choose full audio track'}</span>
              </button>
            </div>

            {/* Stems */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stems Package (ZIP file for exclusive buyers)
              </label>
              <input
                ref={stemsInputRef}
                type="file"
                accept=".zip,.rar"
                onChange={(e) => handleFileSelect('stems', e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => stemsInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>{files.stems ? files.stems.name : 'Choose stems package'}</span>
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Beat Details</h3>
              <p className="text-gray-400 mb-6">Add information about your beat to help buyers find it.</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={beatData.title}
                onChange={(e) => setBeatData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter beat title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={beatData.description}
                onChange={(e) => setBeatData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                placeholder="Describe your beat, style, instruments used, etc."
              />
            </div>

            {/* BPM and Key */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BPM
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={beatData.bpm || ''}
                    onChange={(e) => setBeatData(prev => ({ ...prev, bpm: parseInt(e.target.value) || undefined }))}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="120"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key
                </label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={beatData.key_signature}
                    onChange={(e) => setBeatData(prev => ({ ...prev, key_signature: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select key</option>
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={beatData.genre}
                onChange={(e) => setBeatData(prev => ({ ...prev, genre: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select genre</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="trap">Trap</option>
                <option value="drill">Drill</option>
                <option value="r&b">R&B</option>
                <option value="pop">Pop</option>
                <option value="afrobeats">Afrobeats</option>
                <option value="reggaeton">Reggaeton</option>
                <option value="electronic">Electronic</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (Max 10)
              </label>
              <div className="flex space-x-2 mb-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Add tag (e.g., dark, melodic, guitar)"
                  />
                </div>
                <button
                  onClick={addTag}
                  disabled={!currentTag.trim() || (beatData.tags?.length || 0) >= 10}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              
              {beatData.tags && beatData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {beatData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeTag(index)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Pricing & Licensing</h3>
              <p className="text-gray-400 mb-6">Set your prices and licensing options.</p>
            </div>

            {/* Basic License */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <h4 className="text-white font-medium">Basic License (Required)</h4>
              </div>
              <input
                type="number"
                min="0.99"
                step="0.01"
                value={(beatData.basic_price_cents || 0) / 100}
                onChange={(e) => setBeatData(prev => ({ 
                  ...prev, 
                  basic_price_cents: Math.round(parseFloat(e.target.value) * 100) 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="29.99"
              />
              <p className="text-xs text-gray-400 mt-1">MP3 file, up to 2,000 streams, 500 sales</p>
            </div>

            {/* Lease License */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-medium">Lease License (Optional)</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={beatData.has_lease_option}
                    onChange={(e) => setBeatData(prev => ({ ...prev, has_lease_option: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
              
              {beatData.has_lease_option && (
                <div className="space-y-3">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={(beatData.lease_price_cents || 0) / 100}
                    onChange={(e) => setBeatData(prev => ({ 
                      ...prev, 
                      lease_price_cents: Math.round(parseFloat(e.target.value) * 100) 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="49.99"
                  />
                  <textarea
                    value={beatData.lease_terms}
                    onChange={(e) => setBeatData(prev => ({ ...prev, lease_terms: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    placeholder="Lease terms and usage limits"
                  />
                  <p className="text-xs text-gray-400">MP3 & WAV files, up to 10,000 streams, 2,000 sales</p>
                </div>
              )}
            </div>

            {/* Exclusive License */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white font-medium">Exclusive License (Optional)</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={beatData.has_exclusive_option}
                    onChange={(e) => setBeatData(prev => ({ ...prev, has_exclusive_option: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
              
              {beatData.has_exclusive_option && (
                <div>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={(beatData.exclusive_price_cents || 0) / 100}
                    onChange={(e) => setBeatData(prev => ({ 
                      ...prev, 
                      exclusive_price_cents: Math.round(parseFloat(e.target.value) * 100) 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="199.99"
                  />
                  <p className="text-xs text-gray-400 mt-1">All files including stems, unlimited usage, exclusive rights</p>
                </div>
              )}
            </div>

            {/* License Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                General License Terms
              </label>
              <textarea
                value={beatData.license_terms}
                onChange={(e) => setBeatData(prev => ({ ...prev, license_terms: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                placeholder="Additional terms and conditions for beat usage"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Review & Publish</h3>
              <p className="text-gray-400 mb-6">Review your beat listing before publishing to the marketplace.</p>
            </div>

            {/* Summary */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Beat Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white">{beatData.title}</span>
                </div>
                {beatData.bpm && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">BPM:</span>
                    <span className="text-white">{beatData.bpm}</span>
                  </div>
                )}
                {beatData.key_signature && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Key:</span>
                    <span className="text-white">{beatData.key_signature}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Basic Price:</span>
                  <span className="text-white">{formatPrice(beatData.basic_price_cents || 0)}</span>
                </div>
                {beatData.has_lease_option && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lease Price:</span>
                    <span className="text-white">{formatPrice(beatData.lease_price_cents || 0)}</span>
                  </div>
                )}
                {beatData.has_exclusive_option && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exclusive Price:</span>
                    <span className="text-white">{formatPrice(beatData.exclusive_price_cents || 0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Files */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Files</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio Preview:</span>
                  <span className="text-white">{files.audio?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cover Image:</span>
                  <span className="text-white">{files.coverImage?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Full Audio:</span>
                  <span className="text-white">{files.audioFull?.name || 'Not uploaded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stems:</span>
                  <span className="text-white">{files.stems?.name || 'Not uploaded'}</span>
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-300">
                  I confirm that I own all rights to this beat and agree to Cerebral's 
                  <a href="#" className="text-yellow-400 hover:underline"> Terms of Service</a> and 
                  <a href="#" className="text-yellow-400 hover:underline"> Marketplace Guidelines</a>.
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">List Your Beat</h2>
              <p className="text-gray-400">Step {step === 'files' ? 1 : step === 'details' ? 2 : step === 'pricing' ? 3 : 4} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${step === 'files' ? 25 : step === 'details' ? 50 : step === 'pricing' ? 75 : 100}%` 
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex justify-between">
            <button
              onClick={() => {
                if (step === 'files') onClose();
                else if (step === 'details') setStep('files');
                else if (step === 'pricing') setStep('details');
                else setStep('pricing');
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {step === 'files' ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={() => {
                if (step === 'files') setStep('details');
                else if (step === 'details') setStep('pricing');
                else if (step === 'pricing') setStep('review');
                else handleSubmit();
              }}
              disabled={!canProceed() || createListingMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-black rounded-lg transition-colors"
            >
              {createListingMutation.isPending 
                ? 'Publishing...' 
                : step === 'review' 
                  ? 'Publish Beat' 
                  : 'Next'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
