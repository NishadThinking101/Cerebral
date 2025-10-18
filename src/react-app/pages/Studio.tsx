import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Clock, Music, Play, HardDrive } from 'lucide-react';
import Navbar from '@/react-app/components/Navbar';
import CreateProjectModal from '@/react-app/components/CreateProjectModal';
import StorageWarning from '@/react-app/components/StorageWarning';
import type { Project, User } from '@/shared/types';

export default function Studio() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStorageWarning, setShowStorageWarning] = useState(true);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json() as Promise<Project[]>;
    },
    enabled: !!user,
  });

  const { data: userData } = useQuery({
    queryKey: ['user-data'],
    queryFn: async () => {
      const response = await fetch('/api/users/me');
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json() as Promise<User>;
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStorageUsage = () => {
    if (!userData) {
      // Default values for new users
      const used = 0;
      const total = 536870912000; // 500GB in bytes
      const percentage = (used / total) * 100;
      return { used, total, percentage };
    }
    
    const used = userData.storage_used_bytes || 0;
    const total = userData.storage_limit_bytes || 536870912000; // 500GB default
    const percentage = (used / total) * 100;
    return { used, total, percentage };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storage = getStorageUsage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Warning */}
        {userData && showStorageWarning && (
          <div className="mb-6">
            <StorageWarning
              storageUsed={userData.storage_used_bytes || 0}
              storageLimit={userData.storage_limit_bytes || 536870912000}
              onClose={() => setShowStorageWarning(false)}
              showUpgrade={true}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Studio</h1>
            <p className="text-gray-300">Create, collaborate, and produce amazing music</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Storage indicator */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Storage Used</span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatBytes(storage.used)} / {formatBytes(storage.total)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storage.percentage >= 95 
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : storage.percentage >= 80
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{ width: `${Math.min(storage.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {storage.percentage.toFixed(1)}% used
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              <Plus className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-6 animate-pulse">
                <div className="w-full h-32 bg-gray-700 rounded-lg mb-4" />
                <div className="h-4 bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <img 
                src="https://mocha-cdn.com/0199f788-8c7c-76ff-9653-8d77884ee60e/cerebral.jpg" 
                alt="Cerebral" 
                className="w-12 h-12 object-contain opacity-60"
              />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start creating your first music project and bring your ideas to life in our professional studio environment.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-8 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200 border border-gray-700/50 hover:border-yellow-500/50 group"
              >
                <div className="relative mb-4">
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-yellow-600/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Music className="w-12 h-12 text-yellow-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 truncate">
                  {project.title}
                </h3>
                
                {project.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(project.updated_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{project.bpm} BPM</span>
                    <span>•</span>
                    <span>{project.key_signature}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      )}
    </div>
  );
}
