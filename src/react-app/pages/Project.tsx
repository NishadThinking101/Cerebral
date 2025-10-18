import { useParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Link } from 'react-router';
import Navbar from '@/react-app/components/Navbar';
import StudioInterface from '@/react-app/components/StudioInterface';
import FileUpload from '@/react-app/components/FileUpload';
import type { Project, AudioFile } from '@/shared/types';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'studio' | 'simple'>('studio');
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json() as Promise<Project>;
    },
    enabled: !!id && !!user,
  });

  const { data: audioFiles = [] } = useQuery({
    queryKey: ['audio-files', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}/audio`);
      if (!response.ok) throw new Error('Failed to fetch audio files');
      return response.json() as Promise<AudioFile[]>;
    },
    enabled: !!id && !!user,
  });

  const refreshFiles = () => {
    queryClient.invalidateQueries({ queryKey: ['audio-files', id] });
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
            <Link
              to="/studio"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Return to Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      <Navbar />
      
      {viewMode === 'studio' ? (
        <StudioInterface
          project={project}
          audioFiles={audioFiles}
          onFileUpload={() => setShowUpload(true)}
          onFilesRefresh={refreshFiles}
        />
      ) : (
        <div className="flex-1">
          {/* Simple View - Original Project View */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Link
                  to="/studio"
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-400 mt-1">
                    <span>{project.bpm} BPM</span>
                    <span>•</span>
                    <span>{project.key_signature}</span>
                    <span>•</span>
                    <span>{project.time_signature}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setViewMode('studio')}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                  title="Switch to Studio View"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rest of simple view content */}
            <div className="text-center py-16">
              <div className="text-white text-lg mb-4">
                Switch to Studio View for full DAW capabilities
              </div>
              <button
                onClick={() => setViewMode('studio')}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Open Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          projectId={id!}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            refreshFiles();
          }}
        />
      )}
    </div>
  );
}
