import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, X, File, AlertCircle, HardDrive } from 'lucide-react';
import StorageUpgradeModal from './StorageUpgradeModal';

interface FileUploadProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FileUpload({ projectId, onClose, onSuccess }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageError, setStorageError] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/projects/${projectId}/audio/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setStorageError(null);
      onSuccess();
    },
    onError: (error: any) => {
      if (error.message.includes('Storage limit exceeded') || 
          (error.response && error.response.status === 413)) {
        // Handle storage limit error
        error.response?.json().then((errorData: any) => {
          setStorageError(errorData);
          setShowStorageModal(true);
        }).catch(() => {
          setStorageError({ 
            error: 'Storage limit exceeded',
            storage_exceeded: true 
          });
          setShowStorageModal(true);
        });
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('audio/') || 
      ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    for (const file of selectedFiles) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Upload Audio Files</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
            dragActive
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">
            Drag and drop audio files here
          </p>
          <p className="text-gray-400 text-sm mb-4">
            or click to browse your files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Selected Files</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadMutation.error && !storageError?.storage_exceeded && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">
                {uploadMutation.error.message}
              </p>
            </div>
          </div>
        )}

        {/* Storage Error Message */}
        {storageError?.storage_exceeded && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-yellow-400 text-sm font-medium mb-1">
                  Storage Limit Reached
                </p>
                <p className="text-gray-300 text-xs">
                  {storageError.details || 'Upgrade to Premium for 4TB of storage space.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-medium transition-all duration-200"
          >
            {uploadMutation.isPending ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
          </button>
        </div>
      </div>

      {/* Storage Upgrade Modal */}
      {showStorageModal && storageError && (
        <StorageUpgradeModal
          onClose={() => {
            setShowStorageModal(false);
            setStorageError(null);
          }}
          currentUsage={storageError.current_usage || 0}
          storageLimit={storageError.storage_limit || 536870912000}
          fileSize={storageError.file_size}
        />
      )}
    </div>
  );
}
