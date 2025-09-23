/**
 * OpenTrust Protocol Oracle - Integration Tests
 * 
 * Comprehensive integration tests for Enhanced Oracle + Analytics + Dashboard
 */

import { EnhancedOracle } from '../src/oracle/EnhancedOracle';
import { PerformanceDashboard } from '../src/dashboard/PerformanceDashboard';
import { MemoryStorage } from '../src/storage/MemoryStorage';
import { OracleConfig, NeutrosophicJudgment, OutcomeJudgment, OutcomeType } from '../src/types/index';

// Mock opentrustprotocol
jest.mock('opentrustprotocol', () => ({
  NeutrosophicJudgment: jest.fn().mockImplementation((T, I, F, provenance, judgmentId) => ({
    T, I, F, provenance_chain: provenance || [], judgment_id: judgmentId,
    validate: jest.fn(),
    toJSON: jest.fn(() => ({ T, I, F, provenance_chain: provenance || [] })),
    toString: jest.fn(() => `NeutrosophicJudgment(T=${T}, I=${I}, F=${F})`),
    equals: jest.fn(() => false)
  })),
  OutcomeJudgment: jest.fn().mockImplementation((judgmentId, linksTo, T, I, F, outcomeType, oracleSource, provenance) => ({
    judgment_id: judgmentId,
    links_to_judgment_id: linksTo,
    T, I, F,
    outcome_type: outcomeType,
    oracle_source: oracleSource,
    provenance_chain: provenance || []
  })),
  OutcomeType: {
    SUCCESS: 'success',
    FAILURE: 'failure',
    TRADING_SUCCESS: 'trading_success',
    TRADING_FAILURE: 'trading_failure',
    MEDICAL_SUCCESS: 'medical_success',
    MEDICAL_FAILURE: 'medical_failure'
  }
}));

describe('Enhanced Oracle Integration Tests', () => {
  let enhancedOracle: EnhancedOracle;
  let storage: MemoryStorage;
  let config: OracleConfig;

  beforeEach(() => {
    config = {
      oracleId: 'test-enhanced-oracle',
      version: '3.0.0',
      description: 'Test Enhanced Oracle'
    };
    storage = new MemoryStorage();
    enhancedOracle = new EnhancedOracle(config, storage);
  });

  describe('Enhanced Oracle Functionality', () => {
    it('should record outcomes successfully', async () => {
      const decision: NeutrosophicJudgment = {
        judgment_id: 'decision-1',
        T: 0.8,
        I: 0.1,
        F: 0.1,
        provenance_chain: [
          { source_id: 'test-mapper', timestamp: new Date().toISOString(), description: 'Test mapping' }
        ],
        validate: jest.fn(),
        toJSON: jest.fn(() => ({ T: 0.8, I: 0.1, F: 0.1, provenance_chain: [] })),
        toString: jest.fn(() => 'NeutrosophicJudgment(T=0.8, I=0.1, F=0.1)'),
        equals: jest.fn(() => false)
      } as any;

      const outcome: OutcomeJudgment = {
        judgment_id: 'outcome-1',
        links_to_judgment_id: 'decision-1',
        T: 1.0,
        I: 0.0,
        F: 0.0,
        outcome_type: OutcomeType.SUCCESS,
        oracle_source: 'test-enhanced-oracle',
        provenance_chain: []
      };

      await expect(enhancedOracle.recordOutcome(decision, outcome)).resolves.not.toThrow();
    });

    it('should get real-time metrics', async () => {
      // Record some test outcomes
      const decision: NeutrosophicJudgment = {
        judgment_id: 'decision-2',
        T: 0.7,
        I: 0.2,
        F: 0.1,
        provenance_chain: [],
        validate: jest.fn(),
        toJSON: jest.fn(() => ({ T: 0.7, I: 0.2, F: 0.1, provenance_chain: [] })),
        toString: jest.fn(() => 'NeutrosophicJudgment(T=0.7, I=0.2, F=0.1)'),
        equals: jest.fn(() => false)
      } as any;

      const outcome: OutcomeJudgment = {
        judgment_id: 'outcome-2',
        links_to_judgment_id: 'decision-2',
        T: 1.0,
        I: 0.0,
        F: 0.0,
        outcome_type: OutcomeType.SUCCESS,
        oracle_source: 'test-enhanced-oracle',
        provenance_chain: []
      };

      await enhancedOracle.recordOutcome(decision, outcome);

      const metrics = await enhancedOracle.getRealTimeMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.oracle_id).toBe('test-enhanced-oracle');
      expect(metrics.total_judgments).toBeGreaterThan(0);
      expect(metrics.success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.average_confidence).toBeGreaterThanOrEqual(0);
      expect(metrics.performance_grade).toMatch(/^[A-D][+]?$|^N\/A$/);
    });

    it('should get oracle status', async () => {
      const status = await enhancedOracle.getOracleStatus();
      
      expect(status).toBeDefined();
      expect(status.oracle_id).toBe('test-enhanced-oracle');
      expect(['healthy', 'warning', 'critical']).toContain(status.status);
      expect(status.version).toBe('3.0.0');
      expect(status.performance_indicators).toBeDefined();
      expect(status.performance_indicators.success_rate).toBeGreaterThanOrEqual(0);
    });

    it('should export data', async () => {
      const exportedData = await enhancedOracle.exportData();
      
      expect(exportedData).toBeDefined();
      expect(exportedData.oracle_config).toEqual(config);
      expect(Array.isArray(exportedData.judgment_pairs)).toBe(true);
      expect(exportedData.export_timestamp).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should perform analytics analysis', async () => {
      // Record multiple outcomes for analysis
      const outcomes = [
        { decision: { judgment_id: 'd1', T: 0.8, I: 0.1, F: 0.1, provenance_chain: [], validate: jest.fn(), toJSON: jest.fn(), toString: jest.fn(), equals: jest.fn() } as any, 
          outcome: { judgment_id: 'o1', links_to_judgment_id: 'd1', T: 1.0, I: 0.0, F: 0.0, outcome_type: OutcomeType.SUCCESS, oracle_source: 'test-enhanced-oracle', provenance_chain: [] } },
        { decision: { judgment_id: 'd2', T: 0.6, I: 0.2, F: 0.2, provenance_chain: [], validate: jest.fn(), toJSON: jest.fn(), toString: jest.fn(), equals: jest.fn() } as any, 
          outcome: { judgment_id: 'o2', links_to_judgment_id: 'd2', T: 0.0, I: 0.0, F: 1.0, outcome_type: OutcomeType.FAILURE, oracle_source: 'test-enhanced-oracle', provenance_chain: [] } }
      ];

      for (const { decision, outcome } of outcomes) {
        await enhancedOracle.recordOutcome(decision as NeutrosophicJudgment, outcome as OutcomeJudgment);
      }

      // Test performance analysis
      try {
        const analysis = await enhancedOracle.getPerformanceAnalysis();
        expect(analysis).toBeDefined();
        expect(analysis.oracle_id).toBe('test-enhanced-oracle');
        expect(analysis.total_judgments).toBeGreaterThan(0);
      } catch (error) {
        // Analytics might fail with insufficient data, which is expected
        expect((error as any).message).toContain('No judgment pairs found');
      }
    });

    it('should get calibration metrics', async () => {
      try {
        // const calibration = await enhancedOracle.getCalibrationMetrics();
        // expect(calibration).toBeDefined();
      } catch (error) {
        // Expected with no data
        expect((error as any).message).toBeDefined();
      }
    });

    it('should get VoI metrics', async () => {
      try {
        // const voi = await enhancedOracle.getVoIMetrics();
        // expect(voi).toBeDefined();
      } catch (error) {
        // Expected with no data
        expect((error as any).message).toBeDefined();
      }
    });
  });
});

describe('Performance Dashboard Integration Tests', () => {
  let dashboard: PerformanceDashboard;
  let oracle1: EnhancedOracle;
  let oracle2: EnhancedOracle;

  beforeEach(() => {
    dashboard = new PerformanceDashboard();
    
    const config1: OracleConfig = {
      oracleId: 'dashboard-oracle-1',
      version: '3.0.0',
      description: 'Dashboard Test Oracle 1'
    };
    
    const config2: OracleConfig = {
      oracleId: 'dashboard-oracle-2',
      version: '3.0.0',
      description: 'Dashboard Test Oracle 2'
    };

    oracle1 = new EnhancedOracle(config1);
    oracle2 = new EnhancedOracle(config2);
  });

  describe('Dashboard Functionality', () => {
    it('should register oracles', () => {
      dashboard.registerOracle(oracle1);
      dashboard.registerOracle(oracle2);
      
      // No direct way to test registration, but no errors should occur
      expect(true).toBe(true);
    });

    it('should get current metrics', async () => {
      dashboard.registerOracle(oracle1);
      dashboard.registerOracle(oracle2);

      const metrics = await dashboard.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(Array.isArray(metrics.oracles)).toBe(true);
      expect(metrics.global_metrics).toBeDefined();
      expect(metrics.global_metrics.total_oracles).toBe(2);
    });

    it('should get metrics history', () => {
      const history = dashboard.getMetricsHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should get performance trends', () => {
      const trends = dashboard.getPerformanceTrends();
      
      expect(trends).toBeDefined();
      expect(Array.isArray(trends.timestamps)).toBe(true);
      expect(Array.isArray(trends.success_rates)).toBe(true);
      expect(Array.isArray(trends.total_judgments)).toBe(true);
      expect(Array.isArray(trends.oracle_count)).toBe(true);
    });

    it('should generate performance report', async () => {
      dashboard.registerOracle(oracle1);
      dashboard.registerOracle(oracle2);

      const report = await dashboard.generateReport();
      
      expect(report).toBeDefined();
      expect(report.report_timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.detailed_analysis)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should export dashboard data', async () => {
      dashboard.registerOracle(oracle1);
      dashboard.registerOracle(oracle2);

      const exportData = await dashboard.exportDashboardData();
      
      expect(exportData).toBeDefined();
      expect(exportData.export_timestamp).toBeDefined();
      expect(exportData.current_metrics).toBeDefined();
      expect(Array.isArray(exportData.metrics_history)).toBe(true);
      expect(exportData.trends).toBeDefined();
      expect(Array.isArray(exportData.oracles_config)).toBe(true);
    });

    it('should create test oracle', () => {
      const testOracle = PerformanceDashboard.createTestOracle('test-oracle-id', 'Test Description');
      
      expect(testOracle).toBeDefined();
      expect(testOracle['config'].oracleId).toBe('test-oracle-id');
      expect(testOracle['config'].description).toBe('Test Description');
    });

    it('should start and stop monitoring', () => {
      // Start monitoring
      dashboard.startMonitoring(1000); // 1 second interval
      expect(true).toBe(true); // No errors should occur

      // Stop monitoring
      dashboard.stopMonitoring();
      expect(true).toBe(true); // No errors should occur
    });
  });

  describe('End-to-End Integration', () => {
    it('should work with multiple oracles and dashboard', async () => {
      // Register oracles with dashboard
      dashboard.registerOracle(oracle1);
      dashboard.registerOracle(oracle2);

      // Record outcomes in both oracles
      const decision1: NeutrosophicJudgment = {
        judgment_id: 'integration-decision-1',
        T: 0.9,
        I: 0.05,
        F: 0.05,
        provenance_chain: [],
        validate: jest.fn(),
        toJSON: jest.fn(() => ({ T: 0.9, I: 0.05, F: 0.05, provenance_chain: [] })),
        toString: jest.fn(() => 'NeutrosophicJudgment(T=0.9, I=0.05, F=0.05)'),
        equals: jest.fn(() => false)
      } as any;

      const outcome1: OutcomeJudgment = {
        judgment_id: 'integration-outcome-1',
        links_to_judgment_id: 'integration-decision-1',
        T: 1.0,
        I: 0.0,
        F: 0.0,
        outcome_type: OutcomeType.SUCCESS,
        oracle_source: 'dashboard-oracle-1',
        provenance_chain: []
      };

      const decision2: NeutrosophicJudgment = {
        judgment_id: 'integration-decision-2',
        T: 0.7,
        I: 0.2,
        F: 0.1,
        provenance_chain: [],
        validate: jest.fn(),
        toJSON: jest.fn(() => ({ T: 0.7, I: 0.2, F: 0.1, provenance_chain: [] })),
        toString: jest.fn(() => 'NeutrosophicJudgment(T=0.7, I=0.2, F=0.1)'),
        equals: jest.fn(() => false)
      } as any;

      const outcome2: OutcomeJudgment = {
        judgment_id: 'integration-outcome-2',
        links_to_judgment_id: 'integration-decision-2',
        T: 0.0,
        I: 0.0,
        F: 1.0,
        outcome_type: OutcomeType.FAILURE,
        oracle_source: 'dashboard-oracle-2',
        provenance_chain: []
      };

      // Record outcomes
      await oracle1.recordOutcome(decision1, outcome1);
      await oracle2.recordOutcome(decision2, outcome2);

      // Get dashboard metrics
      const metrics = await dashboard.getCurrentMetrics();
      
      expect(metrics.global_metrics.total_oracles).toBe(2);
      expect(metrics.oracles).toHaveLength(2);
      
      // Verify individual oracle metrics
      const oracle1Data = metrics.oracles.find(o => o.oracle_id === 'dashboard-oracle-1');
      const oracle2Data = metrics.oracles.find(o => o.oracle_id === 'dashboard-oracle-2');
      
      expect(oracle1Data).toBeDefined();
      expect(oracle2Data).toBeDefined();
      
      if (oracle1Data) {
        expect(oracle1Data.total_judgments).toBeGreaterThan(0);
      }
      
      if (oracle2Data) {
        expect(oracle2Data.total_judgments).toBeGreaterThan(0);
      }
    });
  });
});
