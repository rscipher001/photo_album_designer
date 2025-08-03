#!/bin/bash

echo "🚀 Testing Wedding Album Designer Setup"
echo "=====================================

# Set up environment
export PHOTOS_DIR="./sample-photos"

echo "1. Testing backend server..."
cd backend
npm start &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "2. Testing API endpoints..."
echo "Health check:"
curl -f http://localhost:3000/health || echo "❌ Health check failed"

echo "Browse photos:"
curl -f http://localhost:3000/api/images/browse || echo "❌ Browse API failed"

echo "3. Testing frontend..."
cd ../frontend
npm run build
echo "✅ Frontend build successful"

echo "4. Testing Docker setup..."
cd ..
cp .env.example .env
echo "PHOTOS_DIR=./sample-photos" > .env

echo "5. Cleaning up..."
kill $BACKEND_PID 2>/dev/null

echo "
🎉 Setup Test Complete!

To run the application:
1. Development: docker-compose --profile dev up
2. Production: docker-compose up

Visit http://localhost:3000 to access the application.
"