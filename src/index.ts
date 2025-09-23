/**
 * OpenTrust Protocol Oracle - Main Entry Point
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

// Export all components
export * from './simple-oracle';
export * from './analytics/OTPAnalyticsEngine';
export * from './storage/MemoryStorage';
export * from './storage/PostgreSQLStorage';
export * from './oracle/EnhancedOracle';
export * from './dashboard/PerformanceDashboard';
export * from './api/rest-server';
export * from './api/websocket-server';
export * from './server';
export * from './types/index';

// Version information
export const VERSION = '4.0.0';

export const VERSION_INFO = {
  version: VERSION,
  name: 'OpenTrust Protocol Oracle',
  description: 'Performance Oracle & Analytics Engine for OpenTrust Protocol',
  author: 'OpenTrust Protocol Team',
  license: 'MIT',
  repository: 'https://github.com/draxork/opentrustprotocol-oracle',
  homepage: 'https://github.com/draxork/opentrustprotocol-oracle#readme'
};

export function getPackageInfo() {
  return VERSION_INFO;
}

export function getSystemStatus() {
  return {
    version: VERSION,
    status: 'active',
    timestamp: new Date().toISOString()
  };
}

export default {
  VERSION,
  VERSION_INFO,
  getPackageInfo,
  getSystemStatus
};
