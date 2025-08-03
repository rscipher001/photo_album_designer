import { useState, useRef } from 'react';
import { useImageBrowser, useImageUpload } from '../../hooks/useImages';
import type { ImageFile, Directory } from '../../types';

interface ImageBrowserProps {
  onImageSelect?: (image: ImageFile) => void;
  className?: string;
}

export function ImageBrowser({ onImageSelect, className = '' }: ImageBrowserProps) {
  const [currentPath, setCurrentPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data, isLoading, error } = useImageBrowser(currentPath);
  const uploadMutation = useImageUpload();

  const handleDirectoryClick = (directory: Directory) => {
    const newPath = directory.path;
    setCurrentPath(newPath);
  };

  const handleBackClick = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const handleImageClick = (image: ImageFile) => {
    if (onImageSelect) {
      onImageSelect(image);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-red-600 text-center">
          Failed to load images
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {currentPath && (
            <button
              onClick={handleBackClick}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="text-sm text-gray-600">
            {currentPath || 'Root'}
          </span>
        </div>
        
        <button
          onClick={handleUploadClick}
          disabled={uploadMutation.isPending}
          className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded text-sm"
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Directory listing */}
      {data && (
        <div className="space-y-4 max-h-full overflow-y-auto">
          {/* Directories */}
          {data.directories.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Folders</h4>
              <div className="grid grid-cols-1 gap-2">
                {data.directories.map((directory) => (
                  <button
                    key={directory.path}
                    onClick={() => handleDirectoryClick(directory)}
                    className="flex items-center p-2 hover:bg-gray-100 rounded text-left"
                  >
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="text-sm">{directory.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {data.images.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Images ({data.images.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.images.map((image) => (
                  <button
                    key={image.path}
                    onClick={() => handleImageClick(image)}
                    className="group relative aspect-square bg-gray-100 rounded overflow-hidden hover:ring-2 hover:ring-primary-500"
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {data.directories.length === 0 && data.images.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No images found in this directory</p>
              <button
                onClick={handleUploadClick}
                className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
              >
                Upload some images
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload feedback */}
      {uploadMutation.isSuccess && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded text-sm">
          Upload successful!
        </div>
      )}
      
      {uploadMutation.isError && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-sm">
          Upload failed. Please try again.
        </div>
      )}
    </div>
  );
}