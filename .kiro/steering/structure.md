# Project Structure

## Monorepo Organization

```
focusaint-monorepo/
├── frontend/              # Next.js application
├── backend/               # Express.js API
├── .kiro/                 # Kiro configuration
├── package.json           # Root workspace config
└── docker-compose.yml     # Container orchestration
```

## Frontend Structure

```
frontend/
├── app/                   # Next.js App Router pages
│   ├── dashboard/        # Main dashboard and features
│   ├── login/            # Authentication pages
│   ├── signup/
│   ├── profile/
│   ├── study/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── dashboard/        # Dashboard-specific components
│   ├── focusMode/        # Focus mode components
│   ├── landing/          # Landing page sections
│   ├── quick-mode/       # Quick mode components
│   └── ui/               # shadcn/ui components (50+)
├── lib/                  # Utilities and helpers
│   ├── api-client.ts     # API request wrapper
│   ├── auth-cookie.ts    # Auth utilities
│   └── utils.ts          # General utilities
├── public/               # Static assets
├── middleware.ts         # Next.js middleware
└── package.json          # Frontend dependencies
```

## Backend Structure

```
backend/
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── HabitSession.js
│   ├── HabitTask.js
│   ├── StreakRecord.js
│   └── OTP.js
├── routes/               # Express route handlers
│   ├── auth.js           # Authentication endpoints
│   ├── user.js           # User management
│   ├── habit.js          # Habit tracking
│   ├── plan.js           # Task planning
│   ├── ai.js             # AI features
│   └── forgot.js         # Password reset
├── middleware/           # Express middleware
│   ├── auth.js           # JWT verification
│   ├── errorHandler.js   # Global error handling
│   └── rateLimit.js      # API rate limiting
├── services/             # Business logic
│   └── email.js          # Email service (OTP)
├── templates/            # Email templates
│   └── otpEmail.js
├── utils/                # Helper functions
│   ├── db.js             # MongoDB connection
│   ├── validation.js     # Input validation
│   └── proctoredPresets.js
├── uploads/              # File upload storage
├── server.js             # Express app entry point
└── package.json          # Backend dependencies
```

## Key Conventions

### File Naming
- Frontend: kebab-case for files, PascalCase for components
- Backend: kebab-case for files, camelCase for functions
- Models: PascalCase (e.g., User.js, HabitSession.js)
- Routes: lowercase (e.g., auth.js, habit.js)

### Import Style
- Backend: ES modules (`import/export`)
- Frontend: ES modules with TypeScript
- Use named exports for utilities, default for components/models

### Component Organization
- Page components in `app/` directory
- Reusable components in `components/`
- UI primitives in `components/ui/`
- Feature-specific components in subdirectories

### API Structure
- Base URL: `/api`
- Route prefixes: `/api/auth`, `/api/user`, `/api/habit`, `/api/plan`
- RESTful conventions: GET, POST, PUT, PATCH, DELETE

### Database Collections
- users: User accounts and profiles
- habitsessions: Session logs
- habittasks: Daily/monthly tasks
- streakrecords: Streak tracking
- otps: Email verification codes

### Authentication Flow
1. User signs up → creates User document
2. OTP sent to email → creates OTP document
3. User verifies OTP → sets isEmailVerified = true
4. JWT token issued → stored in localStorage
5. Protected routes use auth middleware

### State Management
- Client-side: React hooks and local state
- Server state: API calls via APIClient
- Auth state: localStorage + JWT tokens
- No global state library (Redux/Zustand)

### Styling Approach
- Tailwind utility classes
- CSS variables for theming
- Dark mode support via class strategy
- Component variants with class-variance-authority
- Animations with Framer Motion

### Error Handling
- Backend: Global error handler middleware
- Frontend: Try-catch with user-friendly messages
- API errors: Consistent JSON format `{ error: "message" }`
- Validation: Input validation on both client and server
