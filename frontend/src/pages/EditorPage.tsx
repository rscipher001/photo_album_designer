import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { fabric } from 'fabric';
import { useProject, useUpdateProject, useCreateProject } from '../hooks/useProjects';
import { FabricCanvas } from '../components/Canvas/FabricCanvas';
import { CanvasToolbar } from '../components/Canvas/CanvasToolbar';
import { ImageBrowser } from '../components/ImageBrowser/ImageBrowser';
import { LayerPanel } from '../components/LayerPanel/LayerPanel';
import type { ImageFile } from '../types';

/**
 * EditorPage Component
 * 
 * The main album design interface that integrates:
 * - Fabric.js canvas for image manipulation
 * - Image browser for selecting photos
 * - Layer management panel
 * - Canvas toolbar with editing tools
 * - Project save/load functionality
 * 
 * This page handles both creating new projects and editing existing ones.
 * All canvas state is managed here and synchronized with the backend.
 */
export function EditorPage() {
  const { projectId } = useParams();
  
  // Canvas state management
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Refs for accessing canvas methods
  const canvasRef = useRef<any>(null);
  
  // Project data hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const updateProjectMutation = useUpdateProject();
  const createProjectMutation = useCreateProject();

  /**
   * Handle canvas changes to track unsaved state
   */
  const handleCanvasChange = () => {
    setHasUnsavedChanges(true);
    
    // Auto-save after 2 seconds of inactivity
    setTimeout(() => {
      if (projectId) {
        handleSave();
      }
    }, 2000);
  };

  /**
   * Handle object selection changes from canvas
   */
  const handleSelectionChange = (selected: fabric.Object | null) => {
    setSelectedObject(selected);
  };

  /**
   * Handle image selection from browser - add to canvas
   */
  const handleImageSelect = (image: ImageFile) => {
    // Access canvas methods through ref
    if (canvasRef.current && canvasRef.current.addImage) {
      canvasRef.current.addImage(image);
    }
  };

  /**
   * Save project data to backend
   * Captures current canvas state and project metadata
   */
  const handleSave = async () => {
    if (!canvasRef.current || isAutoSaving) return;
    
    setIsAutoSaving(true);
    
    try {
      // Get canvas data as JSON
      const canvasData = canvasRef.current.getCanvasData && canvasRef.current.getCanvasData();
      
      // Generate thumbnail from canvas
      const thumbnail = canvasRef.current.exportCanvas && 
        canvasRef.current.exportCanvas('jpeg', 0.7);
      
      // Prepare project data
      const projectData = {
        name: project?.name || 'Untitled Album',
        pages: [{
          id: 'page_1',
          name: 'Page 1',
          layout: {
            width: canvasSize.width,
            height: canvasSize.height,
            background: '#ffffff'
          },
          elements: canvasData ? canvasData.objects : []
        }],
        settings: {
          defaultPageSize: canvasSize,
          exportFormat: 'jpg' as const,
          quality: 90
        },
        thumbnail: thumbnail
      };

      if (projectId) {
        // Update existing project
        await updateProjectMutation.mutateAsync({
          id: projectId,
          data: projectData
        });
      } else {
        // Create new project and redirect to it
        const result = await createProjectMutation.mutateAsync(projectData);
        // TODO: Navigate to the new project URL
        console.log('New project created:', result.project.id);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save project:', error);
      // TODO: Show error message to user
    } finally {
      setIsAutoSaving(false);
    }
  };

  /**
   * Export current canvas as image
   */
  const handleExport = () => {
    if (!canvasRef.current || !canvasRef.current.exportCanvas) return;
    
    // Export as high-quality PNG
    const dataURL = canvasRef.current.exportCanvas('png', 1.0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${project?.name || 'album'}-page-1.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Update canvas dimensions
   */
  const handleCanvasSizeChange = (width: number, height: number) => {
    setCanvasSize({ width, height });
    setHasUnsavedChanges(true);
  };

  /**
   * Load project data into canvas when project loads
   */
  useEffect(() => {
    if (project && project.pages && project.pages.length > 0 && canvasRef.current) {
      const firstPage = project.pages[0];
      
      // Update canvas size
      if (firstPage.layout) {
        setCanvasSize({
          width: firstPage.layout.width,
          height: firstPage.layout.height
        });
      }
      
      // Load canvas data if it exists
      if (firstPage.elements && canvasRef.current.loadCanvasData) {
        const canvasData = {
          objects: firstPage.elements,
          background: firstPage.layout.background || '#ffffff'
        };
        canvasRef.current.loadCanvasData(canvasData);
      }
    }
  }, [project]);

  // Show loading state while project loads
  if (projectLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            {project?.name || 'New Project'}
          </h1>
          <div className="text-sm text-gray-400">
            {hasUnsavedChanges && '• Unsaved changes'}
            {isAutoSaving && '• Saving...'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave}
            disabled={isAutoSaving || !hasUnsavedChanges}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition-colors"
          >
            {isAutoSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={handleExport}
            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded text-sm transition-colors"
          >
            Export
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Image Browser and Layer Panel */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Image Browser Section */}
          <div className="flex-1 min-h-0">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300">Photos</h3>
            </div>
            <div className="h-64 overflow-hidden">
              <ImageBrowser 
                onImageSelect={handleImageSelect}
                className="h-full"
              />
            </div>
          </div>

          {/* Layer Panel Section */}
          <div className="flex-1 min-h-0 border-t border-gray-700">
            <LayerPanel 
              canvas={canvasRef.current}
              className="h-full"
            />
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas Toolbar */}
          <CanvasToolbar 
            canvas={canvasRef.current}
            selectedObject={selectedObject}
          />

          {/* Canvas Container */}
          <div className="flex-1 bg-gray-900 p-8 overflow-auto">
            <div className="flex items-center justify-center min-h-full">
              <FabricCanvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                onSelectionChange={handleSelectionChange}
                onCanvasChange={handleCanvasChange}
                className="shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
          {/* Canvas Properties */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Canvas Size</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Width</label>
                <input
                  type="number"
                  value={canvasSize.width}
                  onChange={(e) => handleCanvasSizeChange(parseInt(e.target.value), canvasSize.height)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  min="100"
                  max="4000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Height</label>
                <input
                  type="number"
                  value={canvasSize.height}
                  onChange={(e) => handleCanvasSizeChange(canvasSize.width, parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  min="100"
                  max="4000"
                />
              </div>
              
              {/* Quick size presets */}
              <div className="space-y-1">
                <div className="text-xs text-gray-400">Quick sizes:</div>
                <div className="grid grid-cols-2 gap-1">
                  <button 
                    onClick={() => handleCanvasSizeChange(1920, 1080)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    HD
                  </button>
                  <button 
                    onClick={() => handleCanvasSizeChange(1080, 1080)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    Square
                  </button>
                  <button 
                    onClick={() => handleCanvasSizeChange(2048, 1536)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    4:3
                  </button>
                  <button 
                    onClick={() => handleCanvasSizeChange(1920, 1440)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Object Properties */}
          {selectedObject && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                {selectedObject.type} Properties
              </h3>
              
              {/* Position controls */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.left || 0)}
                      onChange={(e) => {
                        selectedObject.set('left', parseInt(e.target.value));
                        canvasRef.current?.renderAll();
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.top || 0)}
                      onChange={(e) => {
                        selectedObject.set('top', parseInt(e.target.value));
                        canvasRef.current?.renderAll();
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
                
                {/* Rotation */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rotation</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedObject.angle || 0}
                    onChange={(e) => {
                      selectedObject.rotate(parseInt(e.target.value));
                      canvasRef.current?.renderAll();
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 text-center">
                    {Math.round(selectedObject.angle || 0)}°
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pages Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Pages</h3>
            <div className="space-y-2">
              <div className="bg-gray-700 rounded p-2 border border-primary-600">
                <div className="text-sm">Page 1</div>
                <div className="text-xs text-gray-400">
                  {canvasSize.width} × {canvasSize.height}
                </div>
              </div>
              <button className="w-full border-2 border-dashed border-gray-600 rounded p-2 text-sm text-gray-400 hover:border-gray-500 transition-colors">
                + Add Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}