import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Stripe integration
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  stripePriceId: {
    type: String,
    required: true
  },
  
  // Plan details
  plan: {
    type: String,
    enum: ['premium_monthly', 'premium_yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'expired', 'trialing'],
    default: 'active'
  },
  
  // Billing periods
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date
  },
  
  // Trial
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  
  // Payment history
  lastPaymentDate: {
    type: Date
  },
  lastPaymentAmount: {
    type: Number
  },
  failedPaymentAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
