'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Calendar, AlertCircle } from 'lucide-react';
import { getSubscriptionStatus, cancelSubscription, reactivateSubscription, type SubscriptionStatus } from '@/lib/subscription';
import { useRouter } from 'next/navigation';
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

export function SubscriptionCard() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    try {
      await cancelSubscription();
      await loadSubscription();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      await reactivateSubscription();
      await loadSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const isPremium = subscription.tier === 'premium';
  const isCanceled = subscription.cancelAtPeriodEnd;
  const periodEnd = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Subscription
                {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
              </CardTitle>
              <CardDescription>
                Manage your subscription plan
              </CardDescription>
            </div>
            <Badge variant={isPremium ? 'default' : 'secondary'}>
              {isPremium ? 'Premium' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremium ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">
                    {subscription.plan === 'premium_monthly' ? 'Monthly' : 'Yearly'}
                  </span>
                </div>
                {periodEnd && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isCanceled ? 'Expires on' : 'Renews on'}
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {periodEnd}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{subscription.status}</span>
                </div>
              </div>

              {isCanceled && (
                <div className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                      Subscription Canceled
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Your premium access will continue until {periodEnd}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {isCanceled ? (
                  <Button
                    onClick={handleReactivate}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    Cancel Subscription
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/subscription')}
                  className="w-full"
                >
                  View Full Details
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to unlock unlimited sessions, cloud sync, advanced analytics, and more.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/pricing')}
                  className="w-full"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/subscription')}
                  className="w-full"
                >
                  Manage Subscription
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your premium access will continue until {periodEnd}. After that, you'll be downgraded to the free tier.
              You can reactivate your subscription at any time before it expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
