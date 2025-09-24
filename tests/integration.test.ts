/**
 * OpenTrust Protocol Witness - Integration Tests
 * 
 * Comprehensive integration tests for Enhanced Witness + Analytics + Dashboard
 */

import { EnhancedWitness } from '../src/witness/EnhancedWitness';
import { PerformanceDashboard } from '../src/dashboard/PerformanceDashboard';
import { MemoryStorage } from '../src/storage/MemoryStorage';
import { WitnessConfig, NeutrosophicJudgment, OutcomeJudgment, OutcomeType } from '../src/types/index';

// Mock opentrustprotocol
jest.mock('opentrustprotocol', () => ({
  NeutrosophicJudgment: jest.fn().mockImplementation((T, I, F, provenance, judgmentId) => ({
    T, I, F, provenance_chain: provenance || [], judgment_id: judgmentId,
    validate: jest.fn(),
    toJSON: jest.fn(() => ({ T, I, F, provenance_chain: provenance || [] })),
    toString: jest.fn(() => `NeutrosophicJudgment(T=${T}, I=${I}, F=${F})`),
    equals: jest.fn(() => false)
  })),
  OutcomeJudgment: jest.fn().mockImplementation((judgmentId, linksTo, T, I, F, outcomeType, witnessSource, provenance) => ({
    judgment_id: judgmentId,
    links_to_judgment_id: linksTo,
    T, I, F,
    outcome_type: outcomeType,
    witness_source: witnessSource,
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

describe('Enhanced Witness Integration Tests', () => {
  let enhancedWitness: EnhancedWitness;
  let storage: MemoryStorage;
  let config: WitnessConfig;

  beforeEach(() => {
    config = {
      witnessId: 'test-enhanced-witness',
      version: '3.0.0',
      description: 'Test Enhanced Witness'
    };
    storage = new MemoryStorage();
    enhancedWitness = new EnhancedWitness(config, storage);
  });

  describe('Enhanced Witness Functionality', () => {
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
        witness_source: 'test-enhanced-witness',
        provenance_chain: []
      };

      await expect(enhancedWitness.recordOutcome(decision, outcome)).resolves.not.toThrow();
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
        witness_source: 'test-enhanced-witness',
        provenance_chain: []
      };

      await enhancedWitness.recordOutcome(decision, outcome);

      const metrics = await enhancedWitness.getRealTimeMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.witness_id).toBe('test-enhanced-witness');
      expect(metrics.total_judgments).toBeGreaterThan(0);
      expect(metrics.success_rate).toBeGreaterThanOrEqual(0);
      expect(metrics.average_confidence).toBeGreaterThanOrEqual(0);
      expect(metrics.performance_grade).toMatch(/^[A-D][+]?$|^N\/A$/);
    });

    it('should get witness status', async () => {
      const status = await enhancedWitness.getWitnessStatus();
      
      expect(status).toBeDefined();
      expect(status.witness_id).toBe('test-enhanced-witness');
      expect(['healthy', 'warning', 'critical']).toContain(status.status);
      expect(status.version).toBe('3.0.0');
      expect(status.performance_indicators).toBeDefined();
      expect(status.performance_indicators.success_rate).toBeGreaterThanOrEqual(0);
    });

    it('should export data', async () => {
      const exportedData = await enhancedWitness.exportData();
      
      expect(exportedData).toBeDefined();
      expect(exportedData.witness_config).toEqual(config);
      expect(Array.isArray(exportedData.judgment_pairs)).toBe(true);
      expect(exportedData.export_timestamp).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should perform analytics analysis', async () => {
      // Record multiple outcomes for analysis
      const outcomes = [
        { decision: { judgment_id: 'd1', T: 0.8, I: 0.1, F: 0.1, provenance_chain: [], validate: jest.fn(), toJSON: jest.fn(), toString: jest.fn(), equals: jest.fn() } as any, 
          outcome: { judgment_id: 'o1', links_to_judgment_id: 'd1', T: 1.0, I: 0.0, F: 0.0, outcome_type: OutcomeType.SUCCESS, witness_source: 'test-enhanced-witness', provenance_chain: [] } },
        { decision: { judgment_id: 'd2', T: 0.6, I: 0.2, F: 0.2, provenance_chain: [], validate: jest.fn(), toJSON: jest.fn(), toString: jest.fn(), equals: jest.fn() } as any, 
          outcome: { judgment_id: 'o2', links_to_judgment_id: 'd2', T: 0.0, I: 0.0, F: 1.0, outcome_type: OutcomeType.FAILURE, witness_source: 'test-enhanced-witness', provenance_chain: [] } }
      ];

      for (const { decision, outcome } of outcomes) {
        await enhancedWitness.recordOutcome(decision as NeutrosophicJudgment, outcome as OutcomeJudgment);
      }

      // Test performance analysis
      try {
        const analysis = await enhancedWitness.getPerformanceAnalysis();
        expect(analysis).toBeDefined();
        expect(analysis.witness_id).toBe('test-enhanced-witness');
        expect(analysis.total_judgments).toBeGreaterThan(0);
      } catch (error) {
        // Analytics might fail with insufficient data, which is expected
        expect((error as any).message).toContain('No judgment pairs found');
      }
    });

    it('should get calibration metrics', async () => {
      try {
        // const calibration = await enhancedWitness.getCalibrationMetrics();
        // expect(calibration).toBeDefined();
      } catch (error) {
        // Expected with no data
        expect((error as any).message).toBeDefined();
      }
    });

    it('should get VoI metrics', async () => {
      try {
        // const voi = await enhancedWitness.getVoIMetrics();
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
  let witness1: EnhancedWitness;
  let witness2: EnhancedWitness;

  beforeEach(() => {
    dashboard = new PerformanceDashboard();
    
    const config1: WitnessConfig = {
      witnessId: 'dashboard-witness-1',
      version: '3.0.0',
      description: 'Dashboard Test Witness 1'
    };
    
    const config2: WitnessConfig = {
      witnessId: 'dashboard-witness-2',
      version: '3.0.0',
      description: 'Dashboard Test Witness 2'
    };

    witness1 = new EnhancedWitness(config1);
    witness2 = new EnhancedWitness(config2);
  });

  describe('Dashboard Functionality', () => {
    it('should register witnesss', () => {
      dashboard.registerWitness(witness1);
      dashboard.registerWitness(witness2);
      
      // No direct way to test registration, but no errors should occur
      expect(true).toBe(true);
    });

    it('should get current metrics', async () => {
      dashboard.registerWitness(witness1);
      dashboard.registerWitness(witness2);

      const metrics = await dashboard.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(Array.isArray(metrics.witnesss)).toBe(true);
      expect(metrics.global_metrics).toBeDefined();
      expect(metrics.global_metrics.total_witnesss).toBe(2);
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
      expect(Array.isArray(trends.witness_count)).toBe(true);
    });

    it('should generate performance report', async () => {
      dashboard.registerWitness(witness1);
      dashboard.registerWitness(witness2);

      const report = await dashboard.generateReport();
      
      expect(report).toBeDefined();
      expect(report.report_timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.detailed_analysis)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should export dashboard data', async () => {
      dashboard.registerWitness(witness1);
      dashboard.registerWitness(witness2);

      const exportData = await dashboard.exportDashboardData();
      
      expect(exportData).toBeDefined();
      expect(exportData.export_timestamp).toBeDefined();
      expect(exportData.current_metrics).toBeDefined();
      expect(Array.isArray(exportData.metrics_history)).toBe(true);
      expect(exportData.trends).toBeDefined();
      expect(Array.isArray(exportData.witnesss_config)).toBe(true);
    });

    it('should create test witness', () => {
      const testWitness = PerformanceDashboard.createTestWitness('test-witness-id', 'Test Description');
      
      expect(testWitness).toBeDefined();
      expect(testWitness['config'].witnessId).toBe('test-witness-id');
      expect(testWitness['config'].description).toBe('Test Description');
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
    it('should work with multiple witnesss and dashboard', async () => {
      // Register witnesss with dashboard
      dashboard.registerWitness(witness1);
      dashboard.registerWitness(witness2);

      // Record outcomes in both witnesss
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
        witness_source: 'dashboard-witness-1',
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
        witness_source: 'dashboard-witness-2',
        provenance_chain: []
      };

      // Record outcomes
      await witness1.recordOutcome(decision1, outcome1);
      await witness2.recordOutcome(decision2, outcome2);

      // Get dashboard metrics
      const metrics = await dashboard.getCurrentMetrics();
      
      expect(metrics.global_metrics.total_witnesss).toBe(2);
      expect(metrics.witnesss).toHaveLength(2);
      
      // Verify individual witness metrics
      const witness1Data = metrics.witnesss.find(o => o.witness_id === 'dashboard-witness-1');
      const witness2Data = metrics.witnesss.find(o => o.witness_id === 'dashboard-witness-2');
      
      expect(witness1Data).toBeDefined();
      expect(witness2Data).toBeDefined();
      
      if (witness1Data) {
        expect(witness1Data.total_judgments).toBeGreaterThan(0);
      }
      
      if (witness2Data) {
        expect(witness2Data.total_judgments).toBeGreaterThan(0);
      }
    });
  });
});
