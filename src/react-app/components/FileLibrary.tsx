import { useState } from 'react';
import { Upload, File, Play, Pause, Trash2, Download } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import type { AudioFile } from '@/shared/types';

interface FileLibraryProps {
  audioFiles: AudioFile[];
  onFileUpload: () => void;
  onFilesRefresh: () => void;
}

export default function FileLibrary({ audioFiles, onFileUpload, onFilesRefresh: _onFilesRefresh }: FileLibraryProps) {
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (file: AudioFile) => {
    if (playingFile === file.id) {
      setPlayingFile(null);
      setSelectedFile(null);
    } else {
      setPlayingFile(file.id);
      setSelectedFile(file);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Audio Library</h3>
          <button
            onClick={onFileUpload}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
        <p className="text-gray-400 text-sm">
          {audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {audioFiles.length === 0 ? (
          <div className="p-4 text-center">
            <File className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">
              No audio files yet. Upload some files to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {audioFiles.map((file) => (
              <div
                key={file.id}
                className={`p-3 rounded-lg transition-colors cursor-pointer ${
                  selectedFile?.id === file.id
                    ? 'bg-yellow-600/20 border border-yellow-600/50'
                    : 'hover:bg-gray-800/50'
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(file);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    {playingFile === file.id ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3 ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {file.filename}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                      <span>•</span>
                      <span>{formatDuration(file.duration_seconds)}</span>
                      <span>•</span>
                      <span className="truncate">{file.file_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Download functionality would go here
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete functionality would go here
                      }}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* File Preview/Waveform */}
                {selectedFile?.id === file.id && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="h-12 bg-gray-800 rounded flex items-center justify-center">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 32 }, (_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-full"
                            style={{
                              height: `${Math.random() * 80 + 20}%`,
                              opacity: Math.random() * 0.7 + 0.3,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {selectedFile && playingFile === selectedFile.id && (
        <div className="border-t border-gray-800 p-4">
          <AudioPlayer
            audioFile={selectedFile}
            onClose={() => {
              setSelectedFile(null);
              setPlayingFile(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
