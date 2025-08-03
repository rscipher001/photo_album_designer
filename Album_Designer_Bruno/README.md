# Album Designer API - Bruno Collection

This Bruno collection provides comprehensive API documentation and testing for the Wedding Album Designer application.

## 📚 Collection Overview

The collection is organized into the following categories:

### 🏥 Health
- **Health Check**: Verify server status and configuration

### 🖼️ Image Management
- **Browse Images**: Navigate photo directories
- **Browse Subdirectory**: Example of subdirectory navigation
- **Serve Image**: Get original image files
- **Get Thumbnail**: Generate and serve cached thumbnails

### 📤 Upload
- **Upload Single Image**: Upload individual files
- **Upload Multiple Images**: Batch upload up to 10 files
- **Delete Uploaded File**: Remove uploaded files and thumbnails
- **Upload Info**: Get upload configuration and constraints

### 📋 Projects
- **Get All Projects**: List all album projects
- **Get Project by ID**: Retrieve specific project data
- **Create New Project**: Create new album projects
- **Update Project**: Save canvas state and project changes
- **Delete Project**: Permanently remove projects
- **Duplicate Project**: Create copies of existing projects

## 🚀 Quick Start

1. **Install Bruno**: Download from [usebruno.com](https://usebruno.com)

2. **Open Collection**: 
   - Launch Bruno
   - Click "Open Collection"
   - Select the `Album_Designer_Bruno` folder

3. **Set Environment**:
   - Select "Local" environment
   - Verify `baseUrl` is set to `http://localhost:3000`

4. **Start Testing**:
   - Ensure the Album Designer server is running
   - Run any request to test the API

## 🛠️ Environment Configuration

The collection includes a **Local** environment with these variables:

```
baseUrl: http://localhost:3000
apiUrl: {{baseUrl}}/api
```

For different environments (staging, production), create new environment files and update the `baseUrl` accordingly.

## 📖 API Documentation

Each request includes comprehensive documentation covering:

- **Purpose**: What the endpoint does
- **Parameters**: Required and optional parameters
- **Request/Response Examples**: Sample data formats
- **Error Handling**: Possible error responses
- **Features**: Special capabilities and behaviors
- **Use Cases**: When and how to use the endpoint

## 🧪 Testing Features

All requests include automated tests that verify:

- ✅ Correct HTTP status codes
- ✅ Response data structure
- ✅ Required fields presence
- ✅ Data type validation
- ✅ Business logic validation

## 🔧 Common Use Cases

### Image Management Workflow
1. **Browse Images** → Get list of available photos
2. **Get Thumbnail** → Display preview images
3. **Serve Image** → Load full-resolution images for editing

### Upload Workflow
1. **Upload Info** → Check constraints before upload
2. **Upload Single/Multiple Images** → Add new photos
3. **Browse Images** → Verify uploads appeared in listing

### Project Workflow
1. **Create New Project** → Start a new album
2. **Update Project** → Save canvas state and changes
3. **Get All Projects** → List projects for user selection
4. **Duplicate Project** → Create variations or backups

## 🔍 Testing Tips

### File Upload Testing
- Use actual image files (JPG/PNG) for upload tests
- Update file paths in upload requests to point to real files
- Test with different file sizes to verify constraints

### Project Testing
- Create a project first, then use its ID for other operations
- Test with realistic canvas data including image elements
- Verify auto-save functionality with frequent updates

### Error Testing
- Test with invalid file types for uploads
- Try accessing non-existent projects
- Test path traversal security with malicious paths

## 🔒 Security Considerations

The API includes several security measures that are tested:

- **Path Traversal Protection**: Upload and image serving endpoints prevent access outside allowed directories
- **File Type Validation**: Only JPG and PNG files are accepted for uploads
- **Size Limits**: Files are limited to 50MB to prevent abuse
- **CORS Configuration**: Cross-origin requests are properly configured

## 🐛 Troubleshooting

### Server Not Responding
- Verify the Album Designer server is running on port 3000
- Check the `baseUrl` in the Local environment matches your server
- Ensure no firewall is blocking the connection

### Upload Failures
- Verify file paths exist and are accessible
- Check file types are JPG or PNG
- Ensure files are under 50MB
- Verify server has write permissions to upload directory

### Project Errors
- Ensure proper UUID format for project IDs
- Verify JSON structure for project updates
- Check that project files aren't corrupted

## 📞 Support

For API issues or questions:
- Check the server logs for detailed error messages
- Verify request format matches the documented examples
- Ensure all required parameters are provided
- Test with minimal data first, then add complexity

---

Happy testing! 🎉