import React from 'react';
import { fabric } from 'fabric';

interface LayerPanelProps {
  canvas: fabric.Canvas | null;
  className?: string;
}

/**
 * Simplified LayerPanel Component
 * 
 * Temporarily simplified to avoid infinite render loops.
 * Shows basic information without complex state management.
 */
export const LayerPanel: React.FC<LayerPanelProps> = ({ 
  canvas, 
  className = '' 
}) => {
  // Get object count safely
  const objectCount = canvas ? canvas.getObjects().length : 0;

  return (
    <div className={`bg-gray-800 text-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium">Layers</h3>
      </div>

      {/* Simple Status */}
      <div className="p-4 text-center text-gray-400 text-sm">
        {objectCount === 0 ? (
          "No layers yet. Add images or shapes to see them here."
        ) : (
          `${objectCount} object${objectCount === 1 ? '' : 's'} on canvas`
        )}
      </div>

      {/* Placeholder for future functionality */}
      <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
        Layer management coming soon...
      </div>
    </div>
  );
};