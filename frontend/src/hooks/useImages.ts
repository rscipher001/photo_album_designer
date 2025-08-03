import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { BrowseResponse, UploadResponse } from '../types';

export function useImageBrowser(path: string = '') {
  return useQuery({
    queryKey: ['images', 'browse', path],
    queryFn: async (): Promise<BrowseResponse> => {
      const response = await axios.get('/api/images/browse', {
        params: { path }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useImageUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: FileList): Promise<UploadResponse> => {
      const formData = new FormData();
      
      if (files.length === 1) {
        formData.append('image', files[0]);
        const response = await axios.post('/api/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } else {
        Array.from(files).forEach(file => {
          formData.append('images', file);
        });
        const response = await axios.post('/api/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate browse queries to refresh the image list
      queryClient.invalidateQueries({ queryKey: ['images', 'browse'] });
    }
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filename: string): Promise<void> => {
      await axios.delete(`/api/upload/${filename}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images', 'browse'] });
    }
  });
}