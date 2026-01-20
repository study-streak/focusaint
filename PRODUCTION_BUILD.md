# Production Build Optimization Guide

## Building for Production

### Frontend Optimization

#### 1. Next.js Production Build
```bash
cd frontend

# Build for production
npm run build

# Test production build locally
npm run start
```

#### 2. Bundle Analysis
Install bundle analyzer:
```bash
npm install --save-dev @next/bundle-analyzer

# Configure next.config.mjs
```

#### 3. Performance Metrics
Monitor these metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

#### 4. Image Optimization
- Use Next.js Image component for automatic optimization
- Convert images to WebP format
- Use appropriate dimensions for each breakpoint
- Lazy load images below the fold

#### 5. Code Splitting
- Automatic route-based code splitting (Next.js default)
- Dynamic imports for large components
- Remove unused dependencies

### Backend Optimization

#### 1. Production Dependencies
```bash
cd backend

# Install only production dependencies
npm ci --only=production
```

#### 2. Performance Optimization
- Enable database indexing
- Cache frequently accessed data
- Implement request compression
- Use connection pooling
- Monitor query performance

#### 3. Security Headers
Add to server.js:
```javascript
import helmet from 'helmet';
app.use(helmet());
```

#### 4. Rate Limiting
```bash
npm install express-rate-limit
```

---

## Docker Production Build

### Multi-stage Build for Frontend
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### Build Docker Image
```bash
# Backend
cd backend
docker build -t focusdle-backend:1.0.0 .

# Frontend
cd frontend
docker build -t focusdle-frontend:1.0.0 .

# Push to registry (Docker Hub, ECR, etc)
docker tag focusdle-backend:1.0.0 yourusername/focusdle-backend:1.0.0
docker push yourusername/focusdle-backend:1.0.0
```

---

## Environment Variables

### Production Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/focusaint
JWT_SECRET=use_strong_random_string_min_32_chars
CORS_ORIGIN=https://yourdomain.com
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
LOG_LEVEL=error
```

### Production Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=Focusdle
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Deployment Platforms

### Vercel (Frontend - Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
```

### Railway (Full Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Docker Compose (Self-hosted)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Monitoring & Logging

### Error Tracking
```bash
# Install Sentry
npm install @sentry/next @sentry/node
```

### Analytics
- Vercel Analytics (included with Vercel)
- Google Analytics
- Mixpanel
- Custom analytics

### Logging
```javascript
// Example: Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

export default logger;
```

---

## Performance Checklist

### Frontend
- [ ] npm run build succeeds
- [ ] Build size < 500KB
- [ ] No warnings or errors
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] CSS minified
- [ ] JavaScript minified

### Backend
- [ ] All endpoints responding < 200ms
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health check endpoint working

### Database
- [ ] Indexes created on frequently queried fields
- [ ] Query performance optimized
- [ ] Backup enabled
- [ ] Monitoring enabled

---

## Security Checklist

- [ ] HTTPS/SSL enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention (MongoDB injection)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Password hashing verified
- [ ] Secrets not in version control
- [ ] Security headers configured

---

## Troubleshooting

### High Memory Usage
- Check for memory leaks
- Increase container memory limits
- Profile with Node.js profiler

### Slow API Responses
- Check database query performance
- Add indexes to frequently queried fields
- Implement caching
- Monitor CPU usage

### Failed Deployments
- Check build logs
- Verify environment variables
- Check file permissions
- Verify database connectivity

---

## Commands Reference

```bash
# Frontend
npm run dev              # Development
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Lint code

# Backend
npm run dev              # Development with nodemon
npm start                # Production

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs

# Database
mongosh "mongodb+srv://user:pass@cluster/db" # Connect to MongoDB
```

---

**Last Updated:** January 20, 2026
**Version:** 1.0.0
