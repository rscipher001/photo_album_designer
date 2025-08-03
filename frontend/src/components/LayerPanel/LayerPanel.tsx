import React, { useState, useEffect, useMemo } from 'react';
import { fabric } from 'fabric';

// Interface for layer data structure
interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
  object: fabric.Object;
}

interface LayerPanelProps {
  canvas: fabric.Canvas | null;
  className?: string;
}

/**
 * LayerPanel Component
 * 
 * Provides Photoshop-like layer management functionality:
 * - Display all canvas objects as layers
 * - Control visibility, lock state, and opacity
 * - Reorder layers (z-index management)
 * - Select and delete layers
 * 
 * Uses a stable approach to avoid infinite render loops by:
 * - Using canvas object references as dependencies
 * - Memoizing layer data transformation
 * - Careful event listener management
 */
export const LayerPanel: React.FC<LayerPanelProps> = ({ 
  canvas, 
  className = '' 
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Generate layers from canvas objects
   * Memoized to prevent unnecessary recalculations
   */
  const layers = useMemo(() => {
    if (!canvas) return [];

    const objects = canvas.getObjects();
    
    // Filter out temporary crop tools and other temporary objects
    const filteredObjects = objects.filter(obj => {
      const anyObj = obj as any;
      return !anyObj.isCropTool && 
             !anyObj.isTemporary && 
             anyObj.id !== 'crop-rectangle';
    });
    
    return filteredObjects.map((obj, index) => {
      // Generate unique ID if not present
      const id = (obj as any).id || `layer_${Date.now()}_${index}`;
      if (!(obj as any).id) {
        (obj as any).id = id;
      }

      // Generate display name based on object type and metadata
      let name = `${obj.type?.charAt(0).toUpperCase()}${obj.type?.slice(1)} ${index + 1}`;
      
      if (obj.type === 'image' && (obj as any).originalName) {
        name = (obj as any).originalName;
      } else if ((obj.type === 'i-text' || obj.type === 'text') && (obj as fabric.IText).text) {
        const text = (obj as fabric.IText).text || '';
        name = text.length > 20 ? `${text.substring(0, 20)}...` : text;
      }

      return {
        id,
        name,
        type: obj.type || 'object',
        visible: obj.visible !== false,
        locked: !obj.selectable,
        opacity: obj.opacity || 1,
        zIndex: objects.length - index, // Higher index = higher z-order
        object: obj
      } as Layer;
    }).reverse(); // Reverse to show top layers first
  }, [canvas, refreshKey]); // refreshKey allows manual refresh

  /**
   * Set up canvas event listeners for layer updates
   */
  useEffect(() => {
    if (!canvas) return;

    const handleCanvasChange = () => {
      // Use a small delay to ensure canvas is updated
      setTimeout(() => setRefreshKey(prev => prev + 1), 10);
    };

    const handleSelection = (e?: fabric.IEvent) => {
      const activeObject = e?.target || canvas.getActiveObject();
      if (activeObject && (activeObject as any).id) {
        setSelectedLayerId((activeObject as any).id);
      } else {
        setSelectedLayerId(null);
      }
    };

    // Register event listeners
    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);
    canvas.on('object:modified', handleCanvasChange);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => setSelectedLayerId(null));

    // Initial selection sync
    handleSelection();

    // Cleanup
    return () => {
      canvas.off('object:added', handleCanvasChange);
      canvas.off('object:removed', handleCanvasChange);
      canvas.off('object:modified', handleCanvasChange);
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', () => setSelectedLayerId(null));
    };
  }, [canvas]);

  /**
   * Handle layer selection
   */
  const selectLayer = (layer: Layer) => {
    if (!canvas) return;
    
    setSelectedLayerId(layer.id);
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
  };

  /**
   * Toggle layer visibility
   */
  const toggleVisibility = (layer: Layer) => {
    if (!canvas) return;

    const newVisibility = !layer.visible;
    layer.object.set('visible', newVisibility);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Toggle layer lock state
   */
  const toggleLock = (layer: Layer) => {
    if (!canvas) return;

    const newSelectable = layer.locked; // If currently locked, make selectable
    layer.object.set({
      selectable: newSelectable,
      evented: newSelectable
    });
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Update layer opacity
   */
  const updateOpacity = (layer: Layer, opacity: number) => {
    if (!canvas) return;

    layer.object.set('opacity', opacity);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Delete layer
   */
  const deleteLayer = (layer: Layer) => {
    if (!canvas) return;

    canvas.remove(layer.object);
    canvas.renderAll();
    
    if (selectedLayerId === layer.id) {
      setSelectedLayerId(null);
    }
  };

  /**
   * Move layer up in z-order
   */
  const moveLayerUp = (layer: Layer) => {
    if (!canvas) return;

    canvas.bringForward(layer.object);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Move layer down in z-order
   */
  const moveLayerDown = (layer: Layer) => {
    if (!canvas) return;

    canvas.sendBackwards(layer.object);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Move layer to top
   */
  const moveLayerToTop = (layer: Layer) => {
    if (!canvas) return;

    canvas.bringToFront(layer.object);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Move layer to bottom
   */
  const moveLayerToBottom = (layer: Layer) => {
    if (!canvas) return;

    canvas.sendToBack(layer.object);
    canvas.renderAll();
    setRefreshKey(prev => prev + 1);
  };

  // Note: selectedLayer could be used for additional controls if needed
  // const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

  return (
    <div className={`bg-gray-800 text-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Layers</h3>
        {layers.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">{layers.length} object{layers.length === 1 ? '' : 's'}</p>
        )}
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            No layers yet
            <br />
            Add images or text to start
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`
                  group relative rounded cursor-pointer transition-colors
                  ${selectedLayerId === layer.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                  }
                `}
                onClick={() => selectLayer(layer)}
              >
                {/* Main layer row */}
                <div className="flex items-center p-2">
                  {/* Layer type icon */}
                  <div className="w-5 h-5 mr-2 flex items-center justify-center">
                    {layer.type === 'image' && (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {(layer.type === 'i-text' || layer.type === 'text') && (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                    {layer.type === 'rect' && (
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                    )}
                    {layer.type === 'circle' && (
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                    )}
                  </div>

                  {/* Layer name and info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{layer.name}</div>
                    <div className="text-xs opacity-75 capitalize">{layer.type}</div>
                  </div>

                  {/* Quick controls */}
                  <div className="flex items-center space-x-1">
                    {/* Visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(layer);
                      }}
                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-600 rounded text-xs"
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? '👁️' : '🙈'}
                    </button>

                    {/* Lock */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(layer);
                      }}
                      className="w-6 h-6 flex items-center justify-center hover:bg-gray-600 rounded text-xs"
                      title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    >
                      {layer.locked ? '🔒' : '🔓'}
                    </button>
                  </div>
                </div>

                {/* Expanded controls for selected layer */}
                {selectedLayerId === layer.id && (
                  <div className="px-2 pb-2 space-y-2 border-t border-blue-500">
                    {/* Z-order controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Z-Order:</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerToTop(layer);
                          }}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                          title="Bring to front"
                        >
                          ⬆⬆
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerUp(layer);
                          }}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                          title="Bring forward"
                        >
                          ⬆
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerDown(layer);
                          }}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                          title="Send backward"
                        >
                          ⬇
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayerToBottom(layer);
                          }}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                          title="Send to back"
                        >
                          ⬇⬇
                        </button>
                      </div>
                    </div>

                    {/* Opacity control */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Opacity:</span>
                        <span className="text-xs">{Math.round(layer.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={layer.opacity}
                        onChange={(e) => updateOpacity(layer, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer);
                      }}
                      className="w-full px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white"
                    >
                      Delete Layer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};