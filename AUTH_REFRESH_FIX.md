# Authentication Refresh Fix

## Problem
When refreshing any page in the application, users were being redirected to the login page even when authenticated, and then redirected back to the dashboard instead of the original page.

**Example URL during redirect:**
```
http://localhost:4200/auth/login?returnUrl=%2Fprojects%2F1a539151-b7c6-4582-ac5d-95080324dd5c%2Ftasks%2F4379f271-4928-49ca-828a-c66c7e6fdea3
```

## Root Cause
The issue was a **timing problem** in the authentication initialization:

1. **APP_INITIALIZER** was checking localStorage directly but not initializing the `AuthService`
2. **Auth Guard** was also checking localStorage directly instead of using `AuthService.isAuthenticated`
3. When the page refreshed, the `AuthService` constructor hadn't run yet, so the `isAuthenticatedSubject` was still `false`
4. The guard would see tokens in localStorage but the service's reactive state wasn't initialized

## Solution

### 1. Updated Auth Initializer (`auth.initializer.ts`)
**Changed from:** Checking localStorage directly via `StorageService`
**Changed to:** Injecting and accessing `AuthService` to force initialization

```typescript
export function initializeAuth(authService: AuthService) {
  return () => {
    // Force AuthService to initialize by accessing it
    // This ensures the constructor runs and loadUserFromStorage() is called
    const isAuth = authService.isAuthenticated;
    
    if (isAuth) {
      console.log('🔐 Auth initialized: User authenticated');
    } else {
      console.log('🔓 Auth initialized: User not authenticated');
    }
    
    return Promise.resolve();
  };
}
```

**Why this works:**
- Accessing `authService.isAuthenticated` forces Angular to instantiate the service
- The service constructor runs `loadUserFromStorage()` which sets the reactive state
- This happens **before** any routing occurs (APP_INITIALIZER runs first)

### 2. Updated App Config (`app.config.ts`)
**Changed dependency from:** `StorageService` → `AuthService`

```typescript
{
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  deps: [AuthService],  // Changed from StorageService
  multi: true,
}
```

### 3. Updated Auth Guard (`auth.guard.ts`)
**Changed from:** Checking localStorage directly
**Changed to:** Using `AuthService.isAuthenticated`

```typescript
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use AuthService's isAuthenticated which is properly initialized
  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
```

**Why this works:**
- The guard now uses the service's reactive state instead of raw localStorage
- The state is guaranteed to be initialized by APP_INITIALIZER
- Single source of truth for authentication status

## Flow After Fix

### Page Refresh Flow (User Authenticated)
1. ✅ APP_INITIALIZER runs → injects AuthService
2. ✅ AuthService constructor runs → calls `loadUserFromStorage()`
3. ✅ `isAuthenticatedSubject.next(true)` is set
4. ✅ Routing starts → Auth guard checks `authService.isAuthenticated`
5. ✅ Guard returns `true` → User stays on current page
6. ✅ **No redirect to login!**

### Page Refresh Flow (User Not Authenticated)
1. ✅ APP_INITIALIZER runs → injects AuthService
2. ✅ AuthService constructor runs → no token found
3. ✅ `isAuthenticatedSubject` remains `false`
4. ✅ Routing starts → Auth guard checks `authService.isAuthenticated`
5. ✅ Guard returns UrlTree with returnUrl
6. ✅ User redirected to login with correct returnUrl
7. ✅ After login, redirects to returnUrl (not dashboard)

## Testing
1. **Test authenticated refresh:**
   - Login to the application
   - Navigate to any protected page (e.g., task detail)
   - Hard refresh (Ctrl+R or F5)
   - ✅ Should stay on the same page without redirect

2. **Test unauthenticated access:**
   - Logout or clear localStorage
   - Try to access a protected page directly
   - ✅ Should redirect to login with returnUrl
   - Login successfully
   - ✅ Should redirect back to the original page

## Files Modified
- `src/app/core/initializers/auth.initializer.ts`
- `src/app/app.config.ts`
- `src/app/core/guards/auth.guard.ts`

## Key Takeaways
1. **APP_INITIALIZER** should initialize services, not just check raw data
2. **Guards** should use service state, not duplicate logic
3. **Single source of truth** prevents timing issues
4. **Reactive state** (BehaviorSubject) is more reliable than direct storage checks
