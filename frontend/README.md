# focusaint Frontend

A modern, interactive Next.js frontend for the focusaint productivity platform with beautiful animations, responsive design, and seamless API integration.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running

Development mode with hot reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

Frontend runs on `http://localhost:3000`

## Pages & Features

### Public Pages
- **Landing Page** - Beautiful homepage with animations, company story, team, and contact
  - Interactive navbar with smooth scrolling
  - Hero section with animated background orbs
  - Features showcase with trust colors
  - Company timeline and backstory
  - Team member profiles
  - Contact form
  - Footer with links

### Authentication Pages
- **Login** - Email/OTP authentication with animated form
- **Signup** - User registration with learning goals

### Protected Pages
- **Dashboard** - Main hub with stats, streak tracking, and session logging
  - Real-time analytics
  - Weekly activity charts
  - Session duration tracking
  - Streak information
- **Profile** - User profile settings and preferences

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── login/page.tsx     # Login page
│   ├── signup/page.tsx    # Signup page
│   ├── dashboard/page.tsx # Dashboard
│   └── profile/page.tsx   # Profile page
├── components/            # Reusable components
│   ├── landing/          # Landing page sections (modular)
│   │   ├── navbar.tsx
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── story-section.tsx
│   │   ├── timeline-section.tsx
│   │   ├── team-section.tsx
│   │   ├── contact-section.tsx
│   │   └── footer.tsx
│   ├── dashboard/        # Dashboard components
│   │   ├── dashboard-header.tsx
│   │   ├── streak-card.tsx
│   │   ├── session-tracker.tsx
│   │   └── analytics-chart.tsx
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and helpers
│   ├── api-client.ts    # API integration layer
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
│   ├── use-toast.ts
│   └── use-mobile.ts
├── public/              # Static assets
├── styles/              # CSS files
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Key Technologies

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui with Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Native Fetch API

## Design System

### Color Palette (Trust & Ideology)
- **Hero**: Slate-900 to Blue-950 (stability)
- **Features**: Blue gradients (reliability)
- **Story**: Purple to Indigo (creativity)
- **Team**: Indigo to Purple (collaboration)
- **Contact**: Purple to Pink (welcoming)
- **Dashboard**: Blue-900 foundation (professional)

### Animations
- Fade-in and slide animations on scroll
- Staggered component animations
- Hover scale and glow effects
- Floating background orbs
- Smooth transitions throughout

## Environment Variables

```
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Integration

The frontend communicates with the backend API through `lib/api-client.ts`:

```typescript
import { apiClient } from '@/lib/api-client'

// Authentication
await apiClient.auth.signup(email, password)
await apiClient.auth.login(email, otp)

// Habit Tracking
await apiClient.habit.logSession(duration, mode)
await apiClient.habit.getStats()

// User Profile
await apiClient.user.getProfile()
await apiClient.user.updateProfile(data)
```

## Features

- **Beautiful UI**: Modern design with trust-inspiring colors
- **Responsive Design**: Works seamlessly on mobile, tablet, desktop
- **Rich Animations**: Smooth Framer Motion animations
- **Real-time Stats**: Dashboard with live analytics
- **Easy Navigation**: Smooth scrolling and routing
- **Form Validation**: Client-side validation with Zod
- **Error Handling**: Comprehensive error messages
- **Dark Mode Ready**: Theme support built-in

## Running Both Frontend & Backend

To run the full application:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in backend

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check `globals.css` for global styles

## Performance Optimization

- Server-side rendering for initial page load
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- CSS-in-JS optimizations with Tailwind
- API response caching with SWR

## Contributing

1. Create feature branches
2. Make changes in components or pages
3. Test locally with `npm run dev`
4. Build and verify with `npm run build`

## Support

For issues or questions:
- Check API connection status: Backend should return data from `/api/health`
- Verify environment variables are set correctly
- Check browser console for JavaScript errors
- Review network tab in DevTools for API failures
