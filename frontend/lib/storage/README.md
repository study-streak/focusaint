# Storage System

A tier-based storage abstraction system for focusaint that provides local browser storage for free users and cloud sync for premium users.

## Features

- **Tier-based storage**: Automatic selection based on user subscription
- **Local storage**: Browser localStorage for free tier (5MB limit)
- **Cloud storage**: API-backed storage for premium tier with auto-sync
- **Storage monitoring**: Usage tracking and quota warnings
- **Data migration**: Seamless migration between tiers on upgrade/downgrade
- **Offline support**: Queue-based sync for cloud storage

## Architecture

```
StorageFactory
├── LocalStorageAdapter (Free Tier)
│   ├── Browser localStorage
│   ├── 5MB quota limit
│   └── Device-specific data
└── CloudStorageAdapter (Premium Tier)
    ├── API-backed storage
    ├── Auto-sync (5s interval)
    ├── Offline queue
    └── Multi-device sync
```

## Usage

### Basic Usage

```typescript
import { StorageFactory } from '@/lib/storage';

// Initialize storage based on user tier
const storage = StorageFactory.create(user.tier); // 'free' or 'premium'

// Save data
await storage.save('session_notes', {
  content: 'My study notes',
  timestamp: Date.now()
});

// Load data
const notes = await storage.load('session_notes');

// Delete data
await storage.delete('session_notes');

// List keys with prefix
const sessionKeys = await storage.list('session_');

// Manual sync (cloud storage only)
await storage.sync();
```

### Storage Monitoring

```typescript
import { StorageFactory, StorageMonitor } from '@/lib/storage';

const storage = StorageFactory.create(user.tier);
const monitor = new StorageMonitor(storage);

// Check current usage
const usage = await monitor.checkUsage();
console.log(`Using ${usage.percentage}% of storage`);

// Get warning if approaching limit
const warning = await monitor.getWarning();
if (warning) {
  // Display warning to user
  showNotification(warning.message, warning.level);
}

// Check if there's space for new data
const dataSize = StorageMonitor.estimateDataSize(myData);
const hasSpace = await monitor.hasSpaceFor(dataSize);

if (!hasSpace) {
  showUpgradePrompt('storage');
}

// Get formatted usage summary
const summary = await monitor.getUsageSummary();
console.log(summary); // "2.5 MB / 5 MB (50%)"
```

### Data Migration

```typescript
import { StorageFactory, LocalStorageAdapter, CloudStorageAdapter } from '@/lib/storage';

// When user upgrades to premium
async function handleUpgrade() {
  const localAdapter = new LocalStorageAdapter();
  const cloudAdapter = new CloudStorageAdapter();

  await StorageFactory.migrateToCloud(
    localAdapter,
    cloudAdapter,
    (current, total) => {
      console.log(`Migrating: ${current}/${total}`);
      updateProgressBar((current / total) * 100);
    }
  );

  // Update factory to use cloud storage
  StorageFactory.create('premium');
}

// When user downgrades to free
async function handleDowngrade() {
  const cloudAdapter = new CloudStorageAdapter();
  const localAdapter = new LocalStorageAdapter();

  try {
    await StorageFactory.migrateToLocal(
      cloudAdapter,
      localAdapter,
      (current, total) => {
        console.log(`Migrating: ${current}/${total}`);
      }
    );
  } catch (error) {
    if (error.message.includes('quota exceeded')) {
      // Handle quota exceeded - offer to delete some data
      showQuotaExceededDialog();
    }
  }

  // Update factory to use local storage
  StorageFactory.create('free');
}
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { StorageFactory, StorageMonitor, StorageWarning } from '@/lib/storage';

export function useStorage(userTier: 'free' | 'premium') {
  const [storage] = useState(() => StorageFactory.create(userTier));
  const [monitor] = useState(() => new StorageMonitor(storage));
  const [warning, setWarning] = useState<StorageWarning | null>(null);

  useEffect(() => {
    // Check storage usage on mount
    monitor.getWarning().then(setWarning);

    // Check periodically
    const interval = setInterval(() => {
      monitor.getWarning().then(setWarning);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [monitor]);

  return { storage, monitor, warning };
}

// Usage in component
function MyComponent() {
  const { storage, warning } = useStorage(user.tier);

  const saveNotes = async (notes: string) => {
    try {
      await storage.save('notes', { content: notes });
    } catch (error) {
      if (error.code === 'QUOTA_EXCEEDED') {
        showUpgradeModal();
      }
    }
  };

  return (
    <div>
      {warning && (
        <Alert variant={warning.level}>
          {warning.message}
        </Alert>
      )}
      {/* Rest of component */}
    </div>
  );
}
```

### Cloud Storage Sync Status

```typescript
import { CloudStorageAdapter } from '@/lib/storage';

const storage = new CloudStorageAdapter();

// Get sync status
const status = storage.getSyncStatus();
console.log(`Pending: ${status.pending}, In Progress: ${status.inProgress}`);

// Force immediate sync
await storage.forceSyncNow();

// Stop auto-sync (e.g., when user logs out)
storage.stopAutoSync();
```

## Error Handling

```typescript
import { StorageError, StorageErrorCode } from '@/lib/storage';

try {
  await storage.save('key', data);
} catch (error) {
  if (error instanceof StorageError) {
    switch (error.code) {
      case StorageErrorCode.QUOTA_EXCEEDED:
        showUpgradePrompt('storage');
        break;
      case StorageErrorCode.NETWORK_ERROR:
        showRetryDialog();
        break;
      case StorageErrorCode.PERMISSION_DENIED:
        showPermissionError();
        break;
      default:
        showGenericError();
    }
  }
}
```

## Storage Keys Convention

Use prefixes to organize data:

- `session_*` - Session data
- `notes_*` - User notes
- `tasks_*` - Task data
- `settings_*` - User settings
- `cache_*` - Cached data

Example:
```typescript
await storage.save('session_2024-01-15', sessionData);
await storage.save('notes_study-guide', notesData);
await storage.save('settings_preferences', settingsData);

// List all sessions
const sessionKeys = await storage.list('session_');
```

## Backend API Endpoints (Required)

The CloudStorageAdapter requires these backend endpoints:

```
POST   /api/storage/save          - Save data
GET    /api/storage/load/:key     - Load data
DELETE /api/storage/delete/:key   - Delete data
GET    /api/storage/list          - List keys (with ?prefix=)
GET    /api/storage/usage         - Get storage usage stats
```

## Testing

```typescript
import { LocalStorageAdapter, CloudStorageAdapter } from '@/lib/storage';

// Mock localStorage for testing
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Test local storage
const localAdapter = new LocalStorageAdapter();
await localAdapter.save('test', { data: 'value' });
const data = await localAdapter.load('test');
expect(data).toEqual({ data: 'value' });

// Test cloud storage (with mocked API)
jest.mock('@/lib/api-client');
const cloudAdapter = new CloudStorageAdapter();
// ... test cloud operations
```

## Performance Considerations

- **Local Storage**: Synchronous operations, fast access
- **Cloud Storage**: Asynchronous with 5s auto-sync interval
- **Caching**: Consider caching frequently accessed data in memory
- **Batch Operations**: Group multiple saves for better performance

## Security

- All data is stored per-user (authenticated endpoints)
- Local storage is domain-specific (browser security)
- Cloud storage requires JWT authentication
- No sensitive data should be stored (passwords, tokens, etc.)

## Limitations

### Free Tier (Local Storage)
- 5MB storage limit
- Device-specific (no sync)
- Data lost if browser cache cleared
- Single device only

### Premium Tier (Cloud Storage)
- Unlimited storage (subject to backend limits)
- Multi-device sync
- Persistent across devices
- Requires internet connection for sync


## Data Management Services

### SessionStorageService

High-level service for managing session notes and data.

```typescript
import { SessionStorageService } from '@/lib/storage';

const sessionStorage = new SessionStorageService(user.tier);

// Save session notes
await sessionStorage.saveSessionNotes(sessionId, userId, 'My notes');

// Load session notes
const notes = await sessionStorage.loadSessionNotes(sessionId);

// Update notes
await sessionStorage.updateSessionNotes(sessionId, 'Updated notes');

// Delete notes
await sessionStorage.deleteSessionNotes(sessionId);

// List all user sessions
const sessions = await sessionStorage.listUserSessions(userId);

// Check if using local storage
if (sessionStorage.isLocalStorage()) {
  showDeviceWarning();
}
```

### TaskStorageService

High-level service for managing task data.

```typescript
import { TaskStorageService } from '@/lib/storage';

const taskStorage = new TaskStorageService(user.tier);

// Save task
await taskStorage.saveTask({
  taskId: '123',
  userId: 'user1',
  title: 'Study React',
  duration: 60,
  category: 'study',
  assignedDate: '2024-01-15',
  monthYear: '2024-01',
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Load task
const task = await taskStorage.loadTask('123');

// Update task
await taskStorage.updateTask('123', { completed: true });

// Complete task
await taskStorage.completeTask('123');

// List tasks by date
const tasks = await taskStorage.listTasksByDate(userId, '2024-01-15');

// List tasks by month
const monthTasks = await taskStorage.listTasksByMonth(userId, '2024-01');

// Add attachment
await taskStorage.addAttachment('123', {
  id: 'att1',
  type: 'file',
  name: 'notes.pdf',
  url: '/uploads/notes.pdf',
  openCount: 0,
  completed: false,
  uploadedAt: new Date().toISOString(),
});

// Get task count
const count = await taskStorage.getTaskCount(userId);
```

### DataMigrationService

Handles data migration between storage tiers.

```typescript
import { DataMigrationService } from '@/lib/storage';

// Check if migration needed
const needsMigration = await DataMigrationService.needsMigration();

if (needsMigration) {
  // Get item count
  const itemCount = await DataMigrationService.getMigrationItemCount();
  
  // Estimate time
  const estimatedSeconds = await DataMigrationService.estimateMigrationTime();
  
  // Migrate to cloud
  const result = await DataMigrationService.migrateToCloud(
    (progress) => {
      console.log(`${progress.percentage}% - ${progress.currentItem}`);
      updateProgressBar(progress.percentage);
    }
  );
  
  if (result.success) {
    console.log(`Migrated ${result.itemsMigrated} items in ${result.duration}ms`);
    
    // Clear local storage after successful migration
    await DataMigrationService.clearLocalStorageAfterMigration();
  } else {
    console.error(`Failed to migrate ${result.itemsFailed} items`);
    result.errors.forEach(({ key, error }) => {
      console.error(`${key}: ${error}`);
    });
  }
}

// Migrate to local (downgrade)
const downgradeResult = await DataMigrationService.migrateToLocal(
  (progress) => {
    if (progress.status === 'failed' && progress.error?.includes('quota')) {
      // Handle quota exceeded
      showQuotaExceededDialog();
    }
  }
);
```

## UI Components

### DeviceWarningBanner

Displays warning about device-specific storage for free users.

```tsx
import { DeviceWarningBanner } from '@/components/storage';

<DeviceWarningBanner
  userTier={user.tier}
  onUpgradeClick={() => router.push('/pricing')}
  dismissible={true}
/>
```

### StorageWarningDialog

Modal dialog warning about local storage limitations.

```tsx
import { StorageWarningDialog } from '@/components/storage';

const [showWarning, setShowWarning] = useState(false);

// Show before first save
useEffect(() => {
  const acknowledged = localStorage.getItem('storage_warning_acknowledged');
  if (!acknowledged && user.tier === 'free') {
    setShowWarning(true);
  }
}, [user.tier]);

<StorageWarningDialog
  open={showWarning}
  onOpenChange={setShowWarning}
  onConfirm={() => {
    // User acknowledged, proceed with save
    saveData();
  }}
  onUpgrade={() => router.push('/pricing')}
/>
```

### MigrationDialog

UI for data migration process with progress tracking.

```tsx
import { MigrationDialog } from '@/components/storage';

const [showMigration, setShowMigration] = useState(false);

// Show after upgrade
useEffect(() => {
  if (user.tier === 'premium') {
    DataMigrationService.needsMigration().then((needs) => {
      if (needs) {
        setShowMigration(true);
      }
    });
  }
}, [user.tier]);

<MigrationDialog
  open={showMigration}
  onOpenChange={setShowMigration}
  onComplete={(result) => {
    if (result.success) {
      toast.success(`Migrated ${result.itemsMigrated} items`);
    } else {
      toast.error(`Migration failed: ${result.itemsFailed} items`);
    }
  }}
  autoStart={false}
/>
```

### StorageQuotaIndicator

Displays storage usage and warnings.

```tsx
import { StorageQuotaIndicator } from '@/components/storage';

// Full view (settings page)
<StorageQuotaIndicator
  userTier={user.tier}
  onUpgradeClick={() => router.push('/pricing')}
  onManageStorage={() => setShowManager(true)}
  showDetails={true}
/>

// Compact view (navbar)
<StorageQuotaIndicator
  userTier={user.tier}
  onUpgradeClick={() => router.push('/pricing')}
  compact={true}
/>
```

### StorageManager

Allows users to view and delete stored items.

```tsx
import { StorageManager } from '@/components/storage';

const [showManager, setShowManager] = useState(false);

<StorageManager
  open={showManager}
  onOpenChange={setShowManager}
  userTier={user.tier}
  onItemsDeleted={(count) => {
    toast.success(`Deleted ${count} items`);
    // Refresh storage usage
    refreshUsage();
  }}
/>
```

## Complete Integration Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SessionStorageService,
  TaskStorageService,
  DataMigrationService,
} from '@/lib/storage';
import {
  DeviceWarningBanner,
  StorageQuotaIndicator,
  StorageWarningDialog,
  MigrationDialog,
  StorageManager,
} from '@/components/storage';

export function DashboardPage({ user }) {
  const router = useRouter();
  const [sessionStorage] = useState(() => new SessionStorageService(user.tier));
  const [taskStorage] = useState(() => new TaskStorageService(user.tier));
  const [showWarning, setShowWarning] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [showManager, setShowManager] = useState(false);

  // Check for first-time storage use
  useEffect(() => {
    const acknowledged = localStorage.getItem('storage_warning_acknowledged');
    if (!acknowledged && user.tier === 'free') {
      setShowWarning(true);
    }
  }, [user.tier]);

  // Check if migration needed on upgrade
  useEffect(() => {
    if (user.tier === 'premium') {
      DataMigrationService.needsMigration().then((needs) => {
        if (needs) {
          setShowMigration(true);
        }
      });
    }
  }, [user.tier]);

  const handleSaveNotes = async (sessionId: string, notes: string) => {
    try {
      await sessionStorage.saveSessionNotes(sessionId, user.id, notes);
      toast.success('Notes saved');
    } catch (error) {
      if (error.code === 'QUOTA_EXCEEDED') {
        toast.error('Storage full. Please upgrade or delete some data.');
        router.push('/pricing');
      } else {
        toast.error('Failed to save notes');
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      await taskStorage.saveTask(taskData);
      toast.success('Task saved');
    } catch (error) {
      if (error.code === 'QUOTA_EXCEEDED') {
        setShowManager(true);
      } else {
        toast.error('Failed to save task');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning banner for free users */}
      <DeviceWarningBanner
        userTier={user.tier}
        onUpgradeClick={() => router.push('/pricing')}
      />

      {/* Storage quota indicator */}
      <StorageQuotaIndicator
        userTier={user.tier}
        onUpgradeClick={() => router.push('/pricing')}
        onManageStorage={() => setShowManager(true)}
      />

      {/* First-time warning dialog */}
      <StorageWarningDialog
        open={showWarning}
        onOpenChange={setShowWarning}
        onConfirm={() => {
          // User acknowledged, continue
        }}
        onUpgrade={() => router.push('/pricing')}
      />

      {/* Migration dialog */}
      <MigrationDialog
        open={showMigration}
        onOpenChange={setShowMigration}
        onComplete={(result) => {
          if (result.success) {
            toast.success('Data migrated to cloud');
          }
        }}
      />

      {/* Storage manager */}
      <StorageManager
        open={showManager}
        onOpenChange={setShowManager}
        userTier={user.tier}
        onItemsDeleted={(count) => {
          toast.success(`Deleted ${count} items`);
        }}
      />

      {/* Your dashboard UI */}
    </div>
  );
}
```

## Implementation Checklist

- [x] Task 6.2.1: Store session notes in local storage for free users
- [x] Task 6.2.2: Store task data in local storage for free users
- [x] Task 6.2.3: Add device-specific data warning UI
- [x] Task 6.2.4: Create data migration tool for upgrade to premium
- [x] Task 6.2.5: Implement local storage quota management

## Requirements Satisfied

- ✅ Requirement 4: Local Storage Preference
  - Free users store data locally with 5MB limit
  - Device-specific storage warning displayed
  - Quota management and monitoring
  - Migration tool for upgrade to premium

- ✅ Requirement 11: Cloud Sync (Premium)
  - Cloud storage adapter with auto-sync
  - Multi-device access
  - Offline queue for sync
  - Seamless migration from local storage
