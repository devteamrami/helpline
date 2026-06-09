/**
 * Auth Initializer
 * Ensures authentication state is loaded before app starts
 * This runs BEFORE routing, preventing any URL flickering
 */

import { AuthService } from '../services/auth.service';

export function initializeAuth(authService: AuthService) {
  return () => {
    return new Promise<void>((resolve) => {
      // Force AuthService to initialize by accessing it
      // This ensures the constructor runs and loadUserFromStorage() is called
      // before any routing happens
      
      // Give a tiny delay to ensure localStorage is fully accessible
      setTimeout(() => {
        const isAuth = authService.isAuthenticated;
        const user = authService.currentUserValue;
        
        if (isAuth && user) {
          console.log('🔐 Auth initialized: User authenticated -', user.username);
        } else {
          console.log('🔓 Auth initialized: User not authenticated');
        }
        
        resolve();
      }, 0);
    });
  };
}
