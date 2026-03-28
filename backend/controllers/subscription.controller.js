import Stripe from 'stripe';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

// Initialize Stripe only if API key is configured
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠ Stripe API key not configured - subscription features disabled');
}

/**
 * Create a subscription directly (without checkout session)
 * This creates a Stripe subscription and updates the user's tier immediately
 */
export const createSubscription = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing is not configured. Please contact support.' 
      });
    }
    
    const { priceId, plan } = req.body;
    
    // Validate required fields
    if (!priceId || !plan) {
      return res.status(400).json({ error: 'priceId and plan are required' });
    }
    
    // Validate plan
    if (!['premium_monthly', 'premium_yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be premium_monthly or premium_yearly' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId: user._id,
      status: { $in: ['active', 'trialing'] }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription',
        subscription: {
          plan: existingSubscription.plan,
          status: existingSubscription.status,
          currentPeriodEnd: existingSubscription.currentPeriodEnd
        }
      });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        userId: user._id.toString(),
        plan
      }
    });
    
    // Save subscription to database
    const subscription = await Subscription.create({
      userId: user._id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
    });
    
    // Update user tier to premium
    user.tier = 'premium';
    await user.save();
    
    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      },
      user: {
        tier: user.tier
      }
    });
    
  } catch (error) {
    console.error('Create subscription error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: 'Payment failed: ' + error.message });
    }
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid request: ' + error.message });
    }
    
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

/**
 * Create a Stripe checkout session for subscription
 */
export const createCheckoutSession = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing is not configured. Please contact support.' 
      });
    }
    
    const { plan } = req.body;
    
    // Validate plan
    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId: user._id,
      status: { $in: ['active', 'trialing'] }
    });
    
    if (existingSubscription) {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }
    
    // Get price ID from environment
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_PRICE_MONTHLY 
      : process.env.STRIPE_PRICE_YEARLY;
    
    if (!priceId) {
      return res.status(500).json({ error: 'Subscription plan not configured' });
    }
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Save customer ID to user
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=canceled`,
      metadata: {
        userId: user._id.toString(),
        plan: plan === 'monthly' ? 'premium_monthly' : 'premium_yearly'
      }
    });
    
    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
    
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    
    if (!subscription) {
      return res.json({ 
        hasSubscription: false,
        tier: 'free'
      });
    }
    
    res.json({
      hasSubscription: true,
      tier: 'premium',
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    });
    
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      userId: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Cancel subscription at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update local subscription
    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await subscription.save();
    
    res.json({ 
      message: 'Subscription will be canceled at the end of the billing period',
      currentPeriodEnd: subscription.currentPeriodEnd
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Reactivate a canceled subscription
 */
export const reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      userId: req.user.id,
      cancelAtPeriodEnd: true
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No canceled subscription found' });
    }
    
    // Reactivate subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });
    
    // Update local subscription
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    await subscription.save();
    
    res.json({ 
      message: 'Subscription reactivated successfully'
    });
    
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
};

/**
 * Change subscription plan (upgrade/downgrade)
 */
export const changeSubscriptionPlan = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ 
        error: 'Payment processing is not configured. Please contact support.' 
      });
    }
    
    const { newPlan } = req.body;
    
    // Validate required fields
    if (!newPlan) {
      return res.status(400).json({ error: 'newPlan is required' });
    }
    
    // Validate plan
    if (!['premium_monthly', 'premium_yearly'].includes(newPlan)) {
      return res.status(400).json({ 
        error: 'Invalid plan. Must be premium_monthly or premium_yearly' 
      });
    }
    
    // Get user's current subscription
    const subscription = await Subscription.findOne({ 
      userId: req.user.id,
      status: { $in: ['active', 'trialing'] }
    });
    
    if (!subscription) {
      return res.status(404).json({ 
        error: 'No active subscription found. Please create a subscription first.' 
      });
    }
    
    // Check if user is trying to change to the same plan
    if (subscription.plan === newPlan) {
      return res.status(400).json({ 
        error: 'You are already on this plan',
        currentPlan: subscription.plan
      });
    }
    
    // Get the new price ID from environment
    const newPriceId = newPlan === 'premium_monthly' 
      ? process.env.STRIPE_PRICE_MONTHLY 
      : process.env.STRIPE_PRICE_YEARLY;
    
    if (!newPriceId) {
      return res.status(500).json({ 
        error: 'Subscription plan not configured. Please contact support.' 
      });
    }
    
    // Get the Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    
    // Update the subscription in Stripe with proration
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: 'always_invoice', // Create invoice for proration
        metadata: {
          userId: req.user.id.toString(),
          plan: newPlan
        }
      }
    );
    
    // Update local subscription record
    subscription.plan = newPlan;
    subscription.stripePriceId = newPriceId;
    subscription.status = updatedStripeSubscription.status;
    subscription.currentPeriodStart = new Date(updatedStripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(updatedStripeSubscription.current_period_end * 1000);
    
    await subscription.save();
    
    // Determine if this was an upgrade or downgrade
    const isUpgrade = (subscription.plan === 'premium_monthly' && newPlan === 'premium_yearly');
    const changeType = isUpgrade ? 'upgraded' : 'downgraded';
    
    res.json({
      message: `Subscription ${changeType} successfully`,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
    
  } catch (error) {
    console.error('Change subscription plan error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid request: ' + error.message });
    }
    if (error.type === 'StripeAPIError') {
      return res.status(502).json({ error: 'Payment service error. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to change subscription plan' });
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res.status(503).json({ error: 'Payment processing not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Webhook handler helper functions
async function handleCheckoutSessionCompleted(session) {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;
  
  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Create subscription record
  await Subscription.create({
    userId,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: session.subscription,
    stripePriceId: stripeSubscription.items.data[0].price.id,
    plan,
    status: stripeSubscription.status,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
    trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
  });
  
  // Update user tier
  await User.findByIdAndUpdate(userId, { tier: 'premium' });
  
  console.log(`Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdate(stripeSubscription) {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: stripeSubscription.id 
  });
  
  if (!subscription) {
    console.error(`Subscription not found: ${stripeSubscription.id}`);
    return;
  }
  
  // Update subscription details
  subscription.status = stripeSubscription.status;
  subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  
  await subscription.save();
  
  // Update user tier based on status
  const tier = ['active', 'trialing'].includes(stripeSubscription.status) ? 'premium' : 'free';
  await User.findByIdAndUpdate(subscription.userId, { tier });
  
  console.log(`Subscription updated: ${stripeSubscription.id}`);
}

async function handleSubscriptionDeleted(stripeSubscription) {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: stripeSubscription.id 
  });
  
  if (!subscription) {
    console.error(`Subscription not found: ${stripeSubscription.id}`);
    return;
  }
  
  // Update subscription status
  subscription.status = 'expired';
  await subscription.save();
  
  // Downgrade user to free tier
  await User.findByIdAndUpdate(subscription.userId, { tier: 'free' });
  
  console.log(`Subscription deleted for user ${subscription.userId}`);
}

async function handlePaymentSucceeded(invoice) {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: invoice.subscription 
  });
  
  if (!subscription) {
    return;
  }
  
  // Update payment details
  subscription.lastPaymentDate = new Date();
  subscription.lastPaymentAmount = invoice.amount_paid / 100; // Convert from cents
  subscription.failedPaymentAttempts = 0;
  
  await subscription.save();
  
  console.log(`Payment succeeded for subscription ${invoice.subscription}`);
}

async function handlePaymentFailed(invoice) {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: invoice.subscription 
  });
  
  if (!subscription) {
    return;
  }
  
  // Increment failed payment attempts
  subscription.failedPaymentAttempts += 1;
  subscription.status = 'past_due';
  
  await subscription.save();
  
  // TODO: Send email notification to user about failed payment
  
  console.log(`Payment failed for subscription ${invoice.subscription}`);
}
