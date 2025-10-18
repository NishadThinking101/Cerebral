import { useState, useEffect } from 'react';
import { X, Upload, Music, Image } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MarketplaceItem } from '@/shared/types';

interface BeatEditModalProps {
  beatId: string;
  onClose: () => void;
}

export default function BeatEditModal({ beatId, onClose }: BeatEditModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basic_price_cents: 0,
    bpm: '',
    key_signature: '',
    genre: '',
    tags: '',
    has_lease_option: false,
    lease_price_cents: 0,
    lease_terms: '',
    has_exclusive_option: false,
    exclusive_price_cents: 0,
    exclusive_terms: ''
  });

  const { data: beat, isLoading } = useQuery({
    queryKey: ['beat-details', beatId],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/${beatId}`);
      if (!response.ok) throw new Error('Failed to fetch beat details');
      return response.json() as Promise<MarketplaceItem>;
    },
  });

  useEffect(() => {
    if (beat) {
      setFormData({
        title: beat.title || '',
        description: beat.description || '',
        basic_price_cents: beat.price_cents || 0,
        bpm: beat.bpm?.toString() || '',
        key_signature: beat.key_signature || '',
        genre: beat.category || '',
        tags: beat.tags?.join(', ') || '',
        has_lease_option: !!beat.has_lease_option,
        lease_price_cents: beat.lease_price_cents || 0,
        lease_terms: beat.lease_terms || '',
        has_exclusive_option: !!beat.has_exclusive_option,
        exclusive_price_cents: beat.exclusive_price_cents || 0,
        exclusive_terms: beat.exclusive_terms || ''
      });
    }
  }, [beat]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'basic_price_cents' || name === 'lease_price_cents' || name === 'exclusive_price_cents') {
      // Convert dollar input to cents
      const dollarValue = parseFloat(value) || 0;
      setFormData(prev => ({ ...prev, [name]: Math.round(dollarValue * 100) }));
    } else if (name === 'bpm') {
      // Only allow numbers for BPM
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updateData = {
        title: formData.title,
        description: formData.description,
        price_cents: formData.basic_price_cents,
        bpm: formData.bpm ? parseInt(formData.bpm) : null,
        key_signature: formData.key_signature || null,
        category: formData.genre || null,
        tags: tagsArray,
        has_lease_option: formData.has_lease_option,
        lease_price_cents: formData.has_lease_option ? formData.lease_price_cents : null,
        lease_terms: formData.has_lease_option ? formData.lease_terms : null,
        has_exclusive_option: formData.has_exclusive_option,
        exclusive_price_cents: formData.has_exclusive_option ? formData.exclusive_price_cents : null,
        exclusive_terms: formData.has_exclusive_option ? formData.exclusive_terms : null
      };

      const response = await fetch(`/api/marketplace/beats/${beatId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update beat');
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['beat-details', beatId] });
      queryClient.invalidateQueries({ queryKey: ['my-beats'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      
      onClose();
    } catch (error) {
      console.error('Error updating beat:', error);
      alert('Failed to update beat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-40 bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Edit Beat</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Basic Price ($)</label>
                <input
                  type="number"
                  name="basic_price_cents"
                  value={(formData.basic_price_cents / 100).toFixed(2)}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Genre</option>
                  <option value="beat">Beat</option>
                  <option value="song">Song</option>
                  <option value="sample">Sample</option>
                  <option value="loop">Loop</option>
                  <option value="vocal">Vocal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">BPM</label>
                <input
                  type="text"
                  name="bpm"
                  value={formData.bpm}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Key Signature</label>
                <input
                  type="text"
                  name="key_signature"
                  value={formData.key_signature}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="has_lease_option"
                  name="has_lease_option"
                  checked={formData.has_lease_option}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_lease_option: e.target.checked }))}
                  className="w-4 h-4 text-yellow-500 bg-gray-800 border-gray-700 rounded focus:ring-yellow-500"
                />
                <label htmlFor="has_lease_option" className="ml-2 text-sm font-medium text-gray-300">
                  Offer Lease License
                </label>
              </div>

              {formData.has_lease_option && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Lease Price ($)</label>
                    <input
                      type="number"
                      name="lease_price_cents"
                      value={(formData.lease_price_cents / 100).toFixed(2)}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required={formData.has_lease_option}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Lease Terms</label>
                    <textarea
                      name="lease_terms"
                      value={formData.lease_terms}
                      onChange={handleChange}
                      rows={2}
                      required={formData.has_lease_option}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., Limited to 10,000 streams, credit required"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="has_exclusive_option"
                  name="has_exclusive_option"
                  checked={formData.has_exclusive_option}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_exclusive_option: e.target.checked }))}
                  className="w-4 h-4 text-yellow-500 bg-gray-800 border-gray-700 rounded focus:ring-yellow-500"
                />
                <label htmlFor="has_exclusive_option" className="ml-2 text-sm font-medium text-gray-300">
                  Offer Exclusive License
                </label>
              </div>

              {formData.has_exclusive_option && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Exclusive Price ($)</label>
                    <input
                      type="number"
                      name="exclusive_price_cents"
                      value={(formData.exclusive_price_cents / 100).toFixed(2)}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required={formData.has_exclusive_option}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Exclusive Terms</label>
                    <textarea
                      name="exclusive_terms"
                      value={formData.exclusive_terms}
                      onChange={handleChange}
                      rows={2}
                      required={formData.has_exclusive_option}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., Full ownership transfer, beat will be removed from marketplace"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}