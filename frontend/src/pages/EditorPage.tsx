import { useParams } from 'react-router-dom';

export function EditorPage() {
  const { projectId } = useParams();

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            {projectId ? 'Edit Project' : 'New Project'}
          </h1>
          <div className="text-sm text-gray-400">
            Project ID: {projectId || 'New'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
            Save
          </button>
          <button className="px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded text-sm transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Tools</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                Select
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm transition-colors">
                Crop
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm transition-colors">
                Rotate
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm transition-colors">
                Text
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Photos</h3>
            <div className="bg-gray-700 rounded p-4 text-center text-sm text-gray-400">
              Photo browser coming soon...
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Layers</h3>
            <div className="bg-gray-700 rounded p-4 text-center text-sm text-gray-400">
              Layer panel coming soon...
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-700 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
                <span className="text-sm text-gray-400">100%</span>
              </div>
              
              <div className="text-sm text-gray-400">
                1920 × 1080
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-gray-900 p-8 overflow-hidden">
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded shadow-lg" style={{ width: '800px', height: '600px' }}>
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">Canvas Area</p>
                    <p className="text-sm">Drag photos here to start designing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Properties</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Width</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  defaultValue={1920}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Height</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  defaultValue={1080}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Pages</h3>
            <div className="space-y-2">
              <div className="bg-gray-700 rounded p-2 border border-primary-600">
                <div className="text-sm">Page 1</div>
                <div className="text-xs text-gray-400">1920 × 1080</div>
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