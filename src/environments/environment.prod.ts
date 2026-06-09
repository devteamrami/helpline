/**
 * Production Environment Configuration
 */

export const environment = {
  production: true,
  apiUrl: 'https://api.ramiscope.com/api/v1', // Update with your production API URL
  apiTimeout: 30000,
  tokenKey: 'rpms_access_token',
  refreshTokenKey: 'rpms_refresh_token',
  userKey: 'rpms_user',
};
