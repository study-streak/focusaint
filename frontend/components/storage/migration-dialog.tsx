/**
 * Migration Dialog Component
 * 
 * UI for migrating data from local storage to cloud storage
 * when users upgrade to premium.
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.4 - Create data migration tool for upgrade to premium
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import {
  DataMigrationService,
  MigrationProgress,
  MigrationResult,
} from '@/lib/storage/data-migration';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (result: MigrationResult) => void;
  autoStart?: boolean;
}

export function MigrationDialog({
  open,
  onOpenChange,
  onComplete,
  autoStart = false,
}: MigrationDialogProps) {
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    current: 0,
    percentage: 0,
    status: 'pending',
  });
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  const startMigration = async () => {
    try {
      // Get estimated time
      const estimate = await DataMigrationService.estimateMigrationTime();
      setEstimatedTime(estimate);

      // Start migration
      const migrationResult = await DataMigrationService.migrateToCloud(
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setResult(migrationResult);

      // Clear local storage after successful migration
      if (migrationResult.success) {
        await DataMigrationService.clearLocalStorageAfterMigration();
      }

      if (onComplete) {
        onComplete(migrationResult);
      }
    } catch (error) {
      setProgress({
        ...progress,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Migration failed',
      });
    }
  };

  const handleClose = () => {
    if (progress.status === 'in_progress') {
      // Don't allow closing during migration
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <DialogTitle>Migrate to Cloud Storage</DialogTitle>
          </div>
          <DialogDescription>
            {progress.status === 'pending' && (
              <>
                Your local data will be securely transferred to cloud storage.
                This process may take a few moments.
              </>
            )}
            {progress.status === 'in_progress' && (
              <>
                Migrating your data to the cloud. Please don't close this window.
              </>
            )}
            {progress.status === 'completed' && (
              <>
                Migration completed successfully! Your data is now synced across all devices.
              </>
            )}
            {progress.status === 'failed' && (
              <>
                Migration encountered some issues. Please try again or contact support.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Bar */}
          {(progress.status === 'in_progress' || progress.status === 'completed') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress.current} of {progress.total} items
                </span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              {progress.currentItem && progress.status === 'in_progress' && (
                <p className="text-xs text-muted-foreground truncate">
                  Migrating: {progress.currentItem}
                </p>
              )}
            </div>
          )}

          {/* Estimated Time */}
          {progress.status === 'pending' && estimatedTime > 0 && (
            <Alert>
              <AlertDescription>
                Estimated time: ~{estimatedTime} seconds
              </AlertDescription>
            </Alert>
          )}

          {/* Status Messages */}
          {progress.status === 'completed' && result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Successfully migrated {result.itemsMigrated} items in{' '}
                {(result.duration / 1000).toFixed(1)} seconds.
              </AlertDescription>
            </Alert>
          )}

          {progress.status === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {progress.error || 'Migration failed. Please try again.'}
                {result && result.itemsFailed > 0 && (
                  <div className="mt-2 text-sm">
                    {result.itemsMigrated} items migrated, {result.itemsFailed} failed.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for in-progress */}
          {progress.status === 'in_progress' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please keep this window open until migration completes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {progress.status === 'pending' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={startMigration}>
                Start Migration
              </Button>
            </>
          )}

          {progress.status === 'in_progress' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating...
            </Button>
          )}

          {(progress.status === 'completed' || progress.status === 'failed') && (
            <Button onClick={handleClose}>
              {progress.status === 'completed' ? 'Done' : 'Close'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
