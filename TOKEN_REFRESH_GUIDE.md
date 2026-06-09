# 🔄 Token Refresh System - Complete Guide

## Overview

The Ramiscope PMS implements a **dual-layer token refresh system** that ensures users stay authenticated without interruption:

1. **Proactive Refresh** - Automatically refreshes tokens before they expire
2. **Reactive Refresh** - Refreshes tokens when API calls receive 401 errors

## How It Works

### Token Lifecycle

```
User Login
    ↓
Generate Tokens
├── Access Token (short-lived: 3-30 minutes)
└── Refresh Token (long-lived: 7 days)
    ↓
Store in Browser
├── localStorage: rpms_access_token
├── localStorage: rpms_refresh_token
└── localStorage: rpms_user
    ↓
Automatic Monitoring
├── Check every 60 seconds
├── Refresh 2 minutes before expiry
└── Handle 401 errors
    ↓
Token Refreshed
└── New Access Token → Continue Session
```

## Two-Layer Refresh System

### Layer 1: Proactive Token Refresh (TokenRefreshService)

**Purpose:** Refresh tokens BEFORE they expire

**How it works:**
1. Service starts when user logs in
2. Checks token expiry every 60 seconds
3. Refreshes token 2 minutes before expiry
4. Logs all activities to console

**Configuration:**
```typescript
CHECK_INTERVAL = 60000;        // Check every 60 seconds
REFRESH_THRESHOLD = 120000;    // Refresh 2 min before expiry
```

**Console Output:**
```
🔄 Token refresh service started
⏰ Token expires in 180 seconds
⏰ Token expires in 120 seconds
🔄 Token expiring soon, refreshing...
✅ Token refreshed successfully
⏰ Token expires in 180 seconds
```

### Layer 2: Reactive Token Refresh (Error Interceptor)

**Purpose:** Refresh tokens when API calls fail with 401

**How it works:**
1. API call returns 401 Unauthorized
2. Interceptor catches the error
3. Attempts to refresh the token
4. Retries the original request with new token
5. If refresh fails, logs user out

**Flow:**
```
API Request → 401 Error → Refresh Token → Retry Request → Success
                              ↓
                         Refresh Failed → Logout
```

## Configuration

### Backend Configuration (.env)

```env
# Token Expiry Times
JWT_ACCESS_EXPIRY=15m      # Access token: 15 minutes
JWT_REFRESH_EXPIRY=7d      # Refresh token: 7 days
```

**Recommended Settings:**

| Environment | Access Token | Refresh Token | Reason |
|-------------|--------------|---------------|--------|
| Development | 15m - 30m | 7d | Easier testing |
| Production | 15m | 7d | Better security |
| High Security | 5m | 1d | Maximum security |

### Frontend Configuration

**Token Refresh Service:**
```typescript
// src/app/core/services/token-refresh.service.ts

CHECK_INTERVAL = 60000;        // Check every 60 seconds
REFRESH_THRESHOLD = 120000;    // Refresh 2 minutes before expiry
```

**Adjust based on your access token expiry:**
- If `JWT_ACCESS_EXPIRY=3m`, set `REFRESH_THRESHOLD=60000` (1 minute)
- If `JWT_ACCESS_EXPIRY=15m`, set `REFRESH_THRESHOLD=120000` (2 minutes)
- If `JWT_ACCESS_EXPIRY=30m`, set `REFRESH_THRESHOLD=300000` (5 minutes)

## Testing Token Refresh

### Test 1: Proactive Refresh (Recommended)

1. **Set short expiry time:**
   ```env
   # .env
   JWT_ACCESS_EXPIRY=3m
   ```

2. **Restart backend:**
   ```bash
   cd ramiscope-pmt-system-backend
   npm run dev
   ```

3. **Login and watch console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Login to the application
   - You should see:
   ```
   🔄 Token refresh service started
   ⏰ Token expires in 180 seconds
   ⏰ Token expires in 120 seconds
   🔄 Token expiring soon, refreshing...
   ✅ Token refreshed successfully
   ```

4. **Verify in Network tab:**
   - Go to Network tab
   - After ~2 minutes, you'll see a POST request to `/auth/refresh`
   - Check the response - it should contain a new access token

5. **Check localStorage:**
   - Go to Application → Local Storage
   - Watch `rpms_access_token` value change after refresh

### Test 2: Reactive Refresh (401 Error)

1. **Manually expire token:**
   - Open DevTools → Application → Local Storage
   - Copy the `rpms_access_token` value
   - Modify it (change a few characters)
   - Save

2. **Make an API call:**
   - Try to access a protected page
   - Or click on any feature that calls the API

3. **Watch the flow:**
   - Network tab will show:
     1. Original request → 401 error
     2. POST to `/auth/refresh` → Success
     3. Original request retried → Success

### Test 3: Complete Token Expiry

1. **Set very short expiry:**
   ```env
   JWT_ACCESS_EXPIRY=1m
   JWT_REFRESH_EXPIRY=2m
   ```

2. **Login and wait:**
   - Login to the application
   - Wait for 2+ minutes (don't interact)
   - Try to navigate or refresh

3. **Expected behavior:**
   - After 2 minutes, refresh token expires
   - Next API call will fail
   - User will be logged out automatically
   - Redirected to login page

## Monitoring Token Refresh

### Browser Console Logs

**Successful Refresh:**
```
⏰ Token expires in 180 seconds
⏰ Token expires in 120 seconds
🔄 Token expiring soon, refreshing...
✅ Token refreshed successfully
⏰ Token expires in 180 seconds
```

**Failed Refresh:**
```
🔄 Token expiring soon, refreshing...
❌ Token refresh failed: Error: Invalid or expired refresh token
⏹️ Token refresh service stopped
```

**No Token:**
```
⚠️ No token found, stopping refresh service
⏹️ Token refresh service stopped
```

### Network Tab

**Refresh Request:**
```
POST http://localhost:5000/api/v1/auth/refresh
Status: 200 OK

Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Troubleshooting

### Issue: Token not refreshing automatically

**Symptoms:**
- No refresh requests in Network tab
- No console logs about token expiry
- User gets logged out after token expires

**Solutions:**

1. **Check if service is started:**
   ```typescript
   // Should see in console:
   🔄 Token refresh service started
   ```

2. **Verify token expiry is set:**
   ```bash
   # Backend .env
   JWT_ACCESS_EXPIRY=15m  # Must be set
   ```

3. **Check console for errors:**
   - Open DevTools Console
   - Look for JavaScript errors
   - Check if service is running

4. **Verify user is logged in:**
   - Check localStorage has tokens
   - Check `isAuthenticated$` observable

### Issue: Token refresh fails

**Symptoms:**
- Console shows: `❌ Token refresh failed`
- User gets logged out
- 401 errors in Network tab

**Solutions:**

1. **Check refresh token validity:**
   ```bash
   # Check if refresh token expired
   # Refresh tokens last 7 days by default
   ```

2. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/api/v1/health
   ```

3. **Check refresh endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"your-refresh-token"}'
   ```

4. **Check backend logs:**
   - Look for errors in backend console
   - Check database connection
   - Verify JWT secrets are set

### Issue: Redirect loop on refresh

**Symptoms:**
- Page keeps redirecting between login and dashboard
- URL shows: `/auth/login?returnUrl=%2Fdashboard`

**Solution:**
This has been fixed in the updated guards. The guards now check for token existence directly instead of waiting for observables.

**Verify fix:**
1. Refresh the page
2. Should stay on dashboard (if logged in)
3. Should stay on login (if not logged in)
4. No redirect loop

## Best Practices

### 1. Token Expiry Times

**Development:**
```env
JWT_ACCESS_EXPIRY=30m    # Longer for easier testing
JWT_REFRESH_EXPIRY=7d    # Standard
```

**Production:**
```env
JWT_ACCESS_EXPIRY=15m    # Balanced security/UX
JWT_REFRESH_EXPIRY=7d    # Standard
```

**High Security:**
```env
JWT_ACCESS_EXPIRY=5m     # Very short
JWT_REFRESH_EXPIRY=1d    # Shorter refresh
```

### 2. Refresh Threshold

Set refresh threshold to ~1/3 of access token expiry:
- 3 min token → 1 min threshold
- 15 min token → 2-5 min threshold
- 30 min token → 5-10 min threshold

### 3. Monitoring

Always monitor:
- Token refresh success rate
- Failed refresh attempts
- User logout frequency
- API 401 errors

### 4. Error Handling

- Always log refresh failures
- Gracefully handle expired refresh tokens
- Clear all tokens on logout
- Redirect to login on refresh failure

## Security Considerations

### 1. Token Storage

**Current Implementation:**
- Access Token: localStorage
- Refresh Token: localStorage
- User Data: localStorage

**More Secure (Future Enhancement):**
- Access Token: Memory only
- Refresh Token: HttpOnly cookie
- User Data: Memory/localStorage

### 2. Token Rotation

**Current:** Refresh token is reused
**Better:** Rotate refresh token on each use

**Implementation (Future):**
```typescript
// Return new refresh token with each refresh
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"  // Rotated
}
```

### 3. Refresh Token Revocation

**Current:** Tokens can be revoked in database
**Enhancement:** Implement token blacklist

## Summary

✅ **What's Implemented:**
- Proactive token refresh (before expiry)
- Reactive token refresh (on 401 errors)
- Automatic service start/stop
- Console logging for debugging
- Prevent multiple simultaneous refreshes
- Graceful error handling

✅ **What's Fixed:**
- Redirect loop on page refresh
- Token refresh not triggering
- Loading state stuck on login
- Better error messages

✅ **How to Test:**
- Set `JWT_ACCESS_EXPIRY=3m`
- Login and watch console
- See automatic refresh after ~2 minutes
- Check Network tab for refresh requests

✅ **Expected Behavior:**
- User stays logged in seamlessly
- No interruption to user experience
- Automatic logout only when refresh token expires
- Clear console logs for debugging

---

**Your token refresh system is now fully functional! 🎉**
