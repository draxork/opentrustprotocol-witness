/**
 * OpenTrust Protocol Oracle - Enhanced Oracle with Analytics Integration
 * 
 * @version 3.0.0
 */

import { OTPAnalyticsEngine } from '../analytics/OTPAnalyticsEngine';
import { MemoryStorage } from '../storage/MemoryStorage';
import { 
  OracleConfig, 
  JudgmentPair, 
  NeutrosophicJudgment, 
  OutcomeJudgment,
  PerformanceAnalysis,
  JudgmentPairStorage
} from '../types/index';

export class EnhancedOracle {
  private config: OracleConfig;
  private storage: JudgmentPairStorage;
  private analytics: OTPAnalyticsEngine;

  constructor(config: OracleConfig, storage?: JudgmentPairStorage) {
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
        mapper_id: 'enhanced-oracle'
      },
      outcome: {
        judgment_id: outcome.judgment_id || `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outcome_judgment: outcome,
        timestamp: new Date().toISOString(),
        oracle_source: this.config.oracleId
      }
    };

    // Store the pair
    await this.storage.savePair(pair);

    console.log(`✅ Enhanced Oracle ${this.config.oracleId} recorded outcome for judgment ${decision.judgment_id!}`);
  }

  /**
   * Get real-time performance metrics
   */
  async getRealTimeMetrics(): Promise<{
    oracle_id: string;
    total_judgments: number;
    success_rate: number;
    average_confidence: number;
    average_indeterminacy: number;
    last_updated: string;
    performance_grade: string;
  }> {
    const pairs = await this.storage.getPairsByOracle(this.config.oracleId);
    
    if (pairs.length === 0) {
      return {
        oracle_id: this.config.oracleId,
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
      oracle_id: this.config.oracleId,
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
    const pairs = await this.storage.getPairsByOracle(this.config.oracleId);
    
    if (pairs.length === 0) {
      throw new Error(`No judgment pairs found for oracle: ${this.config.oracleId}`);
    }

    return await this.analytics.analyzePerformance(this.config.oracleId, pairs);
  }

  /**
   * Get oracle status with health indicators
   */
  async getOracleStatus(): Promise<{
    oracle_id: string;
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
    const pairs = await this.storage.getPairsByOracle(this.config.oracleId);
    const metrics = await this.getRealTimeMetrics();
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (metrics.success_rate < 0.5) status = 'critical';
    else if (metrics.success_rate < 0.7) status = 'warning';

    return {
      oracle_id: this.config.oracleId,
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
    oracle_config: OracleConfig;
    judgment_pairs: JudgmentPair[];
    analytics_summary: any;
    export_timestamp: string;
  }> {
    const pairs = await this.storage.getPairsByOracle(this.config.oracleId);
    
    let analyticsSummary = null;
    try {
      analyticsSummary = await this.getPerformanceAnalysis();
    } catch (error: any) {
      analyticsSummary = { error: error.message };
    }

    return {
      oracle_config: this.config,
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