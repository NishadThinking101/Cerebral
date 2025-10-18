import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { CreateProject } from '@/shared/types';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProject>({
    title: '',
    description: '',
    bpm: 120,
    key_signature: 'C',
    time_signature: '4/4',
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProject) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
  };

  const keySignatures = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

  const timeSignatures = ['4/4', '3/4', '2/4', '6/8', '7/8', '5/4'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
              alt="Cerebral" 
              className="w-10 h-10 object-contain"
            />
            <h2 className="text-xl font-bold text-white">New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              placeholder="Optional project description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
                BPM
              </label>
              <input
                type="number"
                id="bpm"
                min="60"
                max="200"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-300 mb-2">
                Key
              </label>
              <select
                id="key"
                value={formData.key_signature}
                onChange={(e) => setFormData({ ...formData, key_signature: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                {keySignatures.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <select
                id="time"
                value={formData.time_signature}
                onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                {timeSignatures.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProjectMutation.isPending || !formData.title.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-all duration-200"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
