import { useState, useEffect } from 'react';
import { fabric } from 'fabric';

// Interface for layer data structure
interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  object: fabric.Object;
}

// Props interface for the LayerPanel component
interface LayerPanelProps {
  canvas: fabric.Canvas | null;
  onLayerSelect?: (layer: Layer) => void;
  className?: string;
}

/**
 * LayerPanel Component
 * 
 * Provides a Photoshop-like layer management interface:
 * - Shows all objects on canvas as layers
 * - Allows reordering layers (z-index)
 * - Toggle visibility and lock state
 * - Rename layers
 * - Delete layers
 * - Select layers for editing
 * 
 * This component automatically syncs with canvas objects and updates
 * when objects are added, removed, or modified on the canvas.
 */
export function LayerPanel({ canvas, onLayerSelect, className = '' }: LayerPanelProps) {
  // State to track all layers on the canvas
  const [layers, setLayers] = useState<Layer[]>([]);
  // Track which layer is currently selected
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  /**
   * Convert a Fabric.js object to a Layer data structure
   * 
   * @param obj - Fabric.js object to convert
   * @param index - Index position in the canvas (for default naming)
   * @returns Layer object with metadata
   */
  const fabricObjectToLayer = (obj: fabric.Object, index: number): Layer => {
    // Get object ID or generate one if it doesn't exist
    const id = (obj as any).id || `layer_${index}`;
    
    // Generate human-readable name based on object type
    let name = `${obj.type?.charAt(0).toUpperCase()}${obj.type?.slice(1)} ${index + 1}`;
    
    // Use original filename for images if available
    if (obj.type === 'image' && (obj as any).originalName) {
      name = (obj as any).originalName;
    }
    
    // Use text content for text objects
    if (obj.type === 'i-text' || obj.type === 'text') {
      const textContent = (obj as fabric.IText).text || '';
      name = textContent.length > 20 ? `${textContent.substring(0, 20)}...` : textContent;
    }

    return {
      id,
      name,
      type: obj.type || 'object',
      visible: obj.visible !== false, // Default to visible
      locked: !obj.selectable, // Locked means not selectable
      opacity: obj.opacity || 1,
      object: obj
    };
  };

  /**
   * Update the layers state by reading all objects from canvas
   * This function syncs the layer panel with the current canvas state
   */
  const updateLayers = () => {
    if (!canvas) {
      setLayers([]);
      return;
    }

    // Get all objects from canvas
    const objects = canvas.getObjects();
    
    // Convert to layer data structure (reverse order for top-to-bottom display)
    const newLayers = objects.map(fabricObjectToLayer).reverse();
    
    setLayers(newLayers);
  };

  /**
   * Set up event listeners to keep layer panel in sync with canvas
   */
  useEffect(() => {
    if (!canvas) return;

    // Event handlers for canvas changes
    const handleObjectAdded = () => updateLayers();
    const handleObjectRemoved = () => updateLayers();
    const handleObjectModified = () => updateLayers();
    const handleSelectionCreated = (e: fabric.IEvent) => {
      const activeObject = e.target;
      if (activeObject) {
        const layerId = (activeObject as any).id;
        setSelectedLayerId(layerId);
      }
    };
    const handleSelectionCleared = () => setSelectedLayerId(null);

    // Register event listeners
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);

    // Initial sync
    updateLayers();

    // Cleanup event listeners on unmount
    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas]);

  /**
   * Handle layer selection - make the corresponding canvas object active
   * 
   * @param layer - The layer to select
   */
  const handleLayerSelect = (layer: Layer) => {
    if (!canvas) return;

    // Set the object as active on canvas
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
    
    // Update local selected state
    setSelectedLayerId(layer.id);
    
    // Notify parent component
    if (onLayerSelect) {
      onLayerSelect(layer);
    }
  };

  /**
   * Toggle layer visibility
   * 
   * @param layer - The layer to toggle
   */
  const toggleLayerVisibility = (layer: Layer) => {
    if (!canvas) return;

    // Toggle visibility on the fabric object
    layer.object.set('visible', !layer.visible);
    canvas.renderAll();
    
    // Update layers to reflect the change
    updateLayers();
  };

  /**
   * Toggle layer lock state (selectable/non-selectable)
   * 
   * @param layer - The layer to toggle
   */
  const toggleLayerLock = (layer: Layer) => {
    if (!canvas) return;

    // Toggle selectable property (locked = not selectable)
    const newSelectable = layer.locked;
    layer.object.set({
      selectable: newSelectable,
      evented: newSelectable // Also control event handling
    });
    
    canvas.renderAll();
    updateLayers();
  };

  /**
   * Delete a layer from the canvas
   * 
   * @param layer - The layer to delete
   */
  const deleteLayer = (layer: Layer) => {
    if (!canvas) return;

    // Remove object from canvas
    canvas.remove(layer.object);
    canvas.renderAll();
    
    // Clear selection if this layer was selected
    if (selectedLayerId === layer.id) {
      setSelectedLayerId(null);
    }
  };

  /**
   * Move layer up in the z-order (towards front)
   * 
   * @param layer - The layer to move up
   */
  const moveLayerUp = (layer: Layer) => {
    if (!canvas) return;

    // Bring object forward in z-order
    canvas.bringForward(layer.object);
    canvas.renderAll();
    updateLayers();
  };

  /**
   * Move layer down in the z-order (towards back)
   * 
   * @param layer - The layer to move down
   */
  const moveLayerDown = (layer: Layer) => {
    if (!canvas) return;

    // Send object backward in z-order
    canvas.sendBackwards(layer.object);
    canvas.renderAll();
    updateLayers();
  };

  /**
   * Update layer opacity
   * 
   * @param layer - The layer to modify
   * @param opacity - New opacity value (0-1)
   */
  const updateLayerOpacity = (layer: Layer, opacity: number) => {
    if (!canvas) return;

    // Set opacity on fabric object
    layer.object.set('opacity', opacity);
    canvas.renderAll();
    updateLayers();
  };

  return (
    <div className={`bg-gray-800 text-white ${className}`}>
      {/* Layer panel header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">Layers</h3>
      </div>

      {/* Layers list */}
      <div className="max-h-64 overflow-y-auto">
        {layers.length === 0 ? (
          // Empty state when no layers exist
          <div className="p-4 text-center text-gray-500 text-sm">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            No layers yet
            <br />
            Add images or text to start
          </div>
        ) : (
          // Layer items list
          layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`group relative ${
                selectedLayerId === layer.id
                  ? 'bg-primary-600'
                  : 'hover:bg-gray-700'
              }`}
            >
              {/* Main layer item */}
              <div
                className="flex items-center p-2 cursor-pointer"
                onClick={() => handleLayerSelect(layer)}
              >
                {/* Layer type icon */}
                <div className="w-6 h-6 mr-2 flex items-center justify-center">
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
                </div>

                {/* Layer name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{layer.name}</div>
                </div>

                {/* Layer controls */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    )}
                  </button>

                  {/* Lock toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Move up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(layer);
                    }}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-600 rounded disabled:opacity-30"
                    title="Move layer up"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Move down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(layer);
                    }}
                    disabled={index === layers.length - 1}
                    className="p-1 hover:bg-gray-600 rounded disabled:opacity-30"
                    title="Move layer down"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Delete layer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer);
                    }}
                    className="p-1 hover:bg-red-600 rounded"
                    title="Delete layer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Opacity slider for selected layer */}
              {selectedLayerId === layer.id && (
                <div className="px-8 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={layer.opacity}
                      onChange={(e) => updateLayerOpacity(layer, parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-8">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}