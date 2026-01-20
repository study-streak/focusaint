# Focusdle Deployment Guide

## Production Deployment Instructions

### Prerequisites
- Node.js 18+ and npm installed
- MongoDB Atlas account (or self-hosted MongoDB)
- Environment with HTTPS support
- Git for version control

---

## 1. Backend Deployment (Express.js)

### Hosting Options
- **Heroku** (simple, free tier available)
- **Railway** (easy deployment)
- **DigitalOcean** (VPS)
- **AWS EC2** (scalable)
- **Render** (free tier available)

### Steps for Railway/Heroku

#### 1.1 Prepare Backend
```bash
cd backend
npm install
npm test  # If tests exist
```

#### 1.2 Set Environment Variables
Create `.env` file in backend folder with:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/focusaint
JWT_SECRET=your_secure_random_string_here
CORS_ORIGIN=https://your-frontend-domain.com
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

#### 1.3 Update package.json
Ensure scripts are:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 1.4 Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Deploy
railway up
```

---

## 2. Frontend Deployment (Next.js)

### Hosting Options
- **Vercel** (recommended, free tier)
- **Netlify** (free tier available)
- **AWS Amplify**
- **Firebase Hosting**

### Steps for Vercel (Recommended)

#### 2.1 Prepare Frontend
```bash
cd frontend
npm install
npm run build  # Build for production
```

#### 2.2 Set Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_APP_NAME=Focusdle
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### 2.3 Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

Or connect GitHub:
1. Push code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Select your repository
5. Set environment variables
6. Deploy

---

## 3. Database Setup (MongoDB Atlas)

### Create MongoDB Atlas Cluster
1. Go to mongodb.com/cloud/atlas
2. Create account or login
3. Create new cluster
4. Configure security (IP whitelist, credentials)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/focusaint`
6. Add to backend `.env` as `MONGODB_URI`

---

## 4. Environment Variables Checklist

### Backend (.env)
- [ ] NODE_ENV=production
- [ ] PORT=5000 (or assigned port)
- [ ] MONGODB_URI=mongodb+srv://...
- [ ] JWT_SECRET=random_secure_string
- [ ] CORS_ORIGIN=https://your-frontend.com
- [ ] EMAIL_SERVICE=gmail
- [ ] EMAIL_USER=your_email@gmail.com
- [ ] EMAIL_PASSWORD=app_password

### Frontend (.env.local)
- [ ] NEXT_PUBLIC_API_URL=https://your-backend-api.com
- [ ] NEXT_PUBLIC_APP_NAME=Focusdle
- [ ] NEXT_PUBLIC_ENABLE_ANALYTICS=true

---

## 5. Production Checklist

### Security
- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS on all domains
- [ ] Set secure CORS_ORIGIN
- [ ] Configure MongoDB IP whitelist
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API
- [ ] Add CSRF protection
- [ ] Use secure HTTP headers

### Performance
- [ ] Build frontend: `npm run build`
- [ ] Minify and optimize assets
- [ ] Enable gzip compression
- [ ] Set up CDN for static files
- [ ] Configure caching headers
- [ ] Monitor database performance

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable analytics
- [ ] Monitor API response times
- [ ] Set up alerts for errors
- [ ] Monitor database usage
- [ ] Check server logs regularly

### Testing
- [ ] Test authentication flow
- [ ] Test all API endpoints
- [ ] Verify email notifications
- [ ] Test streak calculation
- [ ] Test session logging
- [ ] Cross-browser testing

---

## 6. Post-Deployment

### Verify Deployment
```bash
# Test backend health check
curl https://your-backend-api.com/api/health

# Test frontend accessibility
curl https://your-frontend-domain.com
```

### Enable Monitoring
1. Set up error tracking (e.g., Sentry)
2. Enable analytics (Vercel Analytics)
3. Set up database monitoring
4. Configure email alerts

### Backup Strategy
- Enable MongoDB automatic backups
- Set retention policy to 30+ days
- Test restore procedures regularly

---

## 7. Troubleshooting

### Common Issues

**CORS Error**
- Check CORS_ORIGIN in backend matches frontend URL
- Ensure frontend URL has no trailing slash

**Database Connection Error**
- Verify MONGODB_URI is correct
- Check IP whitelist in MongoDB Atlas
- Test connection locally first

**API Not Responding**
- Check backend logs
- Verify environment variables are set
- Check firewall/security group rules

**Frontend Build Failed**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check for TypeScript errors

---

## 8. Scaling Considerations

For high-traffic deployments:
- Use database indexing
- Implement caching layer (Redis)
- Set up load balancer
- Use CDN for static files
- Implement rate limiting
- Set up auto-scaling

---

## Support & Resources

- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app/)

---

**Last Updated:** January 20, 2026
**Version:** 1.0.0
