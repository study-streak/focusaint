# focusaint Deployment Guide - Monorepo

This guide covers deploying the focusaint monorepo frontend and backend to production environments with npm workspaces.

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│    focusaint Monorepo (GitHub)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────┐ ┌──────────────┐ │
│  │ frontend/        │ │ backend/     │ │
│  │ (Next.js)        │ │ (Express.js) │ │
│  └──────────────────┘ └──────────────┘ │
│           ↓                    ↓        │
│       Vercel          Railway/Heroku   │
│      (Frontend)         (Backend API)  │
│           ↓                    ↓        │
│      focusaint.com      api.focusaint.com│
│                                         │
│         ┌──────────────────────┐       │
│         │  MongoDB Atlas       │       │
│         │  (Shared Database)   │       │
│         └──────────────────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

## Prerequisites

- GitHub repository with monorepo code
- Vercel account (for frontend)
- Railway/Heroku account (for backend)
- MongoDB Atlas account (for database)
- npm workspaces enabled locally

## Part 1: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Production

```bash
# From root directory
npm run build:frontend

# Test production build
cd frontend
npm run start
```

### Step 2: Connect to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
cd frontend
vercel
```

**Option B: GitHub Integration (Recommended)**
1. Push monorepo to GitHub
2. Go to https://vercel.com
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure project settings

### Step 3: Configure Vercel Project

1. **Framework Preset**: Select "Next.js"
2. **Root Directory**: Set to `frontend` (important for monorepo)
3. **Build Command**: `npm run build:frontend`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`
6. **Environment Variables**: Add `NEXT_PUBLIC_API_URL`

### Step 4: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.focusaint.com/api
```

Replace `api.focusaint.com` with your actual backend domain.

### Step 5: Deploy

Click "Deploy" button - Vercel will automatically:
- Build the frontend with workspaces
- Optimize for production
- Deploy to edge network
- Provision SSL certificate

### Step 6: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., focusaint.com)
3. Update DNS records per Vercel instructions
4. SSL is automatically provisioned

## Part 2: Backend Deployment (Railway)

### Step 1: Prepare Backend for Production

```bash
# From root directory
npm run build:backend

# Test backend production build
cd backend
npm run start
```

### Step 2: Create Railway Account & Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "GitHub" and connect
4. Select your monorepo repository
5. Railway will auto-detect services

### Step 3: Add Service Configuration

Create `backend/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "cd backend && npm install && npm run build:backend"

[deploy]
startCommand = "cd backend && npm run start:backend"

[[services]]
name = "backend"
```

Or create `backend/railway.json`:

```json
{
  "builder": "nixpacks",
  "buildCommand": "npm install && npm run build:backend",
  "startCommand": "npm start:backend"
}
```

### Step 4: Set Environment Variables in Railway

In Railway Dashboard → Variables:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/focusaint
JWT_SECRET=your-production-secret-key-here
PORT=5000
NODE_ENV=production
OTP_EXPIRY=10
```

**Important**: Keep `JWT_SECRET` very secure and unique.

### Step 5: Connect MongoDB

**Option A: Use Railway's MongoDB Integration**
- Click "Add Service" → Select "MongoDB"
- Railway auto-connects and sets connection string

**Option B: Use MongoDB Atlas**
- Get connection string from Atlas dashboard
- Add to `MONGODB_URI` environment variable

### Step 6: Deploy Backend

1. In Railway Dashboard, click "Deploy"
2. Railway builds and deploys your backend
3. Get your public URL (e.g., `focusaint-api.up.railway.app`)
4. Update frontend `NEXT_PUBLIC_API_URL` in Vercel

### Step 7: Configure Custom Domain (Optional)

1. In Railway → Settings → Domains
2. Add your domain (e.g., api.focusaint.com)
3. Configure DNS records
4. SSL is auto-provisioned

## Part 3: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create organization: "focusaint"
3. Create project: "focusaint Production"
4. Create cluster:
   - Cluster Tier: M0 (free) for MVP
   - Cloud Provider: AWS/GCP/Azure
   - Region: Choose closest to users
5. Click "Create Cluster"

### Step 2: Create Database User

1. Go to Database Access
2. Click "Add New Database User":
   - Username: `focusaint_prod`
   - Password: Generate strong password
   - Database Privileges: Read and write to any database
3. Click "Add User"

### Step 3: Whitelist IP Addresses

1. Go to Network Access
2. Click "Add IP Address":
   - Option A: For production, add specific IPs
   - Option B: For MVP, add `0.0.0.0/0` (all IPs)
3. Click "Confirm"

**Security Note**: In production, add only specific server IPs.

### Step 4: Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Copy connection string:

```
mongodb+srv://focusaint_prod:PASSWORD@cluster0.xxxxx.mongodb.net/focusaint?retryWrites=true&w=majority
```

Replace `PASSWORD` with the database user password.

### Step 5: Add to Backend Environment

In Railway or Heroku, set:

```
MONGODB_URI=mongodb+srv://focusaint_prod:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/focusaint?retryWrites=true&w=majority
```

## Part 4: Environment Variables Summary

### Frontend (`frontend/.env.production`)
```env
NEXT_PUBLIC_API_URL=https://api.focusaint.com/api
```

### Backend (`backend/.env.production`)
```env
MONGODB_URI=mongodb+srv://focusaint_prod:PASSWORD@cluster0.xxxxx.mongodb.net/focusaint
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters
PORT=5000
NODE_ENV=production
OTP_EXPIRY=10
```

## Part 5: Verify Deployments

### Frontend Verification
```bash
# Test frontend deployment
curl https://focusaint.com

# Check API connectivity
# Open browser DevTools and verify NEXT_PUBLIC_API_URL
```

### Backend Verification
```bash
# Test backend is running
curl https://api.focusaint.com/api/health

# Check MongoDB connection
# Monitor should show active connection
```

### Full Flow Test
1. Visit https://focusaint.com
2. Create new account with email
3. Verify email receives OTP
4. Complete signup
5. Access dashboard
6. Log a habit session
7. Verify data in MongoDB Atlas

## Backend Deployment Alternative (Heroku)

### Step 1: Install Heroku CLI

```bash
brew install heroku
heroku login
```

### Step 2: Create Heroku App

```bash
cd backend
heroku create focusaint-api
```

### Step 3: Set Environment Variables

```bash
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set OTP_EXPIRY=10
```

### Step 4: Create Procfile

Create `backend/Procfile`:

```
web: node server.js
```

### Step 5: Deploy

```bash
git push heroku main
```

### Step 6: View Logs

```bash
heroku logs --tail
```

## Continuous Integration / Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Frontend to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod --cwd ./frontend'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Backend to Railway
        run: |
          npm install -g @railway/cli
          railway up --cwd ./backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Production Checklist

- [ ] Frontend deployed to Vercel with custom domain
- [ ] Backend deployed to Railway/Heroku with custom domain
- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables set in all services
- [ ] SSL certificates provisioned on both services
- [ ] Database backups configured (Atlas backup schedule)
- [ ] Monitoring enabled (Vercel Analytics, Railway monitoring)
- [ ] Error tracking configured (optional: Sentry)
- [ ] Email service tested (OTP delivery verified)
- [ ] Full authentication flow tested
- [ ] Habit tracking tested end-to-end
- [ ] Performance optimized (images, bundles)
- [ ] Security reviewed (JWT, CORS, input validation)
- [ ] Database indexes created for queries
- [ ] Rate limiting configured on backend
- [ ] CORS properly configured to trusted domains only

## Monitoring & Maintenance

### Vercel Monitoring
- Dashboard → Analytics: View performance metrics
- Dashboard → Activity: Recent deployments and logs
- Email alerts: Errors and performance issues

### Railway Monitoring
- Dashboard → Metrics: CPU, memory, network usage
- Dashboard → Logs: Real-time application logs
- Alerts: Configure uptime/error alerts

### MongoDB Atlas Monitoring
- Metrics: Database performance charts
- Alerts: Configure alerts for replication lag, etc.
- Backups: Automated daily backups

## Rollback Procedure

### Frontend (Vercel)
1. Go to Deployments
2. Select previous successful deployment
3. Click "Promote to Production"

### Backend (Railway)
1. Go to Deployments
2. Select previous successful deployment
3. Click "Deploy"

### Backend (Heroku)
```bash
heroku releases
heroku rollback v5
```

## Security Best Practices

1. **JWT Secret**: Use strong, random secret (32+ characters)
2. **MongoDB**: Enable encryption at rest and in transit
3. **CORS**: Restrict to specific frontend domain only
4. **Rate Limiting**: Implement on all API endpoints
5. **Input Validation**: Validate all user inputs server-side
6. **HTTPS**: All communication must be HTTPS
7. **Secrets Management**: Never commit `.env` files
8. **Dependency Updates**: Keep packages updated
9. **Monitoring**: Set up alerts for errors/anomalies
10. **Backups**: Regular automated backups

## Troubleshooting

### Frontend Won't Deploy
- Check build logs in Vercel
- Verify `frontend/.env.production` variables
- Ensure root directory is set to `frontend`

### Backend Won't Start
- Check Railway/Heroku logs
- Verify MongoDB connection string is correct
- Confirm all environment variables are set

### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify backend is running and healthy
- Check CORS configuration in backend

### Database Connection Timeout
- Verify MongoDB Atlas IP whitelist
- Test connection string locally
- Check network connectivity

## Next Steps

1. Monitor production metrics daily
2. Set up automated backups
3. Plan for scaling
4. Consider CDN for static assets
5. Implement advanced caching strategies

## Support & Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://railway.app/docs)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas)
- [Heroku Docs](https://devcenter.heroku.com)

For issues: Check [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md) and [README.md](./README.md)
