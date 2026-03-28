/**
 * Service Worker Registration Utility
 * Registers the notification service worker for handling notification actions
 */

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-notifications.js', {
      scope: '/',
    });

    console.log('Notification service worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Error registering notification service worker:', error);
    return null;
  }
}

export async function unregisterNotificationServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw-notifications.js');
    
    if (registration) {
      const success = await registration.unregister();
      console.log('Notification service worker unregistered:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Error unregistering notification service worker:', error);
    return false;
  }
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw-notifications.js');
    return registration || null;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}
