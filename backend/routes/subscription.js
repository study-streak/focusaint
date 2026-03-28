import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createSubscription,
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  changeSubscriptionPlan,
  handleWebhook
} from '../controllers/subscription.controller.js';

const router = express.Router();

/**
 * @route   POST /api/subscription/create
 * @desc    Create a subscription directly with Stripe
 * @access  Private
 * @body    { priceId: string, plan: 'premium_monthly' | 'premium_yearly' }
 */
router.post('/create', authenticateToken, createSubscription);

/**
 * @route   POST /api/subscription/create-checkout-session
 * @desc    Create a Stripe checkout session for subscription
 * @access  Private
 */
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);

/**
 * @route   GET /api/subscription/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/status', authenticateToken, getSubscriptionStatus);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel subscription at period end
 * @access  Private
 */
router.post('/cancel', authenticateToken, cancelSubscription);

/**
 * @route   POST /api/subscription/reactivate
 * @desc    Reactivate a canceled subscription
 * @access  Private
 */
router.post('/reactivate', authenticateToken, reactivateSubscription);

/**
 * @route   POST /api/subscription/change-plan
 * @desc    Change subscription plan (upgrade/downgrade)
 * @access  Private
 * @body    { newPlan: 'premium_monthly' | 'premium_yearly' }
 */
router.post('/change-plan', authenticateToken, changeSubscriptionPlan);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (but verified with Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
