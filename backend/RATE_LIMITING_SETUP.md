# Rate Limiting Setup Guide

## Quick Start

### 1. Install Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

**Docker (Recommended for all platforms):**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. Configure Environment

Add to `backend/.env`:
```env
REDIS_URL=redis://localhost:6379
```

### 3. Verify Installation

The rate limiting middleware is already integrated. Start your server:

```bash
cd backend
npm run dev
```

You should see in the logs:
```
Redis connected successfully
✓ focusaint server running on http://localhost:5000
```

## Testing Rate Limits

### Test Login Rate Limit (5 requests per 15 min)

```bash
# This should succeed 5 times, then fail on the 6th
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```

Expected output on 6th request:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again in 15 minutes.",
    "details": {
      "limit": 5,
      "windowMs": 900000,
      "retryAfter": 900
    }
  }
}
```

### Test AI Rate Limit (20 requests per hour)

```bash
# Get a valid JWT token first by logging in
TOKEN="your-jwt-token-here"

# Test AI endpoint
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"videoUrl":"https://youtube.com/watch?v=test","message":"test"}' \
  -i
```

Check the response headers:
```
RateLimit-Limit: 20
RateLimit-Remaining: 19
RateLimit-Reset: 1705245600
```

### Check Redis Keys

```bash
# Connect to Redis
redis-cli

# List all rate limit keys
KEYS rate-limit:*

# Check specific key value
GET "rate-limit:/api/auth/login:127.0.0.1"

# Monitor Redis commands in real-time
MONITOR
```

## Production Deployment

### Option 1: Redis Cloud (Recommended)

1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy the connection string
4. Update `.env`:
   ```env
   REDIS_URL=redis://default:password@redis-12345.cloud.redislabs.com:12345
   ```

### Option 2: AWS ElastiCache

1. Create ElastiCache Redis cluster in AWS Console
2. Note the endpoint URL
3. Update `.env`:
   ```env
   REDIS_URL=redis://your-cluster.cache.amazonaws.com:6379
   ```

### Option 3: DigitalOcean Managed Redis

1. Create Managed Redis in DigitalOcean
2. Copy connection details
3. Update `.env`:
   ```env
   REDIS_URL=redis://default:password@your-redis-do-user.db.ondigitalocean.com:25061
   ```

## Troubleshooting

### Redis Not Connecting

**Check if Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

**Check Redis logs:**
```bash
# macOS
tail -f /usr/local/var/log/redis.log

# Linux
sudo tail -f /var/log/redis/redis-server.log

# Docker
docker logs redis
```

**Fallback behavior:**
If Redis fails to connect, the system automatically falls back to in-memory rate limiting. You'll see:
```
Redis Client Error: [error details]
Rate limiting will use memory store as fallback
```

### Rate Limits Not Working

1. **Check middleware order in server.js:**
   ```javascript
   app.use(extractUserForRateLimit)  // Must be BEFORE rate limiters
   app.use('/api', apiLimiter)
   ```

2. **Verify rate limiter is applied to route:**
   ```javascript
   router.post('/login', authLoginLimiter, async (req, res) => {
     // Route handler
   });
   ```

3. **Check Redis connection:**
   ```bash
   redis-cli ping
   ```

### Different Behavior in Development vs Production

In development, rate limits might reset when you restart the server if using memory store. In production with Redis, limits persist across restarts.

## Monitoring

### Check Rate Limit Usage

```bash
# Connect to Redis
redis-cli

# Count rate limit keys
KEYS rate-limit:* | wc -l

# View all keys with TTL
for key in $(redis-cli KEYS "rate-limit:*"); do
  echo "$key: $(redis-cli TTL $key)s remaining"
done
```

### Monitor in Application

Add logging to track rate limit hits:

```javascript
// In your route handler
app.use((req, res, next) => {
  const remaining = res.getHeader('RateLimit-Remaining');
  if (remaining && remaining < 10) {
    console.warn(`User ${req.user?.id || req.ip} approaching rate limit: ${remaining} remaining`);
  }
  next();
});
```

## Rate Limit Summary

| Endpoint | Window | Limit | Applied To |
|----------|--------|-------|------------|
| POST /api/auth/login | 15 min | 5 | IP address |
| POST /api/auth/signup | 1 hour | 3 | IP address |
| POST /api/auth/verify-otp | 15 min | 5 | IP address |
| POST /api/auth/resend-otp | 15 min | 5 | IP address |
| POST /api/forgot/forgot-password | 1 hour | 3 | IP address |
| POST /api/forgot/reset-password-token | 1 hour | 3 | IP address |
| POST /api/ai/* | 1 hour | 20 | User ID or IP |
| POST /api/habit/start | 1 min | 10 | User ID or IP |
| POST /api/habit/session | 1 min | 10 | User ID or IP |
| All /api/* | 1 min | 100 | User ID or IP |

## Next Steps

1. ✅ Redis installed and running
2. ✅ Environment configured
3. ✅ Rate limiting active
4. 📝 Monitor rate limit usage in production
5. 📝 Adjust limits based on real traffic patterns
6. 📝 Set up alerts for rate limit abuse

## Support

For issues or questions:
- Check logs: `npm run dev` output
- Redis logs: `redis-cli` commands
- Documentation: `backend/middleware/RATE_LIMITING.md`
