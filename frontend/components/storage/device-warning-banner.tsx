/**
 * Device Warning Banner Component
 * 
 * Displays a warning to free users that their data is stored locally
 * and is device-specific (not synced across devices).
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.3 - Add device-specific data warning UI
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Smartphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DeviceWarningBannerProps {
  userTier: 'free' | 'premium';
  onUpgradeClick?: () => void;
  dismissible?: boolean;
}

export function DeviceWarningBanner({
  userTier,
  onUpgradeClick,
  dismissible = true,
}: DeviceWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Only show for free users
    if (userTier !== 'free') {
      setShowWarning(false);
      return;
    }

    // Check if user has dismissed the warning
    const dismissed = localStorage.getItem('device_warning_dismissed');
    if (dismissed === 'true' && dismissible) {
      setIsDismissed(true);
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  }, [userTier, dismissible]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
    if (dismissible) {
      localStorage.setItem('device_warning_dismissed', 'true');
    }
  };

  if (!showWarning || isDismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Smartphone className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
            Device-Specific Data Storage
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200 mt-1">
            Your notes and tasks are stored locally on this device only. If you switch devices
            or clear your browser data, you'll lose access to this information.
            {onUpgradeClick && (
              <span className="block mt-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-amber-900 dark:text-amber-100 underline font-semibold"
                  onClick={onUpgradeClick}
                >
                  Upgrade to Premium
                </Button>
                {' '}for cloud sync across all your devices.
              </span>
            )}
          </AlertDescription>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-100"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}
