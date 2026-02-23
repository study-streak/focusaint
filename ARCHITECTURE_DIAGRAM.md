# Architecture Diagram: Habit Planner System

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FOCUSAINT APP                            │
│                   (Dashboard & Habit Planner)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Dashboard Page  │
                    └──────────────────┘
                              │
                    (User clicks "Habit Mode"
                     + "Log Session")
                              │
                              ▼
                    ┌──────────────────┐
                    │  Login/Signup    │
                    │   (if needed)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Habit Mode Planner   │
                    │  (NEW COMPONENT)     │
                    └──────────────────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ▼                                            ▼
    ┌─────────────────┐                   ┌─────────────────┐
    │   DAILY VIEW    │                   │  MONTHLY VIEW   │
    │  (Today Tasks)  │                   │ (Full Month)    │
    └─────────────────┘                   └─────────────────┘
        │                                            │
        │ Task Operations:                           │ Task Operations:
        │ • View today's tasks                       │ • View month's tasks
        │ • Add new task                             │ • Add task to any day
        │ • Mark complete ✓                          │ • Mark complete ✓
        │ • Delete task                              │ • Delete task
        │ • Next/Previous day                        │ • Previous/Next month
        │                                            │
        └─────────────────────┬──────────────────────┘
                              │
                 (All operations trigger API calls)
                              │
                    ┌─────────┴──────────┐
                    │    BACKEND API     │
                    │   (Express.js)     │
                    └─────────┬──────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│ GET /daily   │      │ POST /task       │      │ PATCH /task  │
│ Read today's │      │ Create new task  │      │ Update task  │
│ tasks        │      │                  │      │ (mark done)  │
└──────────────┘      └──────────────────┘      └──────────────┘
    │                         │                         │
    ▼                         ▼                         ▼
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│ GET /monthly │      │ DELETE /task     │      │ GET /streak  │
│ Read month's │      │ Delete task      │      │ Get current  │
│ tasks        │      │                  │      │ streak count │
└──────────────┘      └──────────────────┘      └──────────────┘
                              │
                    ┌─────────┴──────────┐
                    │    MONGODB         │
                    │   Database         │
                    └──────────────────┬─┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  user collection │  │ habitTask        │  │ streakRecord     │
    │                  │  │ collection       │  │ collection       │
    │ • userId         │  │ • taskId         │  │ • userId         │
    │ • email          │  │ • userId         │  │ • currentStreak  │
    │ • currentStreak  │  │ • title          │  │ • longestStreak  │
    │ • longestStreak  │  │ • duration       │  │ • lastActiveDate │
    │ • totalSessions  │  │ • category       │  │ • streakHistory  │
    │                  │  │ • assignedDate   │  │                  │
    │                  │  │ • monthYear      │  │                  │
    │                  │  │ • completed      │  │                  │
    │                  │  │ • completedAt    │  │                  │
    │                  │  │ • streakUpdated  │  │                  │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Component Structure (Frontend)

```
App Router
│
└── /app/dashboard
    │
    ├── /page.tsx
    │   ├── DashboardHeader
    │   │   ├── Logo & Welcome
    │   │   ├── Streak Counter (flame icon)
    │   │   └── Avatar Dropdown (Profile/Logout)
    │   │
    │   ├── SessionTracker
    │   │   ├── Mode Selector (Habit/Deep/Quiz/Recall)
    │   │   │   └── [Habit] → routes to habit-mode
    │   │   ├── Duration Input
    │   │   └── Log Session Button
    │   │
    │   ├── AnalyticsChart
    │   │   └── Weekly activity bar chart
    │   │
    │   └── Stats Cards
    │       ├── Current Streak
    │       ├── Sessions This Week
    │       ├── Total Duration
    │       └── Longest Streak
    │
    └── /habit-mode/page.tsx (NEWLY ENHANCED)
        │
        ├── Header
        │   ├── Back Button
        │   ├── Title "Habit Planner"
        │   └── Current Streak Display (flame icon)
        │
        ├── View Tabs
        │   ├── Daily Plan Tab
        │   └── Monthly Plan Tab
        │
        ├── Date Navigation
        │   ├── Previous Button
        │   ├── Current Date Display
        │   ├── Today Button
        │   └── Next Button
        │
        ├── Stats Panel
        │   ├── Total Tasks
        │   ├── Completed Tasks
        │   ├── Pending Tasks
        │   └── Duration Progress
        │
        ├── Add Task Form
        │   ├── Task Title Input
        │   ├── Duration Input
        │   ├── Category Dropdown
        │   └── Add Task Button
        │
        └── Tasks List
            └── Task Items (repeating)
                ├── Complete Checkbox
                ├── Task Title
                ├── Category Badge
                ├── Duration Display
                └── Delete Button
```

---

## Data Flow: Creating & Completing a Task

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER CREATES TASK                                │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ Form Fields:             │
                │ • Title: "Math Review"   │
                │ • Duration: 45 min       │
                │ • Category: "review"     │
                │ • Date: 2025-01-15       │
                └──────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ POST /api/plan/task│
                    │ (with auth token)  │
                    └────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Backend:          │
                    │ 1. Validate input  │
                    │ 2. Create document │
                    │ 3. Save to MongoDB │
                    │ 4. Return task ID  │
                    └────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Frontend:          │
                    │ 1. Task appears in │
                    │    list            │
                    │ 2. Form cleared    │
                    │ 3. Stats updated   │
                    └────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     USER COMPLETES TASK                              │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ User clicks checkbox     │
                │ on task                  │
                └──────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ PATCH /api/plan/task/:id     │
              │ /complete                    │
              │ (with auth token)            │
              └──────────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────────┐
                │  Backend:                    │
                │ 1. Find task by ID           │
                │ 2. Set completed = true      │
                │ 3. Set completedAt = now     │
                └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Streak Update Logic:        │
              │                              │
              │ Check: Any task completed    │
              │ today?                       │
              │                              │
              │ If YES:                      │
              │  • Check lastActiveDate      │
              │  • If yesterday → streak++   │
              │  • If today → no change      │
              │  • If gap day → streak = 1   │
              │                              │
              │ Update StreakRecord in DB    │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Response:                   │
              │ {                            │
              │   task: {...},               │
              │   streakUpdated: true,       │
              │   currentStreak: 5           │
              │ }                            │
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Frontend:                   │
              │ 1. Task marked with ✓        │
              │ 2. Streak counter updates    │
              │ 3. Stats recalculate         │
              │ 4. Animations trigger        │
              └──────────────────────────────┘
```

---

## Streak Update State Machine

```
                        No Completed Task Today
                               │
                               ▼
                    ┌──────────────────────┐
                    │      No Change       │
                    │  Streak stays same   │
                    └──────────────────────┘


        Task Completed Today for First Time
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
        ┌──────────────────────┐ ┌──────────────────────┐
        │  Last Active:        │ │  Last Active:        │
        │  Yesterday           │ │  Today               │
        │                      │ │                      │
        │  ACTION:             │ │  ACTION:             │
        │  Streak += 1         │ │  Do nothing          │
        │  ✓ Consecutive!      │ │  Already counted     │
        │                      │ │                      │
        │  Result:             │ │  Result:             │
        │  currentStreak = 5   │ │  currentStreak = 5   │
        └──────────────────────┘ └──────────────────────┘


        ┌──────────────────────────────┐
        │  Last Active: Gap Day        │
        │  (Tuesday completed yesterday,│
        │   gap on Wednesday-Friday,   │
        │   now doing Friday)          │
        │                              │
        │  ACTION:                     │
        │  1. Save old streak to       │
        │     streakHistory            │
        │  2. Reset: Streak = 1        │
        │  3. Log: "Streak broken,     │
        │     restarted"               │
        │                              │
        │  Result:                     │
        │  currentStreak = 1           │
        │  longestStreak = 7 (if was 7)│
        └──────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────┐         ┌──────────────────┐        ┌──────────────────┐
│  User           │         │  HabitTask       │        │  StreakRecord    │
├─────────────────┤         ├──────────────────┤        ├──────────────────┤
│ _id (PK)        │◄────┬───│ userId (FK)      │        │ userId (FK, UK)  │
│ email (UK)      │     │   │ title            │        │ currentStreak    │
│ currentStreak   │     │   │ description      │        │ longestStreak    │
│ longestStreak   │     │   │ duration         │        │ lastActiveDate   │
│ totalSessions   │     │   │ category         │        │ streakHistory[]  │
│ lastSessionDate │     │   │ assignedDate     │        │                  │
│ createdAt       │     │   │ monthYear        │        │ createdAt        │
│ updatedAt       │     │   │ completed        │        │ updatedAt        │
└─────────────────┘     │   │ completedAt      │        └──────────────────┘
                        │   │ streakUpdated    │
                        │   │ createdAt        │
                        │   │ updatedAt        │
                        │   └──────────────────┘
              (1:N relationship)
                        │
        ┌───────────────┴────────────────┐
        │                                │
        │ Index: userId + assignedDate   │
        │ Index: userId + monthYear      │
        │ Index: userId + completed      │
        │                                │
        └────────────────────────────────┘
```

---

## API Call Sequence

```
1. User Opens Habit Mode Planner
   └── GET /api/habit/streak (fetch current streak)
   └── GET /api/plan/daily or /monthly (depending on tab)

2. User Adds Task
   └── POST /api/plan/task
   └── LIST REFRESHES (refetch GET /api/plan/daily or /monthly)

3. User Marks Task Complete
   └── PATCH /api/plan/task/:id/complete
       ├── Checks if task.assignedDate === today
       ├── Checks if ANY task completed today
       ├── Updates streak in StreakRecord
       └── Returns { streakUpdated, currentStreak }
   └── Header Updates (streak-pill shows new value)
   └── LIST REFRESHES

4. User Switches View (Daily ↔ Monthly)
   └── GET /api/plan/daily or /monthly with new date

5. User Navigates Month
   └── GET /api/plan/monthly with previous/next month
```

---

## Key Features Summary

```
┌─────────────────────────────────────────────────────────┐
│                    HABIT PLANNER                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Daily Planning                                       │
│     • View today's tasks                                │
│     • Add/edit/delete tasks                             │
│     • Instant statistics                                │
│     • Navigate days with prev/next buttons              │
│                                                          │
│  ✅ Monthly Planning                                     │
│     • View entire month's tasks                         │
│     • Assign tasks to specific dates                    │
│     • Grouped by date                                   │
│     • Monthly aggregate stats                           │
│                                                          │
│  ✅ Task Management                                      │
│     • Title, duration (5-240 min), category             │
│     • Checkbox completion                               │
│     • Category color-coding (7 types)                   │
│     • Delete with confirmation                          │
│                                                          │
│  ✅ Streak Integration                                   │
│     • Auto-update on task completion                    │
│     • Once per day per user                             │
│     • Live header counter with flame icon               │
│     • Persistent across sessions                        │
│                                                          │
│  ✅ Persistent Storage                                   │
│     • MongoDB backend                                   │
│     • Survives page refresh                             │
│     • Multi-device accessible                           │
│     • Full history maintained                           │
│                                                          │
│  ✅ Dark Glass Theme                                     │
│     • Backdrop-blur cards                               │
│     • White/15% borders                                 │
│     • Violet/pink gradients                             │
│     • Smooth animations                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

This architeture supports all your requirements! ✅
