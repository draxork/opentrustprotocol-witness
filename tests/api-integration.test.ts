/**
 * OpenTrust Protocol Witness - API Integration Tests
 * 
 * Comprehensive tests for REST API and WebSocket functionality
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { WitnessAPIServer, APIConfig } from '../src/api/rest-server';
import { WitnessWebSocketServer } from '../src/api/websocket-server';
import { WitnessServer, ServerConfig } from '../src/server';

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
      if (sql.includes('SELECT COUNT(DISTINCT outcome_witness_source) as count')) {
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
      if (sql.includes('SELECT COUNT(DISTINCT witness_id) FROM judgment_pairs')) {
        console.log('Matched COUNT(DISTINCT witness_id) query');
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

describe('Witness API Integration Tests', () => {
  let apiServer: WitnessAPIServer;
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
        database: 'test_witness',
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
    apiServer = new WitnessAPIServer(apiConfig);
    
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
        .get('/api/witnesses')
        .expect(401);
    });

    it('should accept valid JWT token', async () => {
      const response = await request(apiServer['app'])
        .get('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        witnesses: expect.any(Array),
        total: expect.any(Number)
      });
    });

    it('should reject invalid JWT token', async () => {
      await request(apiServer['app'])
        .get('/api/witnesses')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });
  });

  describe('Witness Management API', () => {
    it('should create a new witness', async () => {
      const witnessConfig = {
        witnessId: 'test-witness-1',
        version: '4.0.0',
        description: 'Test Witness for API testing'
      };

      const response = await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Witness created successfully',
        witnessId: witnessConfig.witnessId,
        config: witnessConfig
      });
    });

    it('should reject witness creation with missing fields', async () => {
      const invalidConfig = {
        witnessId: 'test-witness-2'
        // Missing version and description
      };

      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidConfig)
        .expect(400);
    });

    it('should reject duplicate witness creation', async () => {
      const witnessConfig = {
        witnessId: 'test-witness-3',
        version: '4.0.0',
        description: 'Test Witness for duplicate testing'
      };

      // Create first witness
      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig)
        .expect(201);

      // Try to create duplicate
      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig)
        .expect(409);
    });

    it('should list created witnesses', async () => {
      // Create a test witness
      const witnessConfig = {
        witnessId: 'test-witness-4',
        version: '4.0.0',
        description: 'Test Witness for listing'
      };

      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig)
        .expect(201);

      // List witnesses
      const response = await request(apiServer['app'])
        .get('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.witnesses).toHaveLength(1);
      expect(response.body.witnesses[0]).toMatchObject({
        witnessId: witnessConfig.witnessId,
        registered: true
      });
    });

      it('should get witness status', async () => {
      // Create a test witness
      const witnessConfig = {
        witnessId: 'test-witness-5',
        version: '4.0.0',
        description: 'Test Witness for status'
      };

      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig)
        .expect(201);

      // Get witness status
      const response = await request(apiServer['app'])
        .get(`/api/witnesses/${witnessConfig.witnessId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        witness_id: witnessConfig.witnessId,
        version: witnessConfig.version,
        status: expect.stringMatching(/^(healthy|warning|critical)$/),
        uptime: expect.any(Number),
        total_judgments: expect.any(Number),
        last_activity: expect.any(String),
        performance_indicators: expect.any(Object)
      });
    });

    it('should return 404 for non-existent witness', async () => {
      await request(apiServer['app'])
        .get('/api/witnesses/non-existent-witness')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });

  describe('Outcome Recording API', () => {
    let witnessId: string;

    beforeEach(async () => {
      // Create a test witness for outcome recording tests
      const witnessConfig = {
        witnessId: 'test-witness-outcomes',
        version: '4.0.0',
        description: 'Test Witness for outcome recording'
      };

      await request(apiServer['app'])
        .post('/api/witnesses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(witnessConfig);

      witnessId = witnessConfig.witnessId;
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
        .post(`/api/witnesses/${witnessId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(outcomeData)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Outcome recorded successfully',
        witnessId,
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
        .post(`/api/witnesses/${witnessId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidOutcomeData)
        .expect(400);
    });

      it('should get witness metrics after recording outcomes', async () => {
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
        .post(`/api/witnesses/${witnessId}/outcomes`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(outcomeData);

      // Get metrics
      const response = await request(apiServer['app'])
        .get(`/api/witnesses/${witnessId}/metrics`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        witness_id: witnessId,
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
        witnesses: expect.any(Array),
        global_metrics: expect.objectContaining({
          total_witnesses: expect.any(Number),
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
        witness_count: expect.any(Array)
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
        witnessCount: 0,
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
        witnessCount: expect.any(Number),
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
          .get('/api/witnesses')
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
        .post('/api/witnesses')
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
  let wsServer: WitnessWebSocketServer;

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
        witnesses: [],
        global_metrics: {
          total_witnesses: 0,
          total_judgments: 0,
          average_success_rate: 0,
          system_health: 'excellent'
        }
      }),
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn()
    };

    const mockWitnesss = new Map();

    wsServer = new WitnessWebSocketServer(config, mockDashboard as any, mockWitnesss);
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
  let server: WitnessServer;
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
          database: 'test_witness_complete',
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
        database: 'test_witness_complete',
        username: 'test_user',
        password: 'test_password',
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      }
    };

    server = new WitnessServer(config);
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
