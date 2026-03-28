import { APIClient } from './api-client';

export interface SubscriptionStatus {
  hasSubscription: boolean;
  tier: 'free' | 'premium';
  plan?: 'premium_monthly' | 'premium_yearly';
  status?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

/**
 * Create a Dodo Payments checkout session or free subscription
 */
export async function createCheckoutSession(plan: 'monthly' | 'yearly' | 'free'): Promise<{ checkout_url?: string; paymentStatus: string; message: string }> {
  // Map plan to backend plan
  let backendPlan: 'premium_monthly' | 'premium_yearly' | 'free';
  if (plan === 'monthly') backendPlan = 'premium_monthly';
  else if (plan === 'yearly') backendPlan = 'premium_yearly';
  else backendPlan = 'free';
  const response = await APIClient.post<{ checkout_url?: string; paymentStatus: string; message: string }>('/subscription/create', {
    plan: backendPlan
  });
  return response;
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const response = await APIClient.get<SubscriptionStatus>('/subscription/status');
  return response;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(): Promise<{ message: string; currentPeriodEnd: string }> {
  const response = await APIClient.post<{ message: string; currentPeriodEnd: string }>('/subscription/cancel', {});
  return response;
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(): Promise<{ message: string }> {
  const response = await APIClient.post<{ message: string }>('/subscription/reactivate', {});
  return response;
}

/**
 * Change subscription plan (upgrade/downgrade)
 */
export async function changeSubscriptionPlan(newPlan: 'premium_monthly' | 'premium_yearly'): Promise<{ message: string; subscription: any }> {
  const response = await APIClient.post<{ message: string; subscription: any }>('/subscription/change-plan', {
    newPlan
  });
  return response;
}

/**
 * Redirect to Dodo Payments checkout
 */
export function redirectToCheckout(checkoutUrl: string) {
  window.location.href = checkoutUrl;
}
