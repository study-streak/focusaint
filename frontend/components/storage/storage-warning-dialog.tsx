/**
 * Storage Warning Dialog Component
 * 
 * Modal dialog that warns users about device-specific storage
 * when they first create notes or tasks on free tier.
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.3 - Add device-specific data warning UI
 */

'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface StorageWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onUpgrade?: () => void;
  title?: string;
  description?: string;
}

export function StorageWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  onUpgrade,
  title = 'Local Storage Notice',
  description = 'Your data will be stored on this device only',
}: StorageWarningDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem('storage_warning_acknowledged', 'true');
    }
    onConfirm();
    onOpenChange(false);
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>{description}</p>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Important limitations:
              </p>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                <li>Data is not synced across devices</li>
                <li>Clearing browser data will delete your notes and tasks</li>
                <li>Limited to 5MB of storage space</li>
                <li>No automatic backups</li>
              </ul>
            </div>
            {onUpgrade && (
              <p className="text-sm">
                <span className="font-semibold">Upgrade to Premium</span> for cloud sync,
                unlimited storage, and automatic backups across all your devices.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label
            htmlFor="dont-show"
            className="text-sm font-normal cursor-pointer"
          >
            Don't show this again
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {onUpgrade && (
            <AlertDialogAction
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Upgrade to Premium
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            Continue with Local Storage
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
