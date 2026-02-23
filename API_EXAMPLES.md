# Planner API Examples

## Authentication
All endpoints require Bearer token header:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 1. CREATE TASK

### Single Task
```bash
curl -X POST http://localhost:5000/api/plan/task \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete 10 LeetCode Problems",
    "description": "Focus on Arrays and Hashing",
    "duration": 60,
    "category": "coding",
    "assignedDate": "2025-01-15",
    "monthYear": "2025-01"
  }'
```

**Response:**
```json
{
  "message": "Task created",
  "task": {
    "_id": "67abc123def456",
    "userId": "user123",
    "title": "Complete 10 LeetCode Problems",
    "duration": 60,
    "category": "coding",
    "assignedDate": "2025-01-15",
    "monthYear": "2025-01",
    "completed": false,
    "completedAt": null,
    "streakUpdated": false,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Bulk Create (Entire Month)
```bash
curl -X POST http://localhost:5000/api/plan/bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthYear": "2025-02",
    "tasks": [
      { "title": "Math Review", "duration": 45, "category": "review", "assignedDate": "2025-02-01" },
      { "title": "Read Chapter 5", "duration": 60, "category": "reading", "assignedDate": "2025-02-01" },
      { "title": "Complete Project Part 1", "duration": 120, "category": "project", "assignedDate": "2025-02-02" },
      { "title": "Write Essay", "duration": 90, "category": "writing", "assignedDate": "2025-02-03" }
    ]
  }'
```

**Response:**
```json
{
  "message": "Bulk tasks created",
  "count": 4,
  "tasks": [...]
}
```

---

## 2. READ TASKS

### Daily Plan (Get Today's Tasks)
```bash
curl -X GET "http://localhost:5000/api/plan/daily?date=2025-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "date": "2025-01-15",
  "tasks": [
    {
      "_id": "67abc123def456",
      "title": "Complete 10 LeetCode Problems",
      "duration": 60,
      "category": "coding",
      "assignedDate": "2025-01-15",
      "completed": false,
      "completedAt": null
    },
    {
      "_id": "67abc123def457",
      "title": "Read Chapter 5",
      "duration": 45,
      "category": "reading",
      "assignedDate": "2025-01-15",
      "completed": true,
      "completedAt": "2025-01-15T14:20:00Z"
    }
  ],
  "stats": {
    "total": 2,
    "completed": 1,
    "pending": 1,
    "totalDuration": 105,
    "completedDuration": 45
  }
}
```

### Monthly Plan (Get Entire Month)
```bash
curl -X GET "http://localhost:5000/api/plan/monthly?month=2025-01" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "month": "2025-01",
  "tasks": [
    {
      "_id": "67abc123def456",
      "title": "Complete 10 LeetCode Problems",
      "duration": 60,
      "category": "coding",
      "assignedDate": "2025-01-15",
      "completed": false,
      "completedAt": null
    },
    {
      "_id": "67abc123def457",
      "title": "Read Chapter 5",
      "duration": 45,
      "category": "reading",
      "assignedDate": "2025-01-16",
      "completed": false,
      "completedAt": null
    }
  ],
  "tasksByDay": {
    "2025-01-15": [
      {
        "_id": "67abc123def456",
        "title": "Complete 10 LeetCode Problems",
        "duration": 60,
        "category": "coding",
        "completed": false
      }
    ],
    "2025-01-16": [
      {
        "_id": "67abc123def457",
        "title": "Read Chapter 5",
        "duration": 45,
        "category": "reading",
        "completed": false
      }
    ]
  },
  "stats": {
    "total": 30,
    "completed": 5,
    "pending": 25,
    "totalDuration": 1350,
    "completedDuration": 225,
    "daysWithTasks": 15
  }
}
```

---

## 3. UPDATE TASK

### Mark Task Complete (TRIGGERS STREAK UPDATE)
```bash
curl -X PATCH "http://localhost:5000/api/plan/task/67abc123def456/complete" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Task completed",
  "task": {
    "_id": "67abc123def456",
    "title": "Complete 10 LeetCode Problems",
    "duration": 60,
    "category": "coding",
    "assignedDate": "2025-01-15",
    "completed": true,
    "completedAt": "2025-01-15T15:30:00Z",
    "streakUpdated": true
  },
  "streakUpdated": true,
  "currentStreak": 5
}
```

### Mark Task Incomplete
```bash
curl -X PATCH "http://localhost:5000/api/plan/task/67abc123def456/uncomplete" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Task marked as incomplete",
  "task": {
    "_id": "67abc123def456",
    "title": "Complete 10 LeetCode Problems",
    "duration": 60,
    "category": "coding",
    "assignedDate": "2025-01-15",
    "completed": false,
    "completedAt": null
  }
}
```

### Edit Task Details
```bash
curl -X PATCH "http://localhost:5000/api/plan/task/67abc123def456" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete 15 LeetCode Problems (Updated)",
    "duration": 90,
    "category": "problem-solving"
  }'
```

**Response:**
```json
{
  "message": "Task updated",
  "task": {
    "_id": "67abc123def456",
    "title": "Complete 15 LeetCode Problems (Updated)",
    "duration": 90,
    "category": "problem-solving",
    "assignedDate": "2025-01-15",
    "completed": false,
    "completedAt": null
  }
}
```

---

## 4. DELETE TASK

```bash
curl -X DELETE "http://localhost:5000/api/plan/task/67abc123def456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Task deleted",
  "task": {
    "_id": "67abc123def456",
    "title": "Complete 10 LeetCode Problems",
    "duration": 60,
    "category": "coding",
    "assignedDate": "2025-01-15",
    "completed": false,
    "deletedAt": "2025-01-15T16:00:00Z"
  }
}
```

---

## 5. STREAK WORKFLOW

### Step 1: Create Task for Today
```bash
curl -X POST http://localhost:5000/api/plan/task \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Study Session",
    "duration": 45,
    "category": "coding",
    "assignedDate": "'$(date +%Y-%m-%d)'",
    "monthYear": "'$(date +%Y-%m)'"
  }'
```

### Step 2: Get Current Streak
```bash
curl -X GET "http://localhost:5000/api/habit/streak" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "currentStreak": 4,
  "longestStreak": 7,
  "totalSessions": 20,
  "lastSessionDate": "2025-01-14T10:00:00Z",
  "streakHistory": [
    {
      "startDate": "2025-01-10T00:00:00Z",
      "endDate": "2025-01-12T23:59:59Z",
      "length": 3
    }
  ]
}
```

### Step 3: Complete the Task (Streak Updates)
```bash
curl -X PATCH "http://localhost:5000/api/plan/task/67abc123def456/complete" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "message": "Task completed",
  "task": { ... },
  "streakUpdated": true,
  "currentStreak": 5  // ← Incremented!
}
```

### Step 4: Verify Streak in Dashboard
```bash
curl -X GET "http://localhost:5000/api/habit/stats" \
  -H "Authorization: Bearer TOKEN"
```

**Response shows:**
```json
{
  "currentStreak": 5,  // ← Updated!
  "longestStreak": 7,
  "totalSessions": 21,
  ...
}
```

---

## Error Handling Examples

### Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/plan/task \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Task without date" }'
```

**Response (400):**
```json
{
  "error": "Missing required fields"
}
```

### Task Not Found
```bash
curl -X PATCH "http://localhost:5000/api/plan/task/invalid123/complete" \
  -H "Authorization: Bearer TOKEN"
```

**Response (404):**
```json
{
  "error": "Task not found"
}
```

### Invalid Date Format
```bash
curl -X GET "http://localhost:5000/api/plan/daily?date=invalid" \
  -H "Authorization: Bearer TOKEN"
```

**Response (400):**
```json
{
  "error": "Date parameter required (YYYY-MM-DD)"
}
```

---

## Data Types Reference

### Task Status
- `completed`: boolean
- `streakUpdated`: boolean (only first task per day updates streak)
- `completedAt`: ISO timestamp or null

### Categories
```
"coding" | "reading" | "writing" | "problem-solving" | "project" | "review" | "other"
```

### Duration
- Minimum: 5 minutes
- Maximum: 240 minutes
- Default: 25 minutes

### Date Formats
- `assignedDate`: "YYYY-MM-DD" (e.g., "2025-01-15")
- `monthYear`: "YYYY-MM" (e.g., "2025-01")

---

## Testing Tools

### Using Postman
1. Create new POST request to `http://localhost:5000/api/plan/task`
2. Headers tab: Add `Authorization: Bearer YOUR_TOKEN`
3. Body (raw JSON): Copy examples above
4. Click Send

### Using VS Code REST Client
Save as `test.http`:
```http
### Create Task
POST http://localhost:5000/api/plan/task
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Study Mathematics",
  "duration": 45,
  "category": "problem-solving",
  "assignedDate": "2025-01-15",
  "monthYear": "2025-01"
}

### Get Daily Tasks
GET http://localhost:5000/api/plan/daily?date=2025-01-15
Authorization: Bearer YOUR_TOKEN
```

---

**All endpoints tested and ready for production!** ✅
