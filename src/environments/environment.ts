/**
 * Development Environment Configuration
 */

export const environment = {
  production: false,
  // apiUrl: 'http://localhost:3000/api/v1',
  apiUrl: 'https://helplineapi.ramiscope.us/api/v1',
  apiTimeout: 25000, // 30 seconds
  tokenKey: 'rpms_access_token',
  refreshTokenKey: 'rpms_refresh_token',
  userKey: 'rpms_user',
};
