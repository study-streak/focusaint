'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Bell, Calendar, Settings as SettingsIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { ReminderList } from '@/components/reminders/reminder-list';
import { ReminderCreationForm } from '@/components/reminders/reminder-creation-form';

// Dynamically import NotificationSettings with no SSR
const NotificationSettings = dynamic(
  () => import('@/components/notifications/notification-settings').then(mod => ({ default: mod.NotificationSettings })),
  { ssr: false }
);

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        const userData = data.user || data;
        setUser(userData);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };

    fetchUser();
  }, [router]);

  const handleReminderCreated = () => {
    // Refresh the reminder list
    setRefreshKey(prev => prev + 1);
    // Switch to reminders tab to show the new reminder
    setActiveTab('reminders');
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <DashboardHeader user={user} />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/reminders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reminders
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Reminder Settings</h1>
            <p className="text-muted-foreground">
              Manage your notification preferences and scheduled reminders
            </p>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />
              My Reminders
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <Calendar className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          {/* Notification Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <NotificationSettings />
            
            <Card>
              <CardHeader>
                <CardTitle>Reminder Behavior</CardTitle>
                <CardDescription>
                  How reminders work in focusaint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Browser Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    When enabled, you'll receive notifications even when the app is closed or minimized. 
                    Perfect for staying on track with your study schedule.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">In-App Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    If browser notifications are disabled or not supported, you'll see reminder cards 
                    in the top-right corner when using the app. These work just like browser notifications 
                    with snooze and dismiss options.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Snooze & Dismiss</h4>
                  <p className="text-sm text-muted-foreground">
                    Snooze a reminder to be notified again in 10 minutes. Dismiss a reminder to mark it 
                    as acknowledged. Recurring reminders will trigger again at their next scheduled time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Reminders List Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reminders</CardTitle>
                <CardDescription>
                  View and manage all your active reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReminderList key={refreshKey} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Reminder Tab */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Reminder</CardTitle>
                <CardDescription>
                  Schedule a reminder for your study sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReminderCreationForm onSuccess={handleReminderCreated} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
