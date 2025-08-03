export interface ImageFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  thumbnail: string;
}

export interface Directory {
  name: string;
  path: string;
}

export interface BrowseResponse {
  currentPath: string;
  directories: Directory[];
  images: ImageFile[];
}

export interface Project {
  id: string;
  name: string;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  pages?: Page[];
  settings?: ProjectSettings;
}

export interface Page {
  id: string;
  name: string;
  layout: Layout;
  elements: Element[];
}

export interface Layout {
  width: number;
  height: number;
  background: string;
}

export interface Element {
  id: string;
  type: 'image' | 'text' | 'shape';
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  zIndex: number;
  properties: any;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ProjectSettings {
  defaultPageSize: Size;
  exportFormat: 'jpg' | 'png' | 'pdf';
  quality: number;
}

export interface UploadResponse {
  success: boolean;
  file?: {
    name: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    thumbnail: string;
  };
  files?: Array<{
    name: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    thumbnail: string;
  }>;
  count?: number;
}