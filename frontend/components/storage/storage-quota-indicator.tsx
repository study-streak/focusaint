/**
 * Storage Quota Indicator Component
 * 
 * Displays storage usage and warnings for free tier users.
 * Shows upgrade prompts when approaching storage limits.
 * 
 * Requirements: Req 4 - Local Storage Preference (size limits)
 * Task: 6.2.5 - Implement local storage quota management
 */

'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { StorageMonitor, StorageWarning } from '@/lib/storage/storage-monitor';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { cn } from '@/lib/utils';

interface StorageQuotaIndicatorProps {
  userTier: 'free' | 'premium';
  onUpgradeClick?: () => void;
  onManageStorage?: () => void;
  compact?: boolean;
  showDetails?: boolean;
}

export function StorageQuotaIndicator({
  userTier,
  onUpgradeClick,
  onManageStorage,
  compact = false,
  showDetails = true,
}: StorageQuotaIndicatorProps) {
  const [warning, setWarning] = useState<StorageWarning | null>(null);
  const [usageSummary, setUsageSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userTier !== 'free') {
      setIsLoading(false);
      return;
    }

    const checkStorage = async () => {
      try {
        const storage = StorageFactory.create(userTier);
        const monitor = new StorageMonitor(storage);
        
        const currentWarning = await monitor.getWarning();
        setWarning(currentWarning);
        
        const summary = await monitor.getUsageSummary();
        setUsageSummary(summary);
      } catch (error) {
        console.error('Failed to check storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStorage();
    
    // Check storage every 30 seconds
    const interval = setInterval(checkStorage, 30000);
    
    return () => clearInterval(interval);
  }, [userTier]);

  // Don't show for premium users
  if (userTier === 'premium') {
    return null;
  }

  if (isLoading) {
    return null;
  }

  // Compact view (for header/navbar)
  if (compact) {
    if (!warning) {
      return null;
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-2',
          warning.level === 'critical' && 'text-red-600 hover:text-red-700',
          warning.level === 'warning' && 'text-amber-600 hover:text-amber-700',
          warning.level === 'info' && 'text-blue-600 hover:text-blue-700'
        )}
        onClick={onUpgradeClick}
      >
        <HardDrive className="h-4 w-4" />
        <span className="text-sm font-medium">{warning.percentage}%</span>
      </Button>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </div>
          {onManageStorage && (
            <Button variant="ghost" size="sm" onClick={onManageStorage}>
              <Trash2 className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
        <CardDescription>
          Local device storage • {usageSummary}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {warning && (
          <div className="space-y-2">
            <Progress
              value={warning.percentage}
              className={cn(
                'h-2',
                warning.level === 'critical' && '[&>div]:bg-red-500',
                warning.level === 'warning' && '[&>div]:bg-amber-500',
                warning.level === 'info' && '[&>div]:bg-blue-500'
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{StorageMonitor.formatBytes(warning.used)}</span>
              <span>{StorageMonitor.formatBytes(warning.limit)}</span>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {warning && warning.level === 'critical' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Storage Almost Full</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">
                You're using {warning.percentage}% of your storage. Delete some data or upgrade to premium.
              </p>
              {onUpgradeClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={onUpgradeClick}
                >
                  Upgrade to Premium
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {warning && warning.level === 'warning' && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Storage Running Low
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="text-sm">
                You're using {warning.percentage}% of your storage. Consider upgrading for unlimited cloud storage.
              </p>
              {onUpgradeClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-amber-600 text-amber-900 hover:bg-amber-100"
                  onClick={onUpgradeClick}
                >
                  Upgrade to Premium
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {warning && warning.level === 'info' && (
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <p className="text-sm">
                You're using {warning.percentage}% of your storage. Upgrade to premium for unlimited cloud storage.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Details */}
        {showDetails && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="font-medium">Storage Type:</span>
              <span>Local Device Storage</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Limit:</span>
              <span>5 MB (Free Tier)</span>
            </p>
            {onUpgradeClick && (
              <p className="text-xs pt-2">
                Upgrade to Premium for unlimited cloud storage with automatic sync across all devices.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
