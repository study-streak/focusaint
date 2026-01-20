# focusaint - Complete Installation Guide

Step-by-step guide to set up and run focusaint frontend and backend modules.

## Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **Git** (optional, for cloning)

## Installation Steps

### Step 1: MongoDB Setup

#### Option A: Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB
3. Verify it's running on `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/focusaint`

### Step 2: Backend Installation & Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
# Linux/Mac:
nano .env
# Windows:
notepad .env
```

**Update .env with:**
```
MONGODB_URI=mongodb://localhost:27017/focusaint
JWT_SECRET=your_super_secret_jwt_key_change_this
CORS_ORIGIN=http://localhost:3000
PORT=5000
OTP_EXPIRY=10
```

**Start backend:**
```bash
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
✓ focusaint server running on http://localhost:5000
```

### Step 3: Frontend Installation & Setup

**In a new terminal window:**

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your settings
# Linux/Mac:
nano .env.local
# Windows:
notepad .env.local
```

**Update .env.local with:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Start frontend:**
```bash
npm run dev
```

Expected output:
```
- Local: http://localhost:3000
```

### Step 4: Verify Installation

1. **Backend Health Check:**
   - Open browser and visit: `http://localhost:5000/api/health`
   - Should return: `{"status":"Server is running","timestamp":"..."}`

2. **Frontend Landing Page:**
   - Open browser and visit: `http://localhost:3000`
   - You should see the beautiful focusaint landing page

3. **Test Authentication:**
   - Click "Sign Up" or "Login"
   - Try creating an account with your email
   - System should send OTP (simulated in development)

## Directory Structure After Installation

```
focusaint/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── server.js
│   ├── .env          ← Your local settings
│   └── package.json
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── .env.local    ← Your local settings
│   └── package.json
│
└── Documentation files
```

## Common Issues & Solutions

### "MongoDB Connection Error"
**Problem:** Backend can't connect to MongoDB
**Solution:**
1. Check MongoDB is running: `mongosh` (local) or verify Atlas connection
2. Verify MONGODB_URI in backend/.env is correct
3. Check firewall/network settings

### "CORS Error in Browser Console"
**Problem:** Frontend can't communicate with backend
**Solution:**
1. Verify backend is running on `http://localhost:5000`
2. Check NEXT_PUBLIC_API_URL in frontend/.env.local
3. Ensure CORS_ORIGIN in backend/.env is `http://localhost:3000`

### "Port 3000 or 5000 Already in Use"
**Problem:** Another application is using the port
**Solution:**
```bash
# Find and kill process using port 5000
# Linux/Mac:
lsof -ti:5000 | xargs kill -9
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "npm install fails"
**Problem:** Dependency installation errors
**Solution:**
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`

### "Module not found" errors in frontend
**Problem:** Path aliases not working
**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`

## Development Tips

### Hot Reload
- **Frontend:** Changes auto-reload on save
- **Backend:** Changes auto-reload with nodemon

### Database Inspection
```bash
# Local MongoDB GUI
# Use MongoDB Compass or mongosh
mongosh
use focusaint
db.users.find()
```

### API Testing
```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Browser DevTools
- Open DevTools: F12 or Right-click → Inspect
- **Network tab:** Monitor API calls
- **Console tab:** Check for JavaScript errors
- **Application tab:** Inspect localStorage (JWT tokens)

## Next Steps After Installation

1. **Explore the Landing Page**
   - Scroll through different sections
   - Check responsive design on mobile (DevTools → Toggle device toolbar)

2. **Test Authentication Flow**
   - Sign up with an email
   - Note the OTP (in dev mode, check console)
   - Login with your credentials
   - Explore the dashboard

3. **Log Habit Sessions**
   - Try logging study sessions
   - Check streak calculation
   - View analytics charts

4. **Update Your Profile**
   - Go to profile page
   - Update learning goals and preferences

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/focusaint |
| JWT_SECRET | Secret for signing JWT tokens | your_secret_key |
| CORS_ORIGIN | Allowed frontend origin | http://localhost:3000 |
| PORT | Backend server port | 5000 |
| OTP_EXPIRY | OTP expiration in minutes | 10 |

### Frontend (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API base URL | http://localhost:5000/api |

## Building for Production

### Frontend Production Build
```bash
cd frontend
npm run build
npm start
```

### Backend Production Deployment
```bash
cd backend
# Install only production dependencies
npm ci --only=production
# Set environment variables on your hosting platform
# Deploy to Vercel, Railway, Render, or your preferred platform
```

## Helpful Commands

```bash
# Backend commands
cd backend
npm run dev          # Development with auto-reload
npm start            # Production mode
npm install          # Install dependencies

# Frontend commands
cd frontend
npm run dev          # Development with hot-reload
npm run build        # Production build
npm start            # Run production build
npm install          # Install dependencies

# Database
mongosh              # Access local MongoDB
```

## Need Help?

1. **Check individual READMEs:**
   - `backend/README.md` - Backend documentation
   - `frontend/README.md` - Frontend documentation

2. **Review logs:**
   - Backend console for API errors
   - Frontend browser console for client errors
   - Network tab for API request details

3. **Verify setup:**
   - Backend health: `http://localhost:5000/api/health`
   - Frontend: `http://localhost:3000`
   - MongoDB: `mongosh` command

## Troubleshooting Checklist

- [ ] Node.js version 16+: `node --version`
- [ ] npm installed: `npm --version`
- [ ] MongoDB running (local or Atlas accessible)
- [ ] Backend .env file created and configured
- [ ] Frontend .env.local file created and configured
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access backend health endpoint
- [ ] Can access frontend landing page
- [ ] No CORS errors in browser console

## Success Indicators

✓ Backend server running on http://localhost:5000
✓ Frontend server running on http://localhost:3000
✓ Landing page displays beautiful UI with animations
✓ Can navigate to login/signup pages
✓ Can create account and see dashboard
✓ Analytics charts render correctly
✓ No errors in browser console or backend terminal

You're all set! Start exploring focusaint!
