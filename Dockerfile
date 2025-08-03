# Multi-stage build for production
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:18-alpine AS backend

WORKDIR /app

# Install sharp for image processing
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

# Create directories for image storage
RUN mkdir -p /app/storage/uploads /app/storage/thumbnails /app/storage/projects

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]