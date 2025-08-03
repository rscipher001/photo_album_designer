import { useState } from 'react';
import { fabric } from 'fabric';

// Define the available tools in the toolbar
type Tool = 'select' | 'crop' | 'rotate' | 'text' | 'delete' | 'duplicate' | 'flip' | 'align';

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

      case 'duplicate':
        // Duplicate selected object
        if (selectedObject) {
          duplicateSelectedObject();
        }
        break;

      case 'flip':
        // Flip selected object horizontally
        if (selectedObject) {
          flipSelectedObject();
        }
        break;

      case 'align':
        // Show alignment options for selected object
        if (selectedObject) {
          alignSelectedObject();
        }
        break;
    }
  };

  /**
   * Enable crop mode for the selected image
   * Creates a cropping rectangle overlay and applies crop when confirmed
   */
  const enableCropMode = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'image') return;

    const image = selectedObject as fabric.Image;
    
    // Get the image's bounding rectangle which handles all transformations correctly
    const imageBounds = image.getBoundingRect();

    console.log('Image properties:', {
      left: image.left,
      top: image.top,
      width: image.width,
      height: image.height,
      scaleX: image.scaleX,
      scaleY: image.scaleY,
      originX: image.originX,
      originY: image.originY,
      boundingRect: imageBounds
    });

    // Deselect all objects and make image non-selectable during crop
    canvas.discardActiveObject();
    image.set({
      selectable: false,
      evented: false
    });

    // Create crop rectangle that initially covers the full image using bounding rect
    const cropWidth = imageBounds.width;
    const cropHeight = imageBounds.height;
    const cropLeft = imageBounds.left;
    const cropTop = imageBounds.top;

    const cropRect = new fabric.Rect({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
      fill: 'rgba(0, 123, 255, 0.2)',
      stroke: '#007bff',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: '#007bff'
    });
    
    // Add custom properties to identify this as a crop tool
    (cropRect as any).id = 'crop-rectangle';
    (cropRect as any).targetImage = image;
    (cropRect as any).isCropTool = true;
    (cropRect as any).isTemporary = true;
    (cropRect as any).excludeFromExport = true;

    // Add crop rectangle to canvas and make it active
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();

    // Create crop confirmation UI
    createCropConfirmationUI(cropRect, image);
  };

  /**
   * Create crop confirmation UI with apply/cancel buttons
   */
  const createCropConfirmationUI = (cropRect: fabric.Rect, targetImage: fabric.Image) => {
    if (!canvas) return;

    // Create a temporary overlay div for crop controls
    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    overlay.innerHTML = `
      <span>Adjust the crop area and click Apply</span>
      <button id="crop-apply" style="background: #007bff; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer;">Apply Crop</button>
      <button id="crop-cancel" style="background: #6c757d; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer;">Cancel</button>
    `;

    document.body.appendChild(overlay);

    // Apply crop function
    const applyCrop = () => {
      const cropBounds = cropRect.getBoundingRect();
      const imageBounds = targetImage.getBoundingRect();
      
      console.log('=== CROP DEBUG INFO ===');
      console.log('Crop rectangle bounds:', cropBounds);
      console.log('Image bounding rect:', imageBounds);
      console.log('Target image properties:', {
        width: targetImage.width,
        height: targetImage.height,
        scaleX: targetImage.scaleX,
        scaleY: targetImage.scaleY,
        left: targetImage.left,
        top: targetImage.top,
        originX: targetImage.originX,
        originY: targetImage.originY
      });
      
      // Try a direct approach - create a new cropped image instead of using clipPath
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');
      
      if (!cropCtx) {
        console.error('Could not create crop canvas context');
        cancelCrop();
        return;
      }

      // Calculate crop area
      const cropX = Math.max(0, cropBounds.left - imageBounds.left);
      const cropY = Math.max(0, cropBounds.top - imageBounds.top);
      const cropW = Math.min(cropBounds.width, imageBounds.width - cropX);
      const cropH = Math.min(cropBounds.height, imageBounds.height - cropY);
      
      // Set canvas size to crop dimensions
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      
      console.log('Crop area:', { cropX, cropY, cropW, cropH });
      
      // Get the original image element
      const imageElement = (targetImage as any)._element;
      if (!imageElement) {
        console.error('Could not get image element');
        cancelCrop();
        return;
      }
      
      // Calculate source coordinates on the original image
      const scaleX = targetImage.scaleX || 1;
      const scaleY = targetImage.scaleY || 1;
      const sourceX = (cropX / scaleX);
      const sourceY = (cropY / scaleY);
      const sourceW = cropW / scaleX;
      const sourceH = cropH / scaleY;
      
      console.log('Source coordinates:', { sourceX, sourceY, sourceW, sourceH });
      console.log('Original image size:', { width: imageElement.naturalWidth, height: imageElement.naturalHeight });
      
      // Draw the cropped portion
      cropCtx.drawImage(
        imageElement,
        sourceX, sourceY, sourceW, sourceH, // Source rectangle
        0, 0, cropW, cropH                   // Destination rectangle
      );
      
      // Create new fabric image from the cropped canvas
      const croppedDataUrl = cropCanvas.toDataURL();
      
      fabric.Image.fromURL(croppedDataUrl, (croppedImg) => {
        if (!canvas) return;
        
        // Calculate the correct scale for the cropped image
        // The cropped image should fill the crop rectangle area
        const cropImageWidth = croppedImg.width || 1;
        const cropImageHeight = croppedImg.height || 1;
        
        const targetScaleX = cropW / cropImageWidth;
        const targetScaleY = cropH / cropImageHeight;
        
        // Position the new image where the crop rectangle was
        croppedImg.set({
          left: cropBounds.left,
          top: cropBounds.top,
          scaleX: targetScaleX,
          scaleY: targetScaleY
        });
        
        console.log('Cropped image scaling:', {
          cropImageWidth,
          cropImageHeight,
          cropW,
          cropH,
          targetScaleX,
          targetScaleY,
          originalScale: { x: targetImage.scaleX, y: targetImage.scaleY }
        });
        
        // Copy custom properties
        (croppedImg as any).id = (targetImage as any).id;
        (croppedImg as any).originalPath = (targetImage as any).originalPath;
        (croppedImg as any).originalName = (targetImage as any).originalName + ' (cropped)';
        
        // Replace the original image with the cropped one
        canvas.remove(targetImage);
        canvas.add(croppedImg);
        canvas.setActiveObject(croppedImg);
        canvas.renderAll();
        
        console.log('Crop completed successfully');
      });

      // Clean up
      canvas.remove(cropRect);
      
      // Remove overlay safely
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      console.log('=== END CROP DEBUG ===');
    };

    // Cancel crop function
    const cancelCrop = () => {
      // Restore image selectability
      targetImage.set({
        selectable: true,
        evented: true
      });

      // Remove crop rectangle and restore selection
      canvas.remove(cropRect);
      canvas.setActiveObject(targetImage);
      canvas.renderAll();
      
      // Remove overlay safely
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      console.log('Crop cancelled');
    };

    // Add event listeners
    overlay.querySelector('#crop-apply')?.addEventListener('click', applyCrop);
    overlay.querySelector('#crop-cancel')?.addEventListener('click', cancelCrop);

    // Clean up on canvas clicks outside crop area
    const handleCanvasClick = (e: fabric.IEvent) => {
      if (e.target !== cropRect) {
        canvas.off('mouse:down', handleCanvasClick);
      }
    };
    canvas.on('mouse:down', handleCanvasClick);
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
   * Duplicate the currently selected object
   */
  const duplicateSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    // Clone the selected object
    selectedObject.clone((cloned: fabric.Object) => {
      // Offset the cloned object slightly
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });

      // Add unique ID to cloned object
      (cloned as any).id = `${selectedObject.type}_${Date.now()}`;

      // Add to canvas and select the clone
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  /**
   * Flip the currently selected object horizontally
   */
  const flipSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    // Toggle horizontal flip
    const currentFlipX = selectedObject.flipX || false;
    selectedObject.set('flipX', !currentFlipX);
    
    canvas.renderAll();
  };

  /**
   * Align the currently selected object to canvas
   */
  const alignSelectedObject = () => {
    if (!canvas || !selectedObject) return;

    // Center the object on the canvas
    selectedObject.center();
    
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
    },
    {
      tool: 'duplicate' as Tool,
      label: 'Duplicate',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      available: !!selectedObject
    },
    {
      tool: 'flip' as Tool,
      label: 'Flip',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      available: !!selectedObject
    },
    {
      tool: 'align' as Tool,
      label: 'Center',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
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