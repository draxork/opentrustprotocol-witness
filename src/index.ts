/**
 * OpenTrust Protocol Witness - Main Entry Point
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

// Export all components
export * from './simple-witness';
export * from './analytics/OTPAnalyticsEngine';
export * from './ml/MLPredictiveEngine';
export * from './storage/MemoryStorage';
export * from './storage/PostgreSQLStorage';
export * from './witness/EnhancedWitness';
export * from './dashboard/PerformanceDashboard';
export * from './api/rest-server';
export * from './api/websocket-server';
export * from './server';
export * from './types/index';

// Version information
export const VERSION = '4.0.2';

export const VERSION_INFO = {
  version: VERSION,
  name: 'OpenTrust Protocol Witness',
  description: 'Performance Witness & Analytics Engine for OpenTrust Protocol',
  author: 'OpenTrust Protocol Team',
  license: 'MIT',
  repository: 'https://github.com/draxork/opentrustprotocol-witness',
  homepage: 'https://github.com/draxork/opentrustprotocol-witness#readme'
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
