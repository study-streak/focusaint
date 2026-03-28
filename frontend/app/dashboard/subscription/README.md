# Subscription Management Dashboard

This page provides a comprehensive subscription management interface for users to view and manage their focusaint subscription.

## Features

### Current Subscription Status
- Displays current plan (Free, Premium Monthly, Premium Yearly)
- Shows subscription status (Active, Canceled, Past Due, etc.)
- Displays renewal/expiration date
- Shows cancellation status with warning banner

### Actions Available

#### For Premium Users
- **Change Plan**: Switch between Monthly and Yearly plans with prorated billing
- **Cancel Subscription**: Cancel at period end (maintains access until expiration)
- **Reactivate Subscription**: Restore a canceled subscription before it expires

#### For Free Users
- **Upgrade to Premium**: Redirects to pricing page for plan selection

### Premium Features Display
Shows all 12 premium features with checkmarks:
- Unlimited study sessions
- Cloud sync across devices
- Advanced analytics & insights
- Extended LLM token limits
- Unlimited history access
- Export notes (PDF/Markdown)
- Priority AI responses
- Custom AI persona
- Private accountability groups
- Streak insurance
- No ads
- Early access to new features

## API Integration

### Endpoints Used
- `GET /api/subscription/status` - Fetch current subscription status
- `POST /api/subscription/cancel` - Cancel subscription at period end
- `POST /api/subscription/reactivate` - Reactivate canceled subscription
- `POST /api/subscription/change-plan` - Change between monthly/yearly plans

### Data Flow
1. Page loads and fetches user profile and subscription status
2. User actions trigger API calls with loading states
3. Success responses refresh subscription data
4. Errors display user-friendly alert messages

## Components Used

### UI Components (shadcn/ui)
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button with variants (default, outline, ghost)
- Badge for status indicators
- AlertDialog for confirmation dialogs
- Loader2 for loading states

### Icons (lucide-react)
- Crown - Premium indicator
- Calendar - Date display
- AlertCircle - Warning messages
- Check - Feature list checkmarks
- ArrowRight - Navigation hints
- Loader2 - Loading spinner

## User Experience

### Loading States
- Full page loader on initial load
- Button-level loaders during actions
- Disabled states prevent duplicate submissions

### Confirmation Dialogs
- Cancel subscription requires confirmation
- Change plan shows both options with current plan highlighted
- Clear messaging about billing implications

### Visual Feedback
- Current plan badge in top-right
- Yellow warning banner for canceled subscriptions
- Green "Save 17%" badge on yearly plan
- Disabled state for current plan in change dialog

## Navigation
- Back to Dashboard button at bottom
- Links from SubscriptionCard component
- Accessible from profile settings

## Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Buttons stack vertically on mobile
- Dialog content adjusts for small screens

## Error Handling
- Try-catch blocks around all API calls
- User-friendly error messages via alerts
- Console logging for debugging
- Graceful fallbacks for missing data

## Future Enhancements
- Billing history view
- Invoice downloads
- Payment method management
- Usage statistics
- Proration preview before plan changes
