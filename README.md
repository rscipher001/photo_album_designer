# Wedding Album Designer

A modern web application for creating beautiful wedding albums with drag-and-drop functionality, image editing capabilities, and professional layout templates.

## Features

- **Image Management**: Browse existing photo directories and upload new images
- **Professional Editing**: Crop, rotate, resize images with non-destructive editing
- **Layout Builder**: Drag-and-drop interface with professional templates
- **Layer System**: Advanced layer management similar to Photoshop
- **Smart Generation**: AI-powered auto-arrangement and creative layouts
- **Export Options**: High-quality export in multiple formats

## Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **Sharp**: High-performance image processing
- **Multer**: File upload handling
- **File System**: Local storage for images and projects

### Frontend
- **React + TypeScript**: Modern component-based UI
- **Vite**: Fast development and building
- **Fabric.js**: Canvas-based image editing
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)

### Production Setup

1. **Clone and configure**:
```bash
git clone <repository>
cd album-designer
cp .env.example .env
```

2. **Set your photo directory in .env**:
```bash
PHOTOS_DIR=/path/to/your/wedding/photos
```

3. **Start the application**:
```bash
docker-compose up -d
```

4. **Access the application**:
   - Open http://localhost:3000
   - Browse existing photos from your configured directory
   - Upload new images via the interface

### Development Setup

1. **Start development environment**:
```bash
docker-compose --profile dev up
```

2. **Or run locally**:
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Project Structure

```
album-designer/
├── backend/                 # Node.js API server
│   ├── src/routes/         # API endpoints
│   ├── src/services/       # Business logic
│   └── server.js          # Main server file
├── frontend/               # React frontend
│   ├── src/components/    # UI components
│   ├── src/hooks/         # Custom React hooks
│   └── src/stores/        # State management
├── storage/               # Persistent data
│   ├── uploads/          # User uploaded images
│   ├── thumbnails/       # Generated thumbnails
│   └── projects/         # Saved album projects
└── docker-compose.yml    # Container orchestration
```

## API Endpoints

### Images
- `GET /api/images/browse?path=<path>` - Browse photo directories
- `GET /api/images/serve?path=<path>` - Serve original images
- `GET /api/images/thumbnail?path=<path>&size=<size>` - Serve thumbnails

### Upload
- `POST /api/upload/single` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images
- `DELETE /api/upload/<filename>` - Delete uploaded image

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/<id>` - Update project
- `DELETE /api/projects/<id>` - Delete project

## Configuration

### Environment Variables

- `PHOTOS_DIR`: Path to existing photo directory (required)
- `UPLOAD_DIR`: Directory for uploaded files (default: ./storage/uploads)
- `THUMBNAIL_DIR`: Directory for thumbnails (default: ./storage/thumbnails)
- `PROJECT_DIR`: Directory for project files (default: ./storage/projects)
- `MAX_UPLOAD_SIZE`: Maximum upload size (default: 50mb)
- `THUMBNAIL_SIZES`: Comma-separated thumbnail sizes (default: 150,300,600)
- `PORT`: Server port (default: 3000)

### Storage

The application uses local file system storage:
- **Photos**: Read-only access to your existing photo directories
- **Uploads**: New uploaded images stored in `./storage/uploads`
- **Thumbnails**: Automatically generated and cached in `./storage/thumbnails`
- **Projects**: Album projects saved as JSON in `./storage/projects`

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Build frontend
cd frontend && npm run build

# Builds to backend/public directory
```

### Code Quality
```bash
# Lint frontend
cd frontend && npm run lint

# Type checking
cd frontend && npm run type-check
```

## License

MIT License - see LICENSE file for details