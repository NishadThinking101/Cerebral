import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Camera, Plus, Trash2, ExternalLink, Globe, Link2 } from 'lucide-react';
import type { UserProfile } from '@/shared/types';

interface ProfileEditorProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditor({ profile, onClose, onSave }: ProfileEditorProps) {
  const [profileData, setProfileData] = useState({
    bio: profile.bio || '',
    location: profile.location || '',
    website_url: profile.website_url || '',
  });
  
  const [links, setLinks] = useState<Array<{ id?: string; title: string; url: string; link_type: string }>>([]);
  const [newLink, setNewLink] = useState({ title: '', url: '', link_type: 'custom' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: data,
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      onSave();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('bio', profileData.bio);
    formData.append('location', profileData.location);
    formData.append('website_url', profileData.website_url);
    formData.append('links', JSON.stringify(links));
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    if (bannerFile) {
      formData.append('banner', bannerFile);
    }
    
    updateProfileMutation.mutate(formData);
  };

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setLinks(prev => [...prev, { ...newLink }]);
      setNewLink({ title: '', url: '', link_type: 'custom' });
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const getLinkIcon = (linkType: string) => {
    switch (linkType) {
      case 'website': return Globe;
      case 'social': return Link2;
      default: return ExternalLink;
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden">
                {avatarFile ? (
                  <img 
                    src={URL.createObjectURL(avatarFile)}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.avatar_file_key ? (
                  <img 
                    src={`/api/files/${encodeURIComponent(profile.avatar_file_key)}`}
                    alt="Current avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-black" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Change Picture</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Banner Image
            </label>
            <div className="space-y-2">
              {(bannerFile || profile.banner_file_key) && (
                <div className="w-full h-32 rounded-lg overflow-hidden">
                  {bannerFile ? (
                    <img 
                      src={URL.createObjectURL(bannerFile)}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={`/api/files/${encodeURIComponent(profile.banner_file_key!)}`}
                      alt="Current banner"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>{bannerFile || profile.banner_file_key ? 'Change Banner' : 'Upload Banner'}</span>
              </button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              placeholder="Tell others about yourself..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {profileData.bio.length}/500 characters
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, Country"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={profileData.website_url}
              onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Social Links
            </label>
            
            {/* Existing Links */}
            {links.length > 0 && (
              <div className="space-y-2 mb-4">
                {links.map((link, index) => {
                  const Icon = getLinkIcon(link.link_type);
                  return (
                    <div key={index} className="flex items-center space-x-2 bg-gray-700 rounded-lg p-3">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{link.title}</div>
                        <div className="text-gray-400 text-xs truncate">{link.url}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Link */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={newLink.link_type}
                    onChange={(e) => setNewLink(prev => ({ ...prev, link_type: e.target.value }))}
                    className="bg-gray-600 border border-gray-500 rounded-lg text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="custom">Custom</option>
                    <option value="website">Website</option>
                    <option value="social">Social</option>
                  </select>
                  
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Link title"
                    className="bg-gray-600 border border-gray-500 rounded-lg text-white p-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="bg-gray-600 border border-gray-500 rounded-lg text-white p-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={addLink}
                  disabled={!newLink.title || !newLink.url || !validateUrl(newLink.url)}
                  className="w-full bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 text-black rounded-lg font-medium transition-colors"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
