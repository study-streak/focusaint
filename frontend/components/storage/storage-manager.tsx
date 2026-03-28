/**
 * Storage Manager Component
 * 
 * Allows users to view and manage their local storage data.
 * Shows what's stored and allows deletion of items.
 * 
 * Requirements: Req 4 - Local Storage Preference
 * Task: 6.2.5 - Implement local storage quota management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, FileText, CheckSquare, AlertTriangle } from 'lucide-react';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { StorageMonitor } from '@/lib/storage/storage-monitor';
import { cn } from '@/lib/utils';

interface StorageItem {
  key: string;
  type: 'session' | 'task' | 'other';
  size: number;
  lastModified?: string;
}

interface StorageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTier: 'free' | 'premium';
  onItemsDeleted?: (count: number) => void;
}

export function StorageManager({
  open,
  onOpenChange,
  userTier,
  onItemsDeleted,
}: StorageManagerProps) {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [usageSummary, setUsageSummary] = useState<string>('');

  useEffect(() => {
    if (open && userTier === 'free') {
      loadStorageItems();
    }
  }, [open, userTier]);

  const loadStorageItems = async () => {
    setIsLoading(true);
    try {
      const storage = StorageFactory.create(userTier);
      const monitor = new StorageMonitor(storage);
      
      // Get all keys
      const keys = await storage.list('');
      
      // Build items list
      const storageItems: StorageItem[] = [];
      
      for (const key of keys) {
        const data = await storage.load(key);
        const size = StorageMonitor.estimateDataSize(data);
        
        let type: 'session' | 'task' | 'other' = 'other';
        if (key.startsWith('session_')) {
          type = 'session';
        } else if (key.startsWith('task_')) {
          type = 'task';
        }
        
        storageItems.push({
          key,
          type,
          size,
          lastModified: data?.updatedAt || data?.createdAt,
        });
      }
      
      // Sort by size (largest first)
      storageItems.sort((a, b) => b.size - a.size);
      setItems(storageItems);
      
      // Get usage summary
      const summary = await monitor.getUsageSummary();
      setUsageSummary(summary);
    } catch (error) {
      console.error('Failed to load storage items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (key: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.key)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    setIsDeleting(true);
    try {
      const storage = StorageFactory.create(userTier);
      
      for (const key of selectedItems) {
        await storage.delete(key);
      }
      
      if (onItemsDeleted) {
        onItemsDeleted(selectedItems.size);
      }
      
      // Reload items
      setSelectedItems(new Set());
      await loadStorageItems();
    } catch (error) {
      console.error('Failed to delete items:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getItemIcon = (type: StorageItem['type']) => {
    switch (type) {
      case 'session':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getItemLabel = (key: string, type: StorageItem['type']) => {
    if (type === 'session') {
      return key.replace('session_notes_', 'Session: ').replace('session_data_', 'Session Data: ');
    }
    if (type === 'task') {
      return key.replace('task_', 'Task: ');
    }
    return key;
  };

  const totalSelectedSize = Array.from(selectedItems).reduce((total, key) => {
    const item = items.find(i => i.key === key);
    return total + (item?.size || 0);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Storage</DialogTitle>
          <DialogDescription>
            View and delete items from your local storage • {usageSummary}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={items.length === 0}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.size > 0
                  ? `${selectedItems.size} selected (${StorageMonitor.formatBytes(totalSelectedSize)})`
                  : 'Select all'}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedItems.size === 0 || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>

          {/* Items List */}
          <ScrollArea className="h-[400px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No items stored</p>
              </div>
            ) : (
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer',
                      selectedItems.has(item.key) && 'bg-muted'
                    )}
                    onClick={() => handleSelectItem(item.key)}
                  >
                    <Checkbox
                      checked={selectedItems.has(item.key)}
                      onCheckedChange={() => handleSelectItem(item.key)}
                    />
                    {getItemIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getItemLabel(item.key, item.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {StorageMonitor.formatBytes(item.size)}
                        {item.lastModified && (
                          <> • {new Date(item.lastModified).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Deleted items cannot be recovered. Make sure you have backups if needed.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
