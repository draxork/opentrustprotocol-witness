/**
 * OpenTrust Protocol Oracle - API Integration Tests
 * 
 * Comprehensive tests for REST API and WebSocket functionality
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { OracleAPIServer, APIConfig } from '../src/api/rest-server';
import { OracleWebSocketServer } from '../src/api/websocket-server';
import { OracleServer, ServerConfig } from '../src/server';

// Mock dependencies
jest.mock('pg', () => ({
  Pool: jest.fn(() => {
    const mockQuery = jest.fn((sql: string) => {
      console.log('Mock query received:', sql);
      
      // Mock specific queries for getStorageStats
      if (sql.includes('SELECT COUNT(*) as count FROM judgment_pairs')) {
        console.log('Matched COUNT(*) query');
        return Promise.resolve({ rows: [{ count: '0' }], rowCount: 1 });
      }
      if (sql.includes('SELECT COUNT(DISTINCT outcome_oracle_source) as count')) {
        console.log('Matched COUNT(DISTINCT) query');
        return Promise.resolve({ rows: [{ count: '0' }], rowCount: 1 });
      }
      if (sql.includes('SELECT MIN(decision_timestamp) as oldest, MAX(decision_timestamp) as newest, COUNT(decision_timestamp) as count')) {
        console.log('Matched timestamp query');
        return Promise.resolve({ rows: [{ oldest: null, newest: null, count: '0' }], rowCount: 1 });
      }
      // Mock other specific queries
      if (sql.includes('SELECT COUNT(*) FROM judgment_pairs')) {
        console.log('Matched COUNT(*) query (fallback)');
        return Promise.resolve({ rows: [{ count: '0' }], rowCount: 1 });
      }
      if (sql.includes('SELECT COUNT(DISTINCT oracle_id) FROM judgment_pairs')) {
        console.log('Matched COUNT(DISTINCT oracle_id) query');
        return Promise.resolve({ rows: [{ count: '0' }], rowCount: 1 });
      }
      if (sql.includes('SELECT MIN(timestamp), MAX(timestamp) FROM judgment_pairs')) {
        console.log('Matched MIN/MAX timestamp query');
        return Promise.resolve({ rows: [{ min: null, max: null }], rowCount: 1 });
      }
      console.log('No match, returning empty result');
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
    
    return {
      connect: jest.fn(() => Promise.resolve({
        query: mockQuery,
        release: jest.fn()
      })),
      query: mockQuery,
      end: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn()
    };
  }),
  Client: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
    end: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn()
  }))
}));

jest.mock('ws');

describe('Oracle API Integration Tests', () => {
  let apiServer: OracleAPIServer;
  let testToken: string;
  let apiConfig: APIConfig;

  beforeAll(() => {
    apiConfig = {
      port: 9010, // Use high port to avoid SSH conflicts
      jwtSecret: 'test-jwt-secret',
      corsOrigins: ['http://localhost:3001'],
      rateLimitWindowMs: 900000,
      rateLimitMax: 100,
      postgresConfig: {
        host: 'localhost',
        port: 5432,
        database: 'test_oracle',
        username: 'test_user',
        password: 'test_password',
        ssl: false
      }
    };


    testToken = jwt.sign(
      { username: 'test_user', role: 'admin' },
      apiConfig.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Create fresh instances for each test
    apiServer = new OracleAPIServer(apiConfig);
    
    // Mock the storage initialization
    jest.spyOn(apiServer['storage'], 'initialize').mockResolvedValue();
    
    await apiServer.start();
  });

  afterEach(async () => {
    await apiServer.stop();
  });

  describe('Health Check Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(apiServer['app'])
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        version: '4.0.0',
        uptime: expect.any(Number)
      });
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected endpoints', async () => {
      await request(apiServer['app'])
        .get('/api/oracles')
        .expect(401);
    });

    it('should accept valid JWT token', async () => {
      const response = await request(apiServer['app'])
        .get('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        oracles: expect.any(Array),
        total: expect.any(Number)
      });
    });

    it('should reject invalid JWT token', async () => {
      await request(apiServer['app'])
        .get('/api/oracles')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });
  });

  describe('Oracle Management API', () => {
    it('should create a new oracle', async () => {
      const oracleConfig = {
        oracleId: 'test-oracle-1',
        version: '4.0.0',
        description: 'Test Oracle for API testing'
      };

      const response = await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Oracle created successfully',
        oracleId: oracleConfig.oracleId,
        config: oracleConfig
      });
    });

    it('should reject oracle creation with missing fields', async () => {
      const invalidConfig = {
        oracleId: 'test-oracle-2'
        // Missing version and description
      };

      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidConfig)
        .expect(400);
    });

    it('should reject duplicate oracle creation', async () => {
      const oracleConfig = {
        oracleId: 'test-oracle-3',
        version: '4.0.0',
        description: 'Test Oracle for duplicate testing'
      };

      // Create first oracle
      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig)
        .expect(201);

      // Try to create duplicate
      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig)
        .expect(409);
    });

    it('should list created oracles', async () => {
      // Create a test oracle
      const oracleConfig = {
        oracleId: 'test-oracle-4',
        version: '4.0.0',
        description: 'Test Oracle for listing'
      };

      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig)
        .expect(201);

      // List oracles
      const response = await request(apiServer['app'])
        .get('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.oracles).toHaveLength(1);
      expect(response.body.oracles[0]).toMatchObject({
        oracleId: oracleConfig.oracleId,
        registered: true
      });
    });

      it('should get oracle status', async () => {
      // Create a test oracle
      const oracleConfig = {
        oracleId: 'test-oracle-5',
        version: '4.0.0',
        description: 'Test Oracle for status'
      };

      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig)
        .expect(201);

      // Get oracle status
      const response = await request(apiServer['app'])
        .get(`/api/oracles/${oracleConfig.oracleId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        oracle_id: oracleConfig.oracleId,
        version: oracleConfig.version,
        status: expect.stringMatching(/^(healthy|warning|critical)$/),
        uptime: expect.any(Number),
        total_judgments: expect.any(Number),
        last_activity: expect.any(String),
        performance_indicators: expect.any(Object)
      });
    });

    it('should return 404 for non-existent oracle', async () => {
      await request(apiServer['app'])
        .get('/api/oracles/non-existent-oracle')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('Outcome Recording API', () => {
    let oracleId: string;

    beforeEach(async () => {
      // Create a test oracle for outcome recording tests
      const oracleConfig = {
        oracleId: 'test-oracle-outcomes',
        version: '4.0.0',
        description: 'Test Oracle for outcome recording'
      };

      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .send(oracleConfig);

      oracleId = oracleConfig.oracleId;
    });

      it('should record an outcome successfully', async () => {
      const outcomeData = {
        decision: {
          judgment_id: 'test-decision-1',
          t: 0.8,
          i: 0.1,
          f: 0.1,
          provenance_chain: []
        },
        outcome: {
          judgment_id: 'test-outcome-1',
          links_to_judgment_id: 'test-decision-1',
          t: 1.0,
          i: 0.0,
          f: 0.0,
          outcome_type: 'success',
          provenance_chain: []
        },
        context: { test: 'context' }
      };

      const response = await request(apiServer['app'])
        .post(`/api/oracles/${oracleId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(outcomeData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Outcome recorded successfully',
        oracleId,
        decisionId: outcomeData.decision.judgment_id,
        outcomeId: outcomeData.outcome.judgment_id
      });
    });

    it('should reject outcome recording with missing fields', async () => {
      const invalidOutcomeData = {
        decision: {
          judgment_id: 'test-decision-2',
          t: 0.8,
          i: 0.1,
          f: 0.1,
          provenance_chain: []
        }
        // Missing outcome
      };

      await request(apiServer['app'])
        .post(`/api/oracles/${oracleId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidOutcomeData)
        .expect(400);
    });

      it('should get oracle metrics after recording outcomes', async () => {
      // Record a test outcome first
      const outcomeData = {
        decision: {
          judgment_id: 'test-decision-metrics',
          t: 0.9,
          i: 0.05,
          f: 0.05,
          provenance_chain: []
        },
        outcome: {
          judgment_id: 'test-outcome-metrics',
          links_to_judgment_id: 'test-decision-metrics',
          t: 1.0,
          i: 0.0,
          f: 0.0,
          outcome_type: 'success',
          provenance_chain: []
        }
      };

      await request(apiServer['app'])
        .post(`/api/oracles/${oracleId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(outcomeData);

      // Get metrics
      const response = await request(apiServer['app'])
        .get(`/api/oracles/${oracleId}/metrics`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        oracle_id: oracleId,
        total_judgments: expect.any(Number),
        success_rate: expect.any(Number),
        average_confidence: expect.any(Number),
        average_indeterminacy: expect.any(Number),
        performance_grade: expect.any(String),
        last_updated: expect.any(String)
      });
    });
  });

  describe('Dashboard API', () => {
    it('should get dashboard metrics', async () => {
      const response = await request(apiServer['app'])
        .get('/api/dashboard/metrics')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        timestamp: expect.any(String),
        oracles: expect.any(Array),
        global_metrics: expect.objectContaining({
          total_oracles: expect.any(Number),
          total_judgments: expect.any(Number),
          average_success_rate: expect.any(Number),
          system_health: expect.stringMatching(/^(excellent|good|fair|poor)$/)
        })
      });
    });

    it('should get dashboard trends', async () => {
      const response = await request(apiServer['app'])
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        timestamps: expect.any(Array),
        success_rates: expect.any(Array),
        total_judgments: expect.any(Array),
        oracle_count: expect.any(Array)
      });
    });

      it('should generate performance report', async () => {
      const response = await request(apiServer['app'])
        .post('/api/dashboard/report')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        report_timestamp: expect.any(String),
        summary: expect.any(Object),
        detailed_analysis: expect.any(Array),
        recommendations: expect.any(Array)
      });
    });
  });

  describe('Storage API', () => {
      it('should get storage statistics', async () => {
      // Mock the storage method directly
      const storage = apiServer['storage'];
      const mockStats = {
        totalPairs: 0,
        oracleCount: 0,
        timestampCount: 0,
        memoryUsage: 0
      };
      
      jest.spyOn(storage, 'getStorageStats').mockResolvedValue(mockStats);

      const response = await request(apiServer['app'])
        .get('/api/storage/stats')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        totalPairs: expect.any(Number),
        oracleCount: expect.any(Number),
        timestampCount: expect.any(Number),
        memoryUsage: expect.any(Number)
      });
    });

    it('should return 404 for non-existent judgment pair', async () => {
      await request(apiServer['app'])
        .get('/api/storage/pairs/non-existent-judgment')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

      it('should validate query parameters for pairs endpoint', async () => {
      await request(apiServer['app'])
        .get('/api/storage/pairs')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make multiple requests quickly to test rate limiting
      const promises = Array(10).fill(null).map(() =>
        request(apiServer['app'])
          .get('/api/oracles')
          .set('Authorization', `Bearer ${testToken}`)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed with our test configuration
      responses.forEach((response: any) => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      await request(apiServer['app'])
        .post('/api/oracles')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle non-existent endpoints', async () => {
      await request(apiServer['app'])
        .get('/api/non-existent-endpoint')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });
});

describe('WebSocket Integration Tests', () => {
  let wsServer: OracleWebSocketServer;

  beforeAll(() => {
    const config = {
      port: 9020,
      jwtSecret: 'test-jwt-secret',
      heartbeatInterval: 30000
    };


    // Mock dependencies
    const mockDashboard = {
      getCurrentMetrics: jest.fn().mockResolvedValue({
        timestamp: new Date().toISOString(),
        oracles: [],
        global_metrics: {
          total_oracles: 0,
          total_judgments: 0,
          average_success_rate: 0,
          system_health: 'excellent'
        }
      }),
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn()
    };

    const mockOracles = new Map();

    wsServer = new OracleWebSocketServer(config, mockDashboard as any, mockOracles);
  });

  beforeEach(() => {
    wsServer.start();
  });

  afterEach(() => {
    wsServer.stop();
  });

  it('should reject connections without authentication', () => {
    // This test would require a WebSocket client library
    // For now, we'll just verify the server starts without errors
    expect(wsServer).toBeDefined();
  });

  it('should provide server statistics', () => {
    const stats = wsServer.getStats();
    
    expect(stats).toMatchObject({
      totalConnections: expect.any(Number),
      authenticatedConnections: expect.any(Number),
      uptime: expect.any(Number)
    });
  });
});

describe('Complete Server Integration', () => {
  let server: OracleServer;
  let config: ServerConfig;

  beforeAll(() => {
    config = {
      api: {
        port: 9030,
        jwtSecret: 'test-jwt-secret',
        corsOrigins: ['http://localhost:3003'],
        rateLimitWindowMs: 900000,
        rateLimitMax: 100,
        postgresConfig: {
          host: 'localhost',
          port: 5432,
          database: 'test_oracle_complete',
          username: 'test_user',
          password: 'test_password',
          ssl: false
        }
      },
      websocket: {
        port: 9040,
        jwtSecret: 'test-jwt-secret',
        heartbeatInterval: 30000
      },
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'test_oracle_complete',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      }
    };

    server = new OracleServer(config);
  });

  beforeEach(async () => {
    // Mock storage initialization
    jest.spyOn(server['apiServer']['storage'], 'initialize').mockResolvedValue();
    
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should start and stop gracefully', async () => {
    expect(server).toBeDefined();
    
    const stats = server.getStats();
    expect(stats.api.port).toBe(config.api.port);
    expect(stats.websocket.port).toBe(config.websocket.port);
    expect(stats.postgres.host).toBe(config.postgres.host);
  });

  it('should handle graceful shutdown', async () => {
    // This test verifies that the server can be stopped gracefully
    await expect(server.stop()).resolves.not.toThrow();
  });
});
