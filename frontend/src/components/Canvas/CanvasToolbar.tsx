import { useState } from 'react';
import { fabric } from 'fabric';

// Define the available tools in the toolbar
type Tool = 'select' | 'crop' | 'rotate' | 'text' | 'delete';

// Props interface for the CanvasToolbar component
interface CanvasToolbarProps {
  canvas: fabric.Canvas | null;
  selectedObject: fabric.Object | null;
  onToolChange?: (tool: Tool) => void;
  className?: string;
}

/**
 * CanvasToolbar Component
 * 
 * Provides a toolbar with editing tools for the Fabric.js canvas:
 * - Selection tool (default)
 * - Crop tool for images
 * - Rotate tool for any object
 * - Text tool to add text elements
 * - Delete tool to remove selected objects
 * 
 * The toolbar dynamically shows/hides tools based on the selected object type
 */
export function CanvasToolbar({ 
  canvas, 
  selectedObject, 
  onToolChange,
  className = '' 
}: CanvasToolbarProps) {
  // Track the currently active tool
  const [activeTool, setActiveTool] = useState<Tool>('select');

  /**
   * Handle tool selection and perform the associated action
   * 
   * @param tool - The tool that was clicked
   */
  const handleToolClick = (tool: Tool) => {
    if (!canvas) return;

    // Update active tool state
    setActiveTool(tool);
    
    // Notify parent component of tool change
    if (onToolChange) {
      onToolChange(tool);
    }

    // Perform tool-specific actions
    switch (tool) {
      case 'select':
        // Enable selection mode (default Fabric.js behavior)
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;

      case 'crop':
        // Enable crop mode for images
        if (selectedObject && selectedObject.type === 'image') {
          enableCropMode();
        }
        break;

      case 'rotate':
        // Rotate selected object by 90 degrees
        if (selectedObject) {
          rotateSelectedObject();
        }
        break;

      case 'text':
        // Add text element to canvas
        addTextElement();
        break;

      case 'delete':
        // Delete selected object
        if (selectedObject) {
          deleteSelectedObject();
        }
        break;
    }
  };

  /**
   * Enable crop mode for the selected image
   * Creates a cropping rectangle overlay on the image
   */
  const enableCropMode = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') return;

    // Get image bounds
    const image = selectedObject as fabric.Image;
    const bound = image.getBoundingRect();

    // Create crop rectangle (initially covers the entire image)
    const cropRect = new fabric.Rect({
      left: bound.left,
      top: bound.top,
      width: bound.width,
      height: bound.height,
      fill: 'transparent',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true
    });
    
    // Add custom property to identify as crop rectangle
    (cropRect as any).id = 'crop-rectangle';

    // Add crop rectangle to canvas
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();

    // TODO: Implement actual cropping functionality
    // This would involve:
    // 1. Listening for crop rectangle changes
    // 2. Applying crop to the image when done
    // 3. Removing the crop rectangle
  };

  /**
   * Rotate the selected object by 90 degrees clockwise
   */
  const rotateSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    // Get current rotation angle (default to 0 if undefined)
    const currentAngle = selectedObject.angle || 0;
    
    // Rotate by 90 degrees clockwise
    selectedObject.rotate(currentAngle + 90);
    
    // Re-render canvas to show changes
    canvas.renderAll();
  };

  /**
   * Add a new text element to the canvas center
   */
  const addTextElement = () => {
    if (!canvas) return;

    // Create new text object
    const text = new fabric.IText('Double click to edit', {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000'
    });
    
    // Add custom properties
    (text as any).id = `text_${Date.now()}`;

    // Add text to canvas and make it active
    canvas.add(text);
    canvas.setActiveObject(text);
    
    // Enter editing mode immediately
    if (text instanceof fabric.IText) {
      text.enterEditing();
    }
    
    canvas.renderAll();
  };

  /**
   * Delete the currently selected object from canvas
   */
  const deleteSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    // Remove object from canvas
    canvas.remove(selectedObject);
    canvas.renderAll();
  };

  /**
   * Zoom the canvas view
   * 
   * @param direction - 'in' to zoom in, 'out' to zoom out, 'fit' to fit canvas
   */
  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (!canvas) return;

    const currentZoom = canvas.getZoom();
    let newZoom = currentZoom;

    switch (direction) {
      case 'in':
        newZoom = Math.min(currentZoom * 1.2, 3); // Max 3x zoom
        break;
      case 'out':
        newZoom = Math.max(currentZoom / 1.2, 0.1); // Min 0.1x zoom
        break;
      case 'fit':
        newZoom = 1; // Reset to 100%
        break;
    }

    // Apply zoom centered on canvas
    canvas.zoomToPoint(
      new fabric.Point(canvas.width! / 2, canvas.height! / 2),
      newZoom
    );
  };

  // Define toolbar button configuration
  const toolButtons = [
    {
      tool: 'select' as Tool,
      label: 'Select',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      available: true
    },
    {
      tool: 'crop' as Tool,
      label: 'Crop',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M7 17h10M17 7v10" />
        </svg>
      ),
      // Only available when an image is selected
      available: selectedObject?.type === 'image'
    },
    {
      tool: 'rotate' as Tool,
      label: 'Rotate',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      // Available when any object is selected
      available: !!selectedObject
    },
    {
      tool: 'text' as Tool,
      label: 'Text',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      available: true
    },
    {
      tool: 'delete' as Tool,
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      // Only available when an object is selected
      available: !!selectedObject
    }
  ];

  return (
    <div className={`bg-gray-800 border-b border-gray-700 px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Main toolbar buttons */}
        <div className="flex items-center space-x-1">
          {toolButtons.map((button) => (
            <button
              key={button.tool}
              onClick={() => handleToolClick(button.tool)}
              disabled={!button.available}
              className={`p-2 rounded transition-colors ${
                activeTool === button.tool
                  ? 'bg-primary-600 text-white'
                  : button.available
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'text-gray-500 cursor-not-allowed'
              }`}
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoom('out')}
            className="p-1 hover:bg-gray-700 text-gray-300 rounded"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          
          <button
            onClick={() => handleZoom('fit')}
            className="px-2 py-1 hover:bg-gray-700 text-gray-300 rounded text-xs"
            title="Fit to View"
          >
            100%
          </button>
          
          <button
            onClick={() => handleZoom('in')}
            className="p-1 hover:bg-gray-700 text-gray-300 rounded"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}