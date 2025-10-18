import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, Play, Pause, Star, Download, Heart, Share2, 
  Clock, Music, Key, Zap, Shield, Crown, Volume2
} from 'lucide-react';
import type { MarketplaceItem, BeatReview } from '@/shared/types';

interface BeatDetailsModalProps {
  beatId: string;
  onClose: () => void;
  onPurchase: (item: MarketplaceItem, licenseType: 'basic' | 'lease' | 'exclusive') => void;
}

export default function BeatDetailsModal({ beatId, onClose, onPurchase }: BeatDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<'basic' | 'lease' | 'exclusive'>('basic');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: beat } = useQuery({
    queryKey: ['beat-details', beatId],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/${beatId}`);
      if (!response.ok) throw new Error('Failed to fetch beat details');
      return response.json() as Promise<MarketplaceItem>;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['beat-reviews', beatId],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/${beatId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json() as Promise<BeatReview[]>;
    },
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !beat?.audio_preview_key) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const getLicensePrice = () => {
    if (!beat) return 0;
    
    switch (selectedLicense) {
      case 'lease':
        return beat.lease_price_cents;
      case 'exclusive':
        return beat.exclusive_price_cents;
      default:
        return beat.price_cents;
    }
  };

  const getLicenseFeatures = () => {
    switch (selectedLicense) {
      case 'lease':
        return [
          'MP3 & WAV files',
          'Up to 10,000 streams',
          'Up to 2,000 sales',
          'Music videos allowed',
          'Non-exclusive rights'
        ];
      case 'exclusive':
        return [
          'MP3, WAV & stems',
          'Unlimited streams & sales',
          'Full commercial rights',
          'Producer tag removal',
          'Exclusive ownership'
        ];
      default:
        return [
          'MP3 file only',
          'Up to 2,000 streams',
          'Up to 500 sales',
          'Non-exclusive rights',
          'Producer tag included'
        ];
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  if (!beat) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-700 rounded mb-4" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{beat.title}</h2>
              <p className="text-gray-400">by Producer Name</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Column - Beat Info & Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Art & Player */}
            <div className="relative">
              {beat.cover_image_url ? (
                <img
                  src={beat.cover_image_url}
                  alt={beat.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <Music className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black p-4 rounded-full transition-colors shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>
              </div>

              {/* Waveform/Progress Bar */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center space-x-3 text-white text-sm mb-2">
                    <Volume2 className="w-4 h-4" />
                    <span>{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Beat Details */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Beat Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {beat.bpm && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">{beat.bpm}</div>
                      <div className="text-gray-400 text-xs">BPM</div>
                    </div>
                  </div>
                )}
                
                {beat.key_signature && (
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{beat.key_signature}</div>
                      <div className="text-gray-400 text-xs">Key</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-white font-medium capitalize">{beat.category}</div>
                    <div className="text-gray-400 text-xs">Genre</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <div>
                    <div className="text-white font-medium">{averageRating.toFixed(1)}</div>
                    <div className="text-gray-400 text-xs">{reviews.length} reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {beat.description && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{beat.description}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p className="text-gray-400">No reviews yet. Be the first to review this beat!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified_purchase && (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      {review.review_text && (
                        <p className="text-gray-300 text-sm">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Licensing */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Choose License</h3>
              
              {/* License Options */}
              <div className="space-y-3">
                {/* Basic License */}
                <div
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedLicense === 'basic'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLicense('basic')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Basic License</span>
                    </div>
                    <span className="text-white font-bold">{formatPrice(beat.price_cents)}</span>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {getLicenseFeatures().map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>

                {/* Lease License */}
                {beat.has_lease_option && (
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedLicense === 'lease'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedLicense('lease')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">Lease License</span>
                      </div>
                      <span className="text-white font-bold">{formatPrice(beat.lease_price_cents)}</span>
                    </div>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {getLicenseFeatures().map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusive License */}
                {beat.has_exclusive_option && (
                  <div
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedLicense === 'exclusive'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedLicense('exclusive')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">Exclusive License</span>
                      </div>
                      <span className="text-white font-bold">{formatPrice(beat.exclusive_price_cents)}</span>
                    </div>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {getLicenseFeatures().map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => onPurchase(beat, selectedLicense)}
                className="w-full mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Purchase for {formatPrice(getLicensePrice())}</span>
              </button>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-3">
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Producer Info */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Producer</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">P</span>
                </div>
                <div>
                  <div className="text-white font-medium">Producer Name</div>
                  <div className="text-gray-400 text-sm">125 beats sold</div>
                </div>
              </div>
              <button className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        {beat.audio_preview_key && (
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={`/api/files/${encodeURIComponent(beat.audio_preview_key)}`} type="audio/mpeg" />
          </audio>
        )}
      </div>
    </div>
  );
}
