/**
 * OpenTrust Protocol Witness - Enhanced Witness with Analytics Integration
 * 
 * @version 3.0.0
 */

import { OTPAnalyticsEngine } from '../analytics/OTPAnalyticsEngine';
import { MemoryStorage } from '../storage/MemoryStorage';
import { 
  WitnessConfig, 
  JudgmentPair, 
  NeutrosophicJudgment, 
  OutcomeJudgment,
  PerformanceAnalysis,
  JudgmentPairStorage
} from '../types/index';

export class EnhancedWitness {
  private config: WitnessConfig;
  private storage: JudgmentPairStorage;
  private analytics: OTPAnalyticsEngine;

  constructor(config: WitnessConfig, storage?: JudgmentPairStorage) {
    this.config = config;
    this.storage = storage || new MemoryStorage();
    this.analytics = new OTPAnalyticsEngine();
  }

  /**
   * Record an outcome with automatic analytics integration
   */
  async recordOutcome(
    decision: NeutrosophicJudgment,
    outcome: OutcomeJudgment,
    context?: Record<string, any>
  ): Promise<void> {
    // Validate inputs
    if (!decision.judgment_id) {
      throw new Error('Decision judgment must have a judgment_id');
    }

    // Create judgment pair
    const pair: JudgmentPair = {
      decision: {
        judgment_id: decision.judgment_id!,
        judgment: decision,
        timestamp: new Date().toISOString(),
        context: context || {},
        mapper_id: 'enhanced-witness'
      },
      outcome: {
        judgment_id: outcome.judgment_id || `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outcome_judgment: outcome,
        timestamp: new Date().toISOString(),
        witness_source: this.config.witnessId
      }
    };

    // Store the pair
    await this.storage.savePair(pair);

    console.log(`✅ Enhanced Witness ${this.config.witnessId} recorded outcome for judgment ${decision.judgment_id!}`);
  }

  /**
   * Get real-time performance metrics
   */
  async getRealTimeMetrics(): Promise<{
    witness_id: string;
    total_judgments: number;
    success_rate: number;
    average_confidence: number;
    average_indeterminacy: number;
    last_updated: string;
    performance_grade: string;
  }> {
    const pairs = await this.storage.getPairsByWitness(this.config.witnessId);
    
    if (pairs.length === 0) {
      return {
        witness_id: this.config.witnessId,
        total_judgments: 0,
        success_rate: 0,
        average_confidence: 0,
        average_indeterminacy: 0,
        last_updated: new Date().toISOString(),
        performance_grade: 'N/A'
      };
    }

    const successRate = this.calculateSuccessRate(pairs);
    const avgConfidence = this.calculateAverageConfidence(pairs);
    const avgIndeterminacy = this.calculateAverageIndeterminacy(pairs);
    const performanceGrade = this.calculatePerformanceGrade(successRate);

    return {
      witness_id: this.config.witnessId,
      total_judgments: pairs.length,
      success_rate: successRate,
      average_confidence: avgConfidence,
      average_indeterminacy: avgIndeterminacy,
      last_updated: new Date().toISOString(),
      performance_grade: performanceGrade
    };
  }

  /**
   * Get comprehensive performance analysis
   */
  async getPerformanceAnalysis(): Promise<PerformanceAnalysis> {
    const pairs = await this.storage.getPairsByWitness(this.config.witnessId);
    
    if (pairs.length === 0) {
      throw new Error(`No judgment pairs found for witness: ${this.config.witnessId}`);
    }

    return await this.analytics.analyzePerformance(this.config.witnessId, pairs);
  }

  /**
   * Get witness status with health indicators
   */
  async getWitnessStatus(): Promise<{
    witness_id: string;
    status: 'healthy' | 'warning' | 'critical';
    version: string;
    uptime: number;
    total_judgments: number;
    last_activity: string;
    performance_indicators: {
      success_rate: number;
      confidence_trend: 'increasing' | 'stable' | 'decreasing';
      indeterminacy_trend: 'increasing' | 'stable' | 'decreasing';
      calibration_quality: 'excellent' | 'good' | 'fair' | 'poor';
    };
  }> {
    const pairs = await this.storage.getPairsByWitness(this.config.witnessId);
    const metrics = await this.getRealTimeMetrics();
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (metrics.success_rate < 0.5) status = 'critical';
    else if (metrics.success_rate < 0.7) status = 'warning';

    return {
      witness_id: this.config.witnessId,
      status,
      version: this.config.version,
      uptime: process.uptime(),
      total_judgments: metrics.total_judgments,
      last_activity: pairs.length > 0 ? pairs[pairs.length - 1]!.decision.timestamp : 'Never',
      performance_indicators: {
        success_rate: metrics.success_rate,
        confidence_trend: 'stable',
        indeterminacy_trend: 'stable',
        calibration_quality: this.assessCalibrationQuality(metrics.success_rate)
      }
    };
  }

  /**
   * Export all data for backup or analysis
   */
  async exportData(): Promise<{
    witness_config: WitnessConfig;
    judgment_pairs: JudgmentPair[];
    analytics_summary: any;
    export_timestamp: string;
  }> {
    const pairs = await this.storage.getPairsByWitness(this.config.witnessId);
    
    let analyticsSummary = null;
    try {
      analyticsSummary = await this.getPerformanceAnalysis();
    } catch (error: any) {
      analyticsSummary = { error: error.message };
    }

    return {
      witness_config: this.config,
      judgment_pairs: pairs,
      analytics_summary: analyticsSummary,
      export_timestamp: new Date().toISOString()
    };
  }

  // Private helper methods

  private calculateSuccessRate(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;

    const successes = pairs.filter(pair => {
      const outcomeType = pair.outcome.outcome_judgment.outcome_type;
      return outcomeType === 'success' ||
             outcomeType === 'trading_success' ||
             outcomeType === 'medical_success';
    }).length;

    return successes / pairs.length;
  }

  private calculateAverageConfidence(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    
    const totalConfidence = pairs.reduce((sum, pair) => sum + pair.decision.judgment.T, 0);
    return totalConfidence / pairs.length;
  }

  private calculateAverageIndeterminacy(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    
    const totalIndeterminacy = pairs.reduce((sum, pair) => sum + pair.decision.judgment.I, 0);
    return totalIndeterminacy / pairs.length;
  }

  private calculatePerformanceGrade(successRate: number): string {
    if (successRate >= 0.95) return 'A+';
    if (successRate >= 0.85) return 'A';
    if (successRate >= 0.70) return 'B';
    if (successRate >= 0.55) return 'C';
    return 'D';
  }

  private assessCalibrationQuality(successRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (successRate >= 0.9) return 'excellent';
    if (successRate >= 0.75) return 'good';
    if (successRate >= 0.6) return 'fair';
    return 'poor';
  }
}