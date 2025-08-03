import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import type { ImageFile } from '../../types';

// Define props interface for the FabricCanvas component
interface FabricCanvasProps {
  width: number;
  height: number;
  onSelectionChange?: (selected: fabric.Object | null) => void;
  onCanvasChange?: () => void;
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  className?: string;
}

/**
 * FabricCanvas Component
 * 
 * A React wrapper around Fabric.js canvas that provides:
 * - Image manipulation capabilities
 * - Object selection and transformation
 * - Event handling for canvas changes
 * - Integration with the album designer workflow
 */
export const FabricCanvas = forwardRef<any, FabricCanvasProps>(({ 
  width, 
  height, 
  onSelectionChange, 
  onCanvasChange,
  onCanvasReady,
  className = '' 
}, ref) => {
  // Ref to the canvas DOM element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref to the Fabric.js canvas instance
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  // State to track the currently selected object
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);

  /**
   * Initialize Fabric.js canvas on component mount
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create new Fabric.js canvas instance
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true, // Maintain object layering
      selection: true, // Enable object selection
      allowTouchScrolling: false, // Disable touch scrolling for better control
    });

    // Store canvas reference for later use
    fabricCanvasRef.current = canvas;
    
    // Notify parent that canvas is ready
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    /**
     * Handle selection events when objects are selected/deselected
     */
    const handleSelection = () => {
      const activeObject = canvas.getActiveObject();
      setSelectedObject(activeObject);
      
      // Notify parent component of selection change
      if (onSelectionChange) {
        onSelectionChange(activeObject);
      }
    };

    /**
     * Handle canvas modifications (object moved, scaled, rotated, etc.)
     */
    const handleCanvasChange = () => {
      // Notify parent component that canvas has changed
      if (onCanvasChange) {
        onCanvasChange();
      }
    };

    // Register event listeners for canvas interactions
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelection);
    canvas.on('object:modified', handleCanvasChange);
    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);

    // Cleanup function to dispose of canvas when component unmounts
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [width, height, onSelectionChange, onCanvasChange, onCanvasReady]);

  /**
   * Update canvas size when dimensions change
   */
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width, height });
      fabricCanvasRef.current.renderAll();
    }
  }, [width, height]);

  /**
   * Add an image to the canvas from an ImageFile
   * 
   * @param imageFile - The image file object containing path and metadata
   * @param position - Optional position to place the image (default: center)
   */
  const addImage = (imageFile: ImageFile, position?: { x: number; y: number }) => {
    if (!fabricCanvasRef.current) return;

    // Create image URL for the original image (not thumbnail)
    const imageUrl = `/api/images/serve?path=${encodeURIComponent(imageFile.path)}`;

    console.log('Attempting to load image:', imageUrl);

    // Load image and add to canvas
    fabric.Image.fromURL(
      imageUrl, 
      (img) => {
        if (!fabricCanvasRef.current) return;

        console.log('Image loaded successfully:', imageUrl, 'Size:', img.width, 'x', img.height);
        console.log('Canvas dimensions:', width, 'x', height);
        console.log('Canvas objects before adding:', fabricCanvasRef.current.getObjects().length);

        // Calculate scale to fit image reasonably on canvas (max 400px)
        const maxSize = 400;
        const scale = Math.min(
          maxSize / (img.width || 1),
          maxSize / (img.height || 1),
          1 // Don't upscale images
        );

        console.log('Calculated scale:', scale);

        // Apply scaling
        img.scale(scale);

        // Position image (center by default or use provided position)
        if (position) {
          // Position image so that its center is at the drop point
          const scaledWidth = (img.width || 0) * scale;
          const scaledHeight = (img.height || 0) * scale;
          img.set({
            left: position.x - scaledWidth / 2,
            top: position.y - scaledHeight / 2
          });
          console.log('Positioned at drop point:', position.x, position.y, 'Image center offset:', -scaledWidth / 2, -scaledHeight / 2);
        } else {
          // Center the image on canvas
          const leftPos = (width - (img.width || 0) * scale) / 2;
          const topPos = (height - (img.height || 0) * scale) / 2;
          img.set({
            left: leftPos,
            top: topPos
          });
          console.log('Centered at:', leftPos, topPos);
        }

        // Add metadata to the image object for later reference
        (img as any).id = `image_${Date.now()}`; // Unique identifier
        (img as any).originalPath = imageFile.path; // Store original file path
        (img as any).originalName = imageFile.name; // Store original file name

        // Add image to canvas and make it the active selection
        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
        
        console.log('Canvas objects after adding:', fabricCanvasRef.current.getObjects().length);
        console.log('Active object:', fabricCanvasRef.current.getActiveObject());
      }, 
      {
        // Image loading options
        crossOrigin: 'anonymous' // Allow cross-origin images
      }
    );
  };

  /**
   * Remove the currently selected object from canvas
   */
  const removeSelected = () => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  /**
   * Clear all objects from the canvas
   */
  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = '#ffffff';
    fabricCanvasRef.current.renderAll();
  };

  /**
   * Get the canvas as a data URL (for export/preview)
   * 
   * @param format - Image format ('png' or 'jpeg')
   * @param quality - Image quality (0-1, only for jpeg)
   * @returns Data URL string
   */
  const exportCanvas = (format: 'png' | 'jpeg' = 'png', quality: number = 0.9): string => {
    if (!fabricCanvasRef.current) return '';

    return fabricCanvasRef.current.toDataURL({
      format,
      quality,
      multiplier: 1 // Use actual canvas size
    });
  };

  /**
   * Get canvas data as JSON (for saving projects)
   */
  const getCanvasData = () => {
    if (!fabricCanvasRef.current) return null;

    // Get canvas data but exclude temporary crop tools
    const canvasData = fabricCanvasRef.current.toJSON([
      'id', 'originalPath', 'originalName' // Include custom properties
    ]);

    // Filter out crop tools and other temporary objects
    if (canvasData.objects) {
      canvasData.objects = canvasData.objects.filter((obj: any) => 
        !obj.isCropTool && !obj.isTemporary && obj.id !== 'crop-rectangle'
      );
    }

    return canvasData;
  };

  /**
   * Load canvas data from JSON (for loading projects)
   */
  const loadCanvasData = (jsonData: any) => {
    if (!fabricCanvasRef.current) {
      console.error('Canvas not available for loading data');
      return;
    }

    console.log('Loading canvas data:', jsonData);

    try {
      fabricCanvasRef.current.loadFromJSON(jsonData, (canvas: fabric.Canvas, error: Error) => {
        if (error) {
          console.error('Error loading canvas data:', error);
          return;
        }
        
        console.log('Canvas loaded successfully, objects:', canvas.getObjects().length);
        fabricCanvasRef.current?.renderAll();
        
        // Trigger canvas change event to update layer panel
        if (onCanvasChange) {
          onCanvasChange();
        }
      });
    } catch (error) {
      console.error('Exception while loading canvas data:', error);
    }
  };

  // Expose methods through ref for parent component access
  useImperativeHandle(ref, () => ({
    addImage,
    removeSelected,
    clearCanvas,
    exportCanvas,
    getCanvasData,
    loadCanvasData,
    renderAll: () => fabricCanvasRef.current?.renderAll()
  }));

  return (
    <div className={`relative ${className}`}>
      {/* Canvas element */}
      <canvas
        ref={canvasRef}
        className="border border-gray-300 shadow-sm"
      />
      
      {/* Canvas overlay info */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {width} × {height}
        {selectedObject && (
          <span className="ml-2">
            • {selectedObject.type} selected
          </span>
        )}
      </div>
    </div>
  );
});