/**
 * OpenTrust Protocol Oracle - Advanced Types
 * 
 * @version 4.0.2
 * @author OpenTrust Protocol Team
 */

// Import core types from opentrustprotocol package
import { 
  ProvenanceEntry as CoreProvenanceEntry,
  OutcomeType as CoreOutcomeType
} from 'opentrustprotocol';

// Extended NeutrosophicJudgment with judgment_id for oracle use
export interface NeutrosophicJudgment {
  judgment_id?: string;
  T: number;
  I: number;
  F: number;
  provenance_chain: readonly ProvenanceEntry[];
  validate(): void;
  toJSON(): object;
  toString(): string;
  equals(other: NeutrosophicJudgment): boolean;
}

// Re-export other core types
export type ProvenanceEntry = CoreProvenanceEntry;

// Extended OutcomeJudgment with additional outcome types for oracle use
export interface OutcomeJudgment {
  judgment_id: string;
  links_to_judgment_id: string;
  T: number;
  I: number;
  F: number;
  outcome_type: string; // Allow any string for oracle-specific types
  oracle_source: string;
  provenance_chain: readonly ProvenanceEntry[];
}

export { CoreOutcomeType as OutcomeType };

// Extended outcome types for oracle-specific use cases
export enum ExtendedOutcomeType {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  TRADING_SUCCESS = 'trading_success',
  TRADING_FAILURE = 'trading_failure',
  MEDICAL_SUCCESS = 'medical_success',
  MEDICAL_FAILURE = 'medical_failure'
}

// Oracle Configuration
export interface OracleConfig {
  oracleId: string;
  version: string;
  description: string;
  validationRules?: OracleValidationRules;
}

export interface OracleValidationRules {
  minConfidence: number;
  maxIndeterminacy: number;
  requiredFields: string[];
  customValidators?: Array<(judgment: NeutrosophicJudgment) => boolean>;
}

// Judgment Pair Storage
export interface JudgmentPair {
  decision: DecisionRecord;
  outcome: OutcomeRecord;
}

export interface DecisionRecord {
  judgment_id: string;
  judgment: NeutrosophicJudgment;
  timestamp: string;
  context: Record<string, any>;
  mapper_id?: string;
}

export interface OutcomeRecord {
  judgment_id: string;
  outcome_judgment: OutcomeJudgment;
  timestamp: string;
  oracle_source: string;
}

// Performance Analysis
export interface PerformanceAnalysis {
  oracle_id: string;
  period: {
    start: string;
    end: string;
  };
  total_judgments: number;
  overall_calibration_score: number;
  value_of_indeterminacy: number;
  success_rate: number;
  performance_grade: PerformanceGrade;
  metrics_by_mapper: Record<string, MapperMetrics>;
  metrics_by_time: Record<string, TimeMetrics>;
}

export type PerformanceGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface MapperMetrics {
  mapper_id: string;
  total_decisions: number;
  calibration_score: number;
  success_rate: number;
  average_confidence: number;
  average_indeterminacy: number;
  voi_contribution: number;
  performance_grade: PerformanceGrade;
}

export interface TimeMetrics {
  period: string;
  total_decisions: number;
  calibration_score: number;
  success_rate: number;
  average_confidence: number;
}

// Calibration Metrics
export interface CalibrationMetrics {
  overall_calibration_score: number;
  sample_size: number;
  reliability_points: ReliabilityPoint[];
  calibration_error: number;
  confidence_intervals: ConfidenceInterval[];
  mapper_calibration: Record<string, number>;
}

export interface ReliabilityPoint {
  confidence_bin: number;
  accuracy: number;
  count: number;
  expected_accuracy: number;
  calibration_error: number;
}

export interface ConfidenceInterval {
  confidence_level: number;
  lower_bound: number;
  upper_bound: number;
  sample_size: number;
}

// Value of Indeterminacy (VoI) Metrics
export interface VoIMetrics {
  average_voi_contribution: number;
  indeterminacy_correlation: number;
  voi_by_confidence: VoIByConfidence[];
  optimal_indeterminacy_range: {
    min: number;
    max: number;
  };
  mapper_voi: Record<string, number>;
}

export interface VoIByConfidence {
  confidence_level: number;
  average_indeterminacy: number;
  voi_contribution: number;
  sample_size: number;
}

// Storage Interface
export interface JudgmentPairStorage {
  savePair(pair: JudgmentPair): Promise<void>;
  getPair(judgmentId: string): Promise<JudgmentPair | null>;
  getPairsByOracle(oracleId: string): Promise<JudgmentPair[]>;
  getPairsByJudgmentId(judgmentId: string): Promise<JudgmentPair[]>;
  getJudgmentPairs(timeRange?: { start: Date; end: Date }, context?: string): Promise<JudgmentPair[]>;
  getJudgmentPairsByMapper(mapperId: string, timeRange?: { start: Date; end: Date }): Promise<JudgmentPair[]>;
  getStorageStats(): Promise<StorageStats>;
  cleanup(olderThanMs: number): Promise<number>;
}

export interface StorageStats {
  totalPairs: number;
  oracleCount: number;
  timestampCount: number;
  memoryUsage: number;
  oldestTimestamp?: Date;
  newestTimestamp?: Date;
}

// Error Types
export class OracleError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OracleError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Trading Context
export interface TradingContext {
  pair: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  marketConditions: {
    volatility: number;
    volume: number;
    trend: 'bullish' | 'bearish' | 'sideways';
  };
  risk: {
    positionSize: number;
    stopLoss?: number;
    takeProfit?: number;
  };
}

// Medical Context
export interface MedicalContext {
  patientId: string;
  condition: string;
  treatment: string;
  followUpDays: number;
  protocol: {
    dosage: string;
    frequency: string;
    duration: string;
  };
}

// Analytics Engine Configuration
export interface AnalyticsConfig {
  calibrationBins: number;
  confidenceLevel: number;
  minSampleSize: number;
  enableVoIAnalysis: boolean;
  enableMapperAnalysis: boolean;
  enableTimeAnalysis: boolean;
}