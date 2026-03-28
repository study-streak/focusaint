/**
 * Service Worker for handling notification actions
 * This enables action buttons on browser notifications
 */

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  console.log('Notification clicked:', { action, data });

  notification.close();

  // Handle different actions
  if (action === 'open') {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
    );
  } else if (action === 'snooze') {
    // Send snooze request to the API
    const reminderId = data.reminderId;
    if (reminderId) {
      event.waitUntil(
        fetch(`${self.location.origin}/api/reminders/${reminderId}/snooze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration: 10 }),
          credentials: 'include',
        })
          .then((response) => {
            if (response.ok) {
              console.log('Reminder snoozed successfully');
              // Show a confirmation notification
              return self.registration.showNotification('Reminder Snoozed', {
                body: 'You will be reminded again in 10 minutes',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'snooze-confirmation',
                requireInteraction: false,
              });
            } else {
              throw new Error('Failed to snooze reminder');
            }
          })
          .catch((error) => {
            console.error('Error snoozing reminder:', error);
          })
      );
    }
  } else if (action === 'dismiss') {
    // Send dismiss request to the API
    const reminderId = data.reminderId;
    if (reminderId) {
      event.waitUntil(
        fetch(`${self.location.origin}/api/reminders/${reminderId}/dismiss`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
          .then((response) => {
            if (response.ok) {
              console.log('Reminder dismissed successfully');
            } else {
              throw new Error('Failed to dismiss reminder');
            }
          })
          .catch((error) => {
            console.error('Error dismissing reminder:', error);
          })
      );
    }
  } else {
    // Default click (no action button) - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
    );
  }
});

// Listen for notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Handle push notifications (for future WebSocket/Push API integration)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.message || 'You have a new reminder',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: data.tag || 'reminder',
        requireInteraction: true,
        data: data,
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'snooze', title: 'Snooze 10m' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Focusaint Reminder', options)
      );
    } catch (error) {
      console.error('Error parsing push notification:', error);
    }
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Notification service worker installed');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Notification service worker activated');
  event.waitUntil(clients.claim());
});
