/**
 * OpenTrust Protocol Oracle - Simplified Tests
 * 
 * Basic tests for the simplified Oracle system.
 */

import { SimpleOracle, createTradingOracle, createMedicalOracle } from '../src/simple-oracle';

// Mock the opentrustprotocol dependency
jest.mock('opentrustprotocol', () => ({
  NeutrosophicJudgment: class {
    constructor(
      public t: number,
      public i: number,
      public f: number,
      public provenance_chain: any[],
      public judgment_id?: string
    ) {}
  },
  OutcomeJudgment: class {
    constructor(
      public judgment_id: string,
      public links_to_judgment_id: string,
      public t: number,
      public i: number,
      public f: number,
      public outcome_type: string,
      public oracle_source: string,
      public provenance_chain: any[],
      public metadata?: any
    ) {}
  },
  OutcomeType: {
    SUCCESS: 'success',
    FAILURE: 'failure',
    PARTIAL: 'partial'
  },
  generateJudgmentId: jest.fn(() => `judgment_${Math.random().toString(36).substr(2, 9)}`),
  ensureJudgmentId: jest.fn((judgment: any) => ({
    ...judgment,
    judgment_id: judgment.judgment_id || `judgment_${Math.random().toString(36).substr(2, 9)}`
  }))
}));

describe('Simple Oracle System Tests', () => {
  describe('SimpleOracle', () => {
    it('should create oracle successfully', () => {
      const oracle = new SimpleOracle('test-oracle');
      expect(oracle).toBeDefined();
      expect(oracle.oracleId).toBe('test-oracle');
    });

    it('should record outcome successfully', async () => {
      const oracle = new SimpleOracle('test-oracle');
      
      const outcome = {
        type: 'test',
        result: 'success',
        confidence: 0.8
      };

      await expect(oracle.recordOutcome('test-judgment-id', outcome)).resolves.not.toThrow();
    });

    it('should get statistics', async () => {
      const oracle = new SimpleOracle('test-oracle');
      
      const outcome = {
        type: 'test',
        result: 'success',
        confidence: 0.8
      };

      await oracle.recordOutcome('test-judgment-id', outcome);
      
      const stats = oracle.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.oracleId).toBe('test-oracle');
      expect(stats.totalOutcomes).toBe(1);
    });

    it('should retrieve recorded outcome', async () => {
      const oracle = new SimpleOracle('test-oracle');
      
      const outcome = {
        type: 'test',
        result: 'success',
        confidence: 0.8
      };

      await oracle.recordOutcome('test-judgment-id', outcome);
      
      const retrieved = await oracle.getOutcome('test-judgment-id');
      expect(retrieved).toBeDefined();
      expect(retrieved.type).toBe('test');
      expect(retrieved.result).toBe('success');
    });
  });

  describe('TradingOracle', () => {
    it('should create trading oracle successfully', () => {
      const oracle = createTradingOracle('trading-oracle');
      expect(oracle).toBeDefined();
      expect(oracle.oracleId).toBe('trading-oracle');
    });

    it('should record trade successfully', async () => {
      const oracle = createTradingOracle('trading-oracle');
      
      await expect(oracle.recordTrade('trade-1', 'BTC/USDT', 500)).resolves.not.toThrow();
      
      const outcome = await oracle.getOutcome('trade-1');
      expect(outcome).toBeDefined();
      expect(outcome.pair).toBe('BTC/USDT');
      expect(outcome.profit).toBe(500);
      expect(outcome.success).toBe(true);
    });
  });

  describe('MedicalOracle', () => {
    it('should create medical oracle successfully', () => {
      const oracle = createMedicalOracle('medical-oracle');
      expect(oracle).toBeDefined();
      expect(oracle.oracleId).toBe('medical-oracle');
    });

    it('should record treatment successfully', async () => {
      const oracle = createMedicalOracle('medical-oracle');
      
      await expect(oracle.recordTreatment('treatment-1', 'hypertension', true)).resolves.not.toThrow();
      
      const outcome = await oracle.getOutcome('treatment-1');
      expect(outcome).toBeDefined();
      expect(outcome.condition).toBe('hypertension');
      expect(outcome.success).toBe(true);
      expect(outcome.recoveryTime).toBe(14);
    });
  });
});