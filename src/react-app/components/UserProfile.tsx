import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@getmocha/users-service/react';
import { 
  Edit, Camera, Music, Link2, MapPin, Globe, 
  Play, Pause, MessageCircle, UserPlus, UserMinus,
  Upload, Plus, X, ExternalLink
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import ProfileEditor from './ProfileEditor';
import MessageModal from './MessageModal';
import type { UserProfile, UserMedia, UserLink } from '@/shared/types';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function UserProfile({ userId, isOwnProfile = false }: UserProfileProps) {
  const { user } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<UserMedia | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showUploadMedia, setShowUploadMedia] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null as File | null,
    coverImage: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json() as Promise<UserProfile>;
    },
  });

  const { data: media = [] } = useQuery({
    queryKey: ['user-media', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/media`);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json() as Promise<UserMedia[]>;
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ['user-links', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/links`);
      if (!response.ok) throw new Error('Failed to fetch links');
      return response.json() as Promise<UserLink[]>;
    },
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ['is-following', userId],
    queryFn: async () => {
      if (!user || isOwnProfile) return false;
      const response = await fetch(`/api/users/${userId}/follow-status`);
      if (!response.ok) throw new Error('Failed to check follow status');
      const data = await response.json();
      return data.isFollowing;
    },
    enabled: !!user && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      const response = await fetch(`/api/users/${userId}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to ${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/users/media/upload', {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-media', userId] });
      setShowUploadMedia(false);
      setUploadData({ title: '', description: '', file: null, coverImage: null });
    },
  });

  const handleMediaUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title.trim()) return;

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    if (uploadData.coverImage) {
      formData.append('coverImage', uploadData.coverImage);
    }

    uploadMediaMutation.mutate(formData);
  };

  const handlePlayPause = (mediaId: string) => {
    if (currentlyPlaying === mediaId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(mediaId);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getLinkIcon = (linkType: string) => {
    switch (linkType) {
      case 'website': return Globe;
      case 'social': return Link2;
      default: return ExternalLink;
    }
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-700 rounded-lg mb-6" />
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Banner & Avatar Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg overflow-hidden">
          {profile.banner_file_key ? (
            <img 
              src={`/api/files/${encodeURIComponent(profile.banner_file_key)}`}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <div className="w-24 h-24 rounded-full border-4 border-gray-900 bg-gray-700 overflow-hidden">
            {profile.avatar_file_key ? (
              <img 
                src={`/api/files/${encodeURIComponent(profile.avatar_file_key)}`}
                alt="Profile avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <span className="text-black font-bold text-xl">
                  {user?.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Edit/Follow Button */}
        <div className="absolute top-4 right-4">
          {isOwnProfile ? (
            <button
              onClick={() => setShowEditor(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowMessages(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                title="Send Message"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => followMutation.mutate(isFollowing ? 'unfollow' : 'follow')}
                disabled={followMutation.isPending}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  isFollowing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black'
                }`}
              >
                {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-16 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {profile.display_name || user?.email || 'Unknown User'}
        </h1>
        
        {profile.bio && (
          <p className="text-gray-300 mb-4">{profile.bio}</p>
        )}

        <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
          {profile.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <span>{profile.followers_count || 0} followers</span>
            <span>{profile.following_count || 0} following</span>
          </div>
        </div>

        {/* Links */}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => {
              const Icon = getLinkIcon(link.link_type);
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.title}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Music Section */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Music className="w-5 h-5" />
            <span>Music</span>
          </h2>
          
          {isOwnProfile && (
            <button
              onClick={() => setShowUploadMedia(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Track</span>
            </button>
          )}
        </div>

        {media.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {isOwnProfile ? 'Upload your first track to get started' : 'No music uploaded yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {media.map((track) => (
              <div key={track.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  {/* Cover Art */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-600 flex-shrink-0">
                    {track.cover_image_key ? (
                      <img 
                        src={`/api/files/${encodeURIComponent(track.cover_image_key)}`}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{track.title}</h3>
                    {track.description && (
                      <p className="text-gray-400 text-sm truncate">{track.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      {track.duration_seconds && (
                        <span>{formatDuration(track.duration_seconds)}</span>
                      )}
                      <span>{track.play_count || 0} plays</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayPause(track.id)}
                    className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-full transition-colors"
                  >
                    {currentlyPlaying === track.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {selectedMedia && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-40">
          <AudioPlayer
            audioFile={{
              ...selectedMedia,
              filename: selectedMedia.title,
              file_key: selectedMedia.file_key,
              file_type: selectedMedia.file_type,
            } as any}
            onClose={() => setSelectedMedia(null)}
          />
        </div>
      )}

      {/* Upload Media Modal */}
      {showUploadMedia && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Upload Track</h3>
              <button
                onClick={() => setShowUploadMedia(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMediaUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>{uploadData.file ? uploadData.file.name : 'Choose audio file'}</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image (Optional)
                </label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{uploadData.coverImage ? uploadData.coverImage.name : 'Choose cover image'}</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Track title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadMedia(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadData.file || !uploadData.title.trim() || uploadMediaMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-black rounded-lg transition-colors"
                >
                  {uploadMediaMutation.isPending ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Editor Modal */}
      {showEditor && (
        <ProfileEditor
          profile={profile}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            setShowEditor(false);
            queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['user-links', userId] });
          }}
        />
      )}

      {/* Message Modal */}
      {showMessages && (
        <MessageModal
          recipientId={userId}
          recipientName={profile.display_name || 'User'}
          onClose={() => setShowMessages(false)}
        />
      )}
    </div>
  );
}
