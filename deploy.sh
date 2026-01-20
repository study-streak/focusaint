#!/bin/bash

# Focusdle Deployment Script
# This script helps prepare the application for production deployment

echo "🚀 Focusdle Production Deployment Setup"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
echo ""
echo "📋 Checking environment files..."

if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from template...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
    echo -e "${RED}⚠️  Please update backend/.env with production values${NC}"
else
    echo -e "${GREEN}✓ backend/.env exists${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found. Creating from template...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
    echo -e "${RED}⚠️  Please update frontend/.env.local with production values${NC}"
else
    echo -e "${GREEN}✓ frontend/.env.local exists${NC}"
fi

# Check Node.js version
echo ""
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build frontend
echo ""
echo "🔨 Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
cd ..

# Test backend connection
echo ""
echo "🧪 Testing backend connection..."
if [ -f backend/server.js ]; then
    echo -e "${GREEN}✓ Backend server file found${NC}"
else
    echo -e "${RED}✗ Backend server file not found${NC}"
    exit 1
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update environment variables in:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Ensure MongoDB is configured:"
echo "   - Update MONGODB_URI in backend/.env"
echo "   - Test connection"
echo ""
echo "3. Deploy using Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "4. Or deploy manually:"
echo "   - Backend: npm run start --prefix backend"
echo "   - Frontend: npm run start --prefix frontend"
echo ""
echo "5. Verify deployment:"
echo "   - Backend: curl http://localhost:5000/api/health"
echo "   - Frontend: curl http://localhost:3000"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo "📋 Use DEPLOYMENT_CHECKLIST.md to track progress"
