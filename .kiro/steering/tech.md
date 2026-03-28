# Technology Stack

## Architecture

Monorepo architecture using npm workspaces with independent frontend and backend services.

## Frontend

### Core Technologies
- Next.js 16 (App Router)
- React 19.2
- TypeScript 5
- Tailwind CSS 4

### Key Libraries
- shadcn/ui (50+ components)
- Framer Motion (animations)
- Recharts (data visualization)
- Radix UI (accessible primitives)
- Zod (validation)
- React Hook Form (forms)

### Build Tools
- Turbopack (Next.js bundler)
- PostCSS
- TypeScript compiler

## Backend

### Core Technologies
- Express.js 5
- Node.js (ES modules)
- MongoDB with Mongoose 9

### Key Libraries
- JWT (authentication)
- bcryptjs (password hashing)
- Nodemailer (email service)
- Multer (file uploads)
- express-rate-limit (API protection)

### Database
- MongoDB 7.0 (local or Atlas)
- Mongoose ODM for schema management

## Development Tools

- Nodemon (backend hot reload)
- Concurrently (run multiple services)
- Docker & Docker Compose (containerization)

## Common Commands

### Installation
```bash
npm install                    # Install all dependencies (root + workspaces)
```

### Development
```bash
npm run dev                    # Run both frontend and backend
npm run dev:frontend          # Frontend only (port 3000)
npm run dev:backend           # Backend only (port 5000)
```

### Building
```bash
npm run build                  # Build all packages
npm run build:frontend        # Frontend production build
npm run build:backend         # Backend build
```

### Production
```bash
npm start                      # Start all services
npm start:frontend            # Frontend production server
npm start:backend             # Backend production server
```

### Docker
```bash
docker-compose up -d          # Start all services in containers
docker-compose logs -f        # View logs
docker-compose down           # Stop all services
```

### Testing & Quality
```bash
npm run lint                   # Lint all packages
npm run lint:frontend         # Frontend linting
npm run lint:backend          # Backend linting
npm test                      # Run all tests
```

## Environment Configuration

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/focusaint
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_USER=your-email
EMAIL_PASSWORD=your-app-password
```

## Deployment Platforms

- Frontend: Vercel (recommended)
- Backend: Railway, Render, or any Node.js host
- Database: MongoDB Atlas (cloud)
- Containerized: Docker Compose for full stack
