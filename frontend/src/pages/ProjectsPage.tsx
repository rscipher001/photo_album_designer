import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json() as Promise<{ projects: Project[] }>;
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">Failed to load projects</p>
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">Manage your wedding album projects</p>
        </div>
        <Link
          to="/editor"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first wedding album to get started</p>
          <Link
            to="/editor"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {project.pageCount} page{project.pageCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/editor/${project.id}`}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm font-medium text-center transition-colors"
                  >
                    Edit
                  </Link>
                  <button className="px-3 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded text-sm font-medium transition-colors">
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}