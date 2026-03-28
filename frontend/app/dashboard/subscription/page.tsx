"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Crown, Calendar, AlertCircle, ArrowRight, Check } from "lucide-react"
import { 
  getSubscriptionStatus, 
  cancelSubscription, 
  reactivateSubscription,
  changeSubscriptionPlan,
  type SubscriptionStatus 
} from "@/lib/subscription"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import DashboardHeader from "@/components/dashboard/dashboard-header"

export default function SubscriptionPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'premium_monthly' | 'premium_yearly' | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        // Fetch user profile
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user || userData)
        }

        // Fetch subscription status
        const status = await getSubscriptionStatus()
        setSubscription(status)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  async function handleCancel() {
    setActionLoading(true)
    try {
      await cancelSubscription()
      const status = await getSubscriptionStatus()
      setSubscription(status)
      setShowCancelDialog(false)
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReactivate() {
    setActionLoading(true)
    try {
      await reactivateSubscription()
      const status = await getSubscriptionStatus()
      setSubscription(status)
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      alert('Failed to reactivate subscription. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleChangePlan() {
    if (!selectedPlan) return

    setActionLoading(true)
    try {
      await changeSubscriptionPlan(selectedPlan)
      const status = await getSubscriptionStatus()
      setSubscription(status)
      setShowChangePlanDialog(false)
      setSelectedPlan(null)
    } catch (error) {
      console.error('Failed to change plan:', error)
      alert('Failed to change plan. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isPremium = subscription?.tier === 'premium'
  const isCanceled = subscription?.cancelAtPeriodEnd
  const periodEnd = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  const currentPlan = subscription?.plan
  const isMonthly = currentPlan === 'premium_monthly'
  const isYearly = currentPlan === 'premium_yearly'

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <DashboardHeader user={user} />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Current Subscription Status */}
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Subscription
                  {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </div>
              <Badge variant={isPremium ? 'default' : 'secondary'} className="text-base px-4 py-1">
                {isPremium ? 'Premium' : 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPremium ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold">
                      {isMonthly ? 'Premium Monthly' : 'Premium Yearly'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold capitalize">{subscription.status}</p>
                  </div>
                  {periodEnd && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {isCanceled ? 'Expires on' : 'Renews on'}
                      </p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {periodEnd}
                      </p>
                    </div>
                  )}
                </div>

                {isCanceled && (
                  <div className="flex items-start gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Subscription Canceled
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Your premium access will continue until {periodEnd}. After that, you'll be downgraded to the free tier.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  {isCanceled ? (
                    <Button
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      size="lg"
                    >
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reactivate Subscription
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => setShowChangePlanDialog(true)}
                        disabled={actionLoading}
                        size="lg"
                      >
                        Change Plan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={actionLoading}
                        size="lg"
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  You're currently on the free plan. Upgrade to Premium to unlock unlimited sessions, cloud sync, advanced analytics, and more.
                </p>
                <Button
                  onClick={() => router.push('/pricing')}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Features */}
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>
              What you get with Premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Unlimited study sessions',
                'Cloud sync across devices',
                'Advanced analytics & insights',
                'Extended LLM token limits',
                'Unlimited history access',
                'Export notes (PDF/Markdown)',
                'Priority AI responses',
                'Custom AI persona',
                'Private accountability groups',
                'Streak insurance',
                'No ads',
                'Early access to new features'
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Cancel Subscription Dialog */}
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

      {/* Change Plan Dialog */}
      <AlertDialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new plan. Changes will be prorated and reflected in your next billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan('premium_monthly')}
              disabled={isMonthly}
              className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                selectedPlan === 'premium_monthly'
                  ? 'border-primary bg-primary/5'
                  : isMonthly
                  ? 'border-muted bg-muted/50 cursor-not-allowed'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {isMonthly && (
                <Badge className="absolute top-4 right-4">Current Plan</Badge>
              )}
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Monthly</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Billed monthly. Cancel anytime.
                </p>
              </div>
            </button>

            {/* Yearly Plan */}
            <button
              onClick={() => setSelectedPlan('premium_yearly')}
              disabled={isYearly}
              className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                selectedPlan === 'premium_yearly'
                  ? 'border-primary bg-primary/5'
                  : isYearly
                  ? 'border-muted bg-muted/50 cursor-not-allowed'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {isYearly && (
                <Badge className="absolute top-4 right-4">Current Plan</Badge>
              )}
              <Badge className="absolute top-4 right-4 bg-green-500">Save 17%</Badge>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Yearly</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$99.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  $8.33/month. Best value!
                </p>
              </div>
            </button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePlan}
              disabled={actionLoading || !selectedPlan}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
