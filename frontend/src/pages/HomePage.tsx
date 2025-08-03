import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Create Beautiful Wedding Albums
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Design stunning wedding albums with our professional tools. Upload photos, 
          arrange layouts, and create memories that last forever.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/editor"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Start Creating
          </Link>
          <Link
            to="/projects"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo Management</h3>
          <p className="text-gray-600">
            Browse existing photos or upload new ones. Organize and manage your wedding photos effortlessly.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Editing</h3>
          <p className="text-gray-600">
            Crop, rotate, and enhance your photos with our intuitive editing tools and filters.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Layouts</h3>
          <p className="text-gray-600">
            Choose from professional templates or create custom layouts with drag-and-drop simplicity.
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          Create your first wedding album in minutes with our easy-to-use designer.
        </p>
        <Link
          to="/editor"
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Create New Album
        </Link>
      </div>
    </div>
  );
}