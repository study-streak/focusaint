# Attachment, Deadline & Proctored Mode Features

This document describes the newly implemented features for file/link attachments, task deadlines, and proctored exam-mode viewing.

## Overview

The Focusdle planner now supports:

1. **File & Link Attachments** - Attach PDFs, documents, or external links to tasks
2. **Task Deadlines** - Set YYYY-MM-DD deadlines with optional proctored mode
3. **Task Distribution** - Split tasks across multiple days with percentage allocation
4. **Proctored Mode** - Open attachments in a restricted environment with violation tracking

## Features

### 1. Attachments

**Adding Attachments:**
- Click the calendar icon on any task to open the task detail modal
- Select "Add Attachment" tab
- Choose between:
  - **Link**: Provide a name and URL (e.g., course PDF, research paper)
  - **File**: Upload a local file (PDFs, documents, images)

**File Types Supported:**
- Links: Any HTTP/HTTPS URL
- Files: PDF, DOCX, XLSX, images, and other common formats

**Attachment Properties:**
- Type: "file" or "link"
- Name: Display name shown in task
- URL: File path or external link
- File size: For uploaded files
- Upload timestamp: When attached
- Open count: Tracks how many times opened
- Open timestamp: When last opened

**Removing Attachments:**
- In the task detail modal, click the X button next to an attachment to remove it

### 2. Deadlines

**Setting a Deadline:**
1. Click the calendar icon on any task
2. Select a date from the date picker (YYYY-MM-DD format)
3. Optionally enable "Proctored Mode" toggle
4. Click "Save Changes"

**Deadline Display:**
- Tasks with deadlines show a cyan badge with the date: `📅 Jan 15`
- Completed tasks no longer show red deadline warnings

**Proctored Mode with Deadline:**
- When proctored mode is enabled on a task deadline, the attachment opens in restricted mode
- User is taken to the proctored viewer on the deadline date
- Session is automatically logged with any violations detected

### 3. Proctored Mode

**What is Proctored Mode?**
Proctored mode is an exam-style restricted environment for viewing assignments. It enforces:

**Restrictions (Configurable):**
- ✅ Disable copy-paste (text cannot be copied)
- ✅ Require fullscreen (user must stay in fullscreen window)
- ✅ Track activity (violations are recorded)
- ✅ Timed sessions (optional time limit)
- Disable right-click context menu
- Lock screen (prevent alt-tab/task switching)

**Violation Types Detected:**
- `left_fullscreen` - User exited fullscreen
- `copy_paste_attempt` - Tried to copy text
- `right_click_attempt` - Right-clicked to open context menu
- `tab_switch_attempt` - Switched to another app (with lock screen enabled)

**Using Proctored Mode:**
1. Set a deadline and enable "Proctored Mode"
2. On the deadline date, click "Open in Proctored Mode" button on attachment
3. Request fullscreen (if required by settings)
4. View attachment with restrictions active
5. Click "End Session" when done
6. Session is recorded with any detected violations

**Session Recording:**
- Start/end timestamps
- Session duration (in minutes)
- List of violations
- Which attachment was viewed
- Violation count summary

### 4. Task Distribution

**Concept:**
Distribute a task across multiple days, with each day having a portion (%) of the work. Example: 50% Monday, 50% Tuesday.

**How to Use:**
1. Click the calendar icon on a task to open task detail modal
2. Click the purple "+" icon to open Distribution modal
3. Add multiple dates and assign percentage portions to each
4. Percentages must sum to exactly 100%
5. Click "Save Distribution"

**Features:**
- Add/remove distribution days as needed
- Real-time percentage total display with progress bar
- Visual indicator (green = 100%, red = not 100%)
- Button to add additional days
- Validation prevents saving if total ≠ 100%

**Distribution Display:**
- Each day shows date and portion percentage (e.g., "Jan 15: 50%")
- Can be edited anytime
- On each assigned date, task portions open in proctored mode if configured

**Example:**
```
Task: "Read Chapter 12" (120 minutes)
Monday (Jan 15): 50% of reading (60 min)
Tuesday (Jan 16): 50% of reading (60 min)

On Monday: Student opens PDF, proctored, 60 min timer
On Tuesday: Student opens same PDF, proctored, 60 min timer
```

**UI Components:**
- **Date Input**: HTML date picker (YYYY-MM-DD)
- **Portion Input**: Number input 0-100 with 0.1 step
- **Progress Bar**: Fills as total portion increases
- **Total Display**: Shows "Total: XXX%" in green (valid) or red (invalid)
- **Add/Remove Buttons**: + to add day, X to remove (if >1 day)

## API Endpoints

### Backend Attachment API

**Add Attachment:**
```
POST /api/plan/task/{taskId}/attachment
Authorization: Bearer {token}

Body: {
  type: "file" | "link",
  name: "Document Name",
  url: "https://example.com/doc.pdf",
  fileSize?: 5242880,           // bytes
  mimeType?: "application/pdf"  // optional
}

Response: { _id, type, name, url, uploadedAt, openCount: 0 }
```

**Delete Attachment:**
```
DELETE /api/plan/task/{taskId}/attachment/{attachmentId}
Authorization: Bearer {token}

Response: { message: "Attachment deleted" }
```

**Set Deadline:**
```
POST /api/plan/task/{taskId}/deadline
Authorization: Bearer {token}

Body: {
  deadline: "2024-01-20",
  proctoredSettings?: {
    disableCopyPaste: true,
    requireFullScreen: true,
    trackActivity: true,
    timeLimit: 120  // minutes
  }
}

Response: { _id, deadline, proctoredMode, proctoredSettings }
```

**Distribute Task:**
```
POST /api/plan/task/{taskId}/distribute
Authorization: Bearer {token}

Body: {
  distributedAcrossDays: [
    { date: "2024-01-15", portion: 50 },
    { date: "2024-01-16", portion: 50 }
  ]
}

Response: { _id, distributedAcrossDays: [...] }
```

**Start Proctored Session:**
```
POST /api/plan/task/{taskId}/proctored/start
Authorization: Bearer {token}

Body: {
  attachmentId: "6789abcdef123456"
}

Response: {
  sessionId: "...",
  startedAt: "2024-01-15T10:30:00Z",
  proctoredSettings: {...},
  timeLimit: 120
}
```

**End Proctored Session:**
```
POST /api/plan/task/{taskId}/proctored/end
Authorization: Bearer {token}

Body: {
  attachmentId: "6789abcdef123456",
  violations: ["left_fullscreen", "copy_paste_attempt"]
}

Response: {
  sessionId: "...",
  duration: 25,
  violationCount: 2,
  violations: ["left_fullscreen", "copy_paste_attempt"]
}
```

**Get Proctored Task:**
```
GET /api/plan/task/{taskId}/proctored
Authorization: Bearer {token}

Response: {
  _id, title, attachments: [...], deadline,
  proctoredMode, proctoredSettings,
  proctoredSessions: [...]
}
```

## Frontend Pages

### Habit Mode Planner (`/dashboard/habit-mode`)

**Features:**
- Daily & monthly task views
- Add new tasks
- Mark tasks complete/incomplete
- **New**: View attachments on each task (attachment count badge)
- **New**: Set/edit deadlines (calendar icon button)
- **New**: Distribute tasks across days (purple + icon button)
- **New**: Launch proctored sessions (blue button on attachment)
- **New**: Upload files/links (in task detail modal)
- **New**: Delete attachments

**Task Buttons:**
- 📅 Calendar: Open task detail modal to set deadline & manage attachments
- ➕ Purple Plus: Open distribution modal to split task across days
- 🗑️ Trash: Delete task

**Task Detail Modal:**
- Shows all task information
- Lists all attachments with icons (file/link)
- Date picker for setting deadline
- Proctored mode toggle
- Buttons to add/remove attachments
- "Save Changes" to persist deadline/proctored settings

**Distribution Modal:**
- Add multiple date entries
- Assign percentage to each date (0-100)
- Real-time total percentage display with progress bar
- Add/remove day buttons
- Validates total = 100% before saving
- "Save Distribution" button

### Proctored Viewer (`/dashboard/habit-mode/proctored`)

**Features:**
- **Header**: Task name, proctored status, timer, violation counter
- **Fullscreen Button**: Request fullscreen if enabled in settings
- **Attachment Display**:
  - Links: `<iframe>` embedded (respects same-origin policy)
  - Files: Display link to open in new window
- **Violation Detection**:
  - Copy-paste prevention (CSS + JS)
  - Fullscreen exit detection
  - Right-click blocking
  - Real-time violation counter displayed
- **Session Tracking**:
  - Start/end timestamps
  - Time limit countdown (if set)
  - Violation list displayed
- **End Session Button**: Manually close session and redirect to planner

**User Experience:**
1. User clicks "Open in Proctored Mode" on an attachment
2. Redirected to `/dashboard/habit-mode/proctored?taskId=X&attachmentId=Y`
3. Page enters fullscreen (if required)
4. Restrictions active (copy-paste disabled, etc.)
5. User views attachment (PDF, link, document)
6. Session activity logged
7. Click "End Session" to close
8. Redirected back to planner with session summary

## Database Schema Updates

### HabitTask Model

**New Fields:**
```javascript
deadline: String                    // YYYY-MM-DD format

attachments: [{
  _id: ObjectId,
  type: String,                    // "file" or "link"
  name: String,
  url: String,
  fileSize: Number,                // bytes
  mimeType: String,
  uploadedAt: Date,
  openedAt: Date,                  // first open timestamp
  openCount: Number                // times opened
}]

distributedAcrossDays: [{
  date: String,                    // YYYY-MM-DD
  portion: Number,                 // 0-100, must sum to 100
  completed: Boolean,
  completedAt: Date
}]

proctoredMode: Boolean             // enable proctored features

proctoredSettings: {
  disableCopyPaste: Boolean,
  requireFullScreen: Boolean,
  lockScreen: Boolean,
  disableRightClick: Boolean,
  trackActivity: Boolean,
  timeLimit: Number                // minutes
}

proctoredSessions: [{
  _id: ObjectId,
  startedAt: Date,
  endedAt: Date,
  duration: Number,                // minutes
  attachmentId: ObjectId,
  violations: [String]             // violation type strings
}]
```

**New Indexes:**
- `{ userId: 1, deadline: 1 }` - Query tasks by deadline
- `{ "attachments.url": 1 }` - Quick attachment lookups
- `{ "proctoredSessions.startedAt": 1 }` - Session queries

## Configuration

### Proctored Settings

**Available Settings:**
```javascript
{
  disableCopyPaste: true,    // Prevent text copying
  requireFullScreen: true,   // Must be fullscreen
  lockScreen: true,          // Prevent switching apps
  disableRightClick: true,   // No context menu
  trackActivity: true,       // Log violations
  timeLimit: 120             // Max minutes (0 = unlimited)
}
```

## Security Considerations

### What Proctored Mode Does:

**Client-Side Protection:**
- CSS `user-select: none` prevents text selection
- JavaScript event listeners block copy/paste
- Fullscreen API locks content to window
- Right-click context menu disabled

**Server-Side Logging:**
- All violations are recorded
- Session duration tracked
- Attachment open timestamps recorded
- Cannot be tampered with (server validates)

### Limitations:

- **Not a replacement for official proctoring**: This is browser-based only
- **Can be circumvented**: Advanced users can bypass restrictions
- **Best for distributed learning**: Use for study materials, not high-stakes exams

### Recommendations:

1. Use proctored mode for:
   - Study material distribution
   - Timed reading assignments
   - Research paper access
   - Homework solutions

2. Do NOT use for:
   - High-stakes exams
   - Certifications
   - Security-critical assessments

3. Always review violation logs:
   - Look for suspicious patterns
   - Note frequency of violations
   - Use as feedback for engagement

## Usage Examples

### Example 1: Distribute Reading Across Week

```
Task: "Read Chapter 5 & 6"
1. Create task
2. Add attachment: Link to "Chapter5.pdf"
3. Add attachment: Link to "Chapter6.pdf"
4. Set deadline: 2024-01-20
5. Enable: Proctored Mode (copy-paste disabled, fullscreen)
6. Distribute: 
   - Monday: 50%
   - Tuesday: 50%
7. On Monday, student opens Chapter 5 in proctored mode
8. On Tuesday, student opens Chapter 6 in proctored mode
9. Session logs show when each was accessed and duration
```

### Example 2: Exam Paper with Timer

```
Task: "January Mock Exam"
1. Create task
2. Add attachment: Upload "exam2024.pdf"
3. Set deadline: 2024-01-25
4. Enable: Proctored Mode
   - Disable copy-paste ✓
   - Require fullscreen ✓
   - Time limit: 90 minutes
   - Lock screen ✓
5. Student clicks "Start" on deadline
6. 90-minute timer begins
7. Full-screen enforced
8. Copy attempts logged as violations
9. After 90 minutes, session auto-ends
10. Results show: 3 copy attempts, 1 fullscreen exit
```

### Example 3: Research Paper Access

```
Task: "Review Citations in Paper X"
1. Create task
2. Add attachments:
   - "main_paper.pdf"
   - "citation_1.pdf"
   - "citation_2.pdf"
3. Set deadline: 2024-02-01
4. Proctored mode disabled (just tracking)
5. On deadline, student can open any PDF
6. System tracks which PDFs were opened and when
7. You see: student opened main_paper (2 times, 15 min),
           citation_1 (1 time, 5 min), citation_2 (not opened)
```

## Troubleshooting

### Attachment Upload Not Working

**Possible causes:**
1. File too large - Currently limited in code, but no hard limit enforced
2. CORS issues - Check backend allows file uploads
3. Invalid URL format - Ensure URL starts with https://

**Solution:**
- Check browser console for error messages
- Review API response in Network tab
- Verify file extension is supported

### Fullscreen Request Denied

**Possible causes:**
1. Browser doesn't allow fullscreen without user gesture
2. Invalid security context (not HTTPS in production)
3. Browser permission not granted

**Solution:**
- Ensure click happens on a user button (not programmatic)
- Use HTTPS in production
- Check browser security settings

### Violations Not Being Recorded

**Possible causes:**
1. JavaScript event listeners not attached
2. Copy-paste events not firing
3. Session not properly started

**Solution:**
- Check browser console for JS errors
- Verify `proctoredMode` is `true` on task
- Check Network tab for `/proctored/end` API call

## Future Enhancements

**Planned Features:**
- [ ] Screen recording for proctored sessions
- [ ] Webcam monitoring/face detection
- [ ] Keystroke logging (opt-in)
- [ ] Tab switch prevention (comprehensive)
- [ ] Integration with video proctoring services
- [ ] Biometric verification
- [ ] Geographic location tracking
- [ ] IP address logging
- [ ] Detailed analytics dashboard

**Current Status:** Basic violation logging and session tracking implemented. Advanced features require additional infrastructure.

## Support

**Issues or Questions?**
- Check the troubleshooting section above
- Review API response messages
- Check browser console for errors
- Review backend logs for validation errors

**Reporting Bugs:**
Include:
- Steps to reproduce
- Browser/OS version
- Network tab screenshot
- Backend error logs
