/**
 * OpenTrust Protocol Oracle - Analytics Engine Tests
 * 
 * Tests for the OTPAnalyticsEngine functionality.
 */

import { OTPAnalyticsEngine } from '../src/analytics/OTPAnalyticsEngine';
// import { MemoryStorage } from '../src/storage/MemoryStorage';
import { JudgmentPair, OutcomeType } from '../src/types/index';

describe('OTPAnalyticsEngine Tests', () => {
  let analyticsEngine: OTPAnalyticsEngine;

  beforeEach(() => {
    analyticsEngine = new OTPAnalyticsEngine();
  });

  describe('Performance Analysis', () => {
    it('should analyze performance successfully', async () => {
      const pairs: JudgmentPair[] = [
        {
          decision: {
            judgment_id: 'decision-1',
            judgment: { t: 0.8, i: 0.1, f: 0.1, provenance_chain: [] },
            timestamp: new Date().toISOString(),
            context: {},
            mapper_id: 'test-mapper'
          },
          outcome: {
            judgment_id: 'outcome-1',
            outcome_judgment: {
              t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
              links_to_judgment_id: 'decision-1',
              outcome_type: OutcomeType.SUCCESS
            },
            timestamp: new Date().toISOString(),
            oracle_source: 'test-oracle'
          }
        }
      ];

      const analysis = await analyticsEngine.analyzePerformance('test-oracle', pairs);
      
      expect(analysis).toBeDefined();
      expect(analysis.oracle_id).toBe('test-oracle');
      expect(analysis.total_judgments).toBe(1);
      expect(analysis.success_rate).toBe(1.0);
      expect(analysis.performance_grade).toBe('A');
    });

    it('should handle empty oracle pairs', async () => {
      const pairs: JudgmentPair[] = [];
      
      await expect(analyticsEngine.analyzePerformance('nonexistent-oracle', pairs))
        .rejects.toThrow('No judgment pairs found for oracle: nonexistent-oracle');
    });
  });

  describe('Calibration Analysis', () => {
    it('should calculate calibration metrics', async () => {
      const pairs: JudgmentPair[] = [
        {
          decision: {
            judgment_id: 'decision-1',
            judgment: { t: 0.8, i: 0.1, f: 0.1, provenance_chain: [] },
            timestamp: new Date().toISOString(),
            context: {},
            mapper_id: 'test-mapper'
          },
          outcome: {
            judgment_id: 'outcome-1',
            outcome_judgment: {
              t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
              links_to_judgment_id: 'decision-1',
              outcome_type: OutcomeType.SUCCESS
            },
            timestamp: new Date().toISOString(),
            oracle_source: 'test-oracle'
          }
        }
      ];

      const calibration = await analyticsEngine.calculateCalibration(pairs);
      
      expect(calibration).toBeDefined();
      expect(calibration.sample_size).toBe(1);
      expect(calibration.overall_calibration_score).toBeGreaterThanOrEqual(0);
      expect(calibration.overall_calibration_score).toBeLessThanOrEqual(1);
    });
  });

  describe('Value of Indeterminacy (VoI)', () => {
    it('should calculate VoI metrics', async () => {
      const pairs: JudgmentPair[] = [
        {
          decision: {
            judgment_id: 'decision-1',
            judgment: { t: 0.8, i: 0.2, f: 0.0, provenance_chain: [] },
            timestamp: new Date().toISOString(),
            context: {},
            mapper_id: 'test-mapper'
          },
          outcome: {
            judgment_id: 'outcome-1',
            outcome_judgment: {
              t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
              links_to_judgment_id: 'decision-1',
              outcome_type: OutcomeType.SUCCESS
            },
            timestamp: new Date().toISOString(),
            oracle_source: 'test-oracle'
          }
        }
      ];

      const voi = await analyticsEngine.calculateVoI(pairs);
      
      expect(voi).toBeDefined();
      expect(voi.average_voi_contribution).toBeGreaterThanOrEqual(0);
      expect(voi.optimal_indeterminacy_range).toBeDefined();
      expect(voi.optimal_indeterminacy_range.min).toBeGreaterThanOrEqual(0);
      expect(voi.optimal_indeterminacy_range.max).toBeLessThanOrEqual(1);
    });
  });

  describe('Success Rate Calculation', () => {
    it('should calculate success rate correctly', () => {
      const pairs: JudgmentPair[] = [
        {
          decision: {
            judgment_id: 'decision-1',
            judgment: { t: 0.8, i: 0.1, f: 0.1, provenance_chain: [] },
            timestamp: new Date().toISOString(),
            context: {},
            mapper_id: 'test-mapper'
          },
          outcome: {
            judgment_id: 'outcome-1',
            outcome_judgment: {
              t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
              links_to_judgment_id: 'decision-1',
              outcome_type: OutcomeType.SUCCESS
            },
            timestamp: new Date().toISOString(),
            oracle_source: 'test-oracle'
          }
        },
        {
          decision: {
            judgment_id: 'decision-2',
            judgment: { t: 0.6, i: 0.2, f: 0.2, provenance_chain: [] },
            timestamp: new Date().toISOString(),
            context: {},
            mapper_id: 'test-mapper'
          },
          outcome: {
            judgment_id: 'outcome-2',
            outcome_judgment: {
              t: 0.0, i: 0.0, f: 1.0, provenance_chain: [],
              links_to_judgment_id: 'decision-2',
              outcome_type: OutcomeType.FAILURE
            },
            timestamp: new Date().toISOString(),
            oracle_source: 'test-oracle'
          }
        }
      ];

      const successRate = analyticsEngine.calculateSuccessRate(pairs);
      expect(successRate).toBe(0.5); // 1 success out of 2 total
    });

    it('should handle empty pairs array', () => {
      const successRate = analyticsEngine.calculateSuccessRate([]);
      expect(successRate).toBe(0);
    });
  });

  describe('Performance Grading', () => {
    it('should calculate correct performance grades', () => {
      expect(analyticsEngine.calculatePerformanceGrade(0.98, 0.95)).toBe('A+');
      expect(analyticsEngine.calculatePerformanceGrade(0.90, 0.85)).toBe('A');
      expect(analyticsEngine.calculatePerformanceGrade(0.75, 0.70)).toBe('B');
      expect(analyticsEngine.calculatePerformanceGrade(0.60, 0.55)).toBe('C');
      expect(analyticsEngine.calculatePerformanceGrade(0.40, 0.45)).toBe('D');
    });
  });
});
