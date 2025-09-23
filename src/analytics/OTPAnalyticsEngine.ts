/**
 * OpenTrust Protocol Analytics Engine
 * 
 * Complete implementation of performance analytics including calibration analysis,
 * Value of Indeterminacy (VoI) calculations, and mapper performance evaluation.
 * 
 * @version 4.0.2
 */

import {
  JudgmentPair,
  PerformanceAnalysis,
  CalibrationMetrics,
  VoIMetrics,
  PerformanceGrade,
  ReliabilityPoint,
  ConfidenceInterval,
  VoIByConfidence,
  MapperMetrics,
  TimeMetrics
} from '../types/index';

export class OTPAnalyticsEngine {
  constructor() {}

  /**
   * Comprehensive performance analysis for an oracle
   */
  async analyzePerformance(oracleId: string, pairs: JudgmentPair[]): Promise<PerformanceAnalysis> {
    const oraclePairs = pairs.filter(p => p.outcome.oracle_source === oracleId);
    
    if (oraclePairs.length === 0) {
      throw new Error(`No judgment pairs found for oracle: ${oracleId}`);
    }

    // Calculate all metrics
    const calibration = await this.calculateCalibration(oraclePairs);
    const voi = await this.calculateVoI(oraclePairs);
    const successRate = this.calculateSuccessRate(oraclePairs);
    const performanceGrade = this.calculatePerformanceGrade(calibration.overall_calibration_score, successRate);

    // Calculate mapper metrics
    const mapperIds = [...new Set(oraclePairs.map(p => p.decision.mapper_id).filter(Boolean))];
    const metricsByMapper: Record<string, MapperMetrics> = {};
    
    for (const mapperId of mapperIds) {
      if (!mapperId) continue;
      const mapperPairs = oraclePairs.filter(p => p.decision.mapper_id === mapperId);
      const mapperCalibration = await this.calculateCalibration(mapperPairs);
      const mapperVoI = await this.calculateVoI(mapperPairs);
      
      metricsByMapper[mapperId] = {
        mapper_id: mapperId,
        total_decisions: mapperPairs.length,
        calibration_score: mapperCalibration.overall_calibration_score,
        success_rate: this.calculateSuccessRate(mapperPairs),
        average_confidence: this.calculateAverageConfidence(mapperPairs),
        average_indeterminacy: this.calculateAverageIndeterminacy(mapperPairs),
        voi_contribution: mapperVoI.indeterminacy_correlation,
        performance_grade: this.calculatePerformanceGrade(
          mapperCalibration.overall_calibration_score, 
          this.calculateSuccessRate(mapperPairs)
        )
      };
    }

    // Calculate time-based metrics (monthly)
    const metricsByTime = await this.calculateTimeMetrics(oraclePairs);

    // Determine period from data
    const timestamps = oraclePairs.map(p => new Date(p.decision.timestamp));
    const startDate = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();
    const endDate = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();
    
    return {
      oracle_id: oracleId,
      period: {
        start: startDate.toISOString().split('T')[0]!,
        end: endDate.toISOString().split('T')[0]!
      },
      total_judgments: oraclePairs.length,
      overall_calibration_score: calibration.overall_calibration_score,
      value_of_indeterminacy: voi.average_voi_contribution,
      success_rate: successRate,
      performance_grade: performanceGrade,
      metrics_by_mapper: metricsByMapper,
      metrics_by_time: metricsByTime
    };
  }

  /**
   * Calculate calibration metrics with confidence buckets
   */
  async calculateCalibration(pairs: JudgmentPair[]): Promise<CalibrationMetrics> {
    if (pairs.length === 0) {
    return {
        overall_calibration_score: 0,
        sample_size: 0,
      reliability_points: [],
        calibration_error: 1.0,
      confidence_intervals: [],
      mapper_calibration: {}
    };
  }

    // Define confidence buckets
    const buckets = [
      { range: [0.8, 1.0], label: 'High Confidence' },
      { range: [0.6, 0.8], label: 'Medium Confidence' },
      { range: [0.4, 0.6], label: 'Low Confidence' },
      { range: [0.0, 0.4], label: 'Very Low Confidence' }
    ];

    const reliabilityPoints: ReliabilityPoint[] = [];
    let totalCalibrationError = 0;

    for (const bucket of buckets) {
      const bucketPairs = pairs.filter(pair => {
        const confidence = Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F);
        return confidence >= bucket.range[0]! && confidence < bucket.range[1]!;
      });

      if (bucketPairs.length === 0) continue;

      const predictedSuccessRate = bucketPairs.reduce((sum, pair) => 
        sum + Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F), 0
      ) / bucketPairs.length;

      const actualSuccessRate = bucketPairs.reduce((sum, pair) => 
        sum + pair.outcome.outcome_judgment.T, 0
      ) / bucketPairs.length;

      const calibrationError = Math.abs(predictedSuccessRate - actualSuccessRate);
      totalCalibrationError += calibrationError;

      reliabilityPoints.push({
        confidence_bin: (bucket.range[0]! + bucket.range[1]!) / 2,
        accuracy: actualSuccessRate,
        count: bucketPairs.length,
        expected_accuracy: predictedSuccessRate,
        calibration_error: calibrationError
      });
    }

    const overallCalibrationScore = Math.max(0, 1 - (totalCalibrationError / buckets.length));
    
    // Calculate confidence intervals
    const confidenceIntervals = this.calculateConfidenceIntervals(pairs);

    // Calculate mapper-specific calibration (simplified to avoid recursion)
    const mapperCalibration: Record<string, number> = {};
    const mapperIds = [...new Set(pairs.map(p => p.decision.mapper_id).filter(Boolean))];
    
    for (const mapperId of mapperIds) {
      if (!mapperId) continue;
      const mapperPairs = pairs.filter(p => p.decision.mapper_id === mapperId);
      // Calculate calibration score directly without recursion
      const mapperCalibrationScore = this.calculateMapperCalibrationScore(mapperPairs);
      mapperCalibration[mapperId] = mapperCalibrationScore;
    }

    return {
      overall_calibration_score: overallCalibrationScore,
      sample_size: pairs.length,
      reliability_points: reliabilityPoints,
      calibration_error: totalCalibrationError / buckets.length,
      confidence_intervals: confidenceIntervals,
      mapper_calibration: mapperCalibration
    };
  }

  /**
   * Calculate Value of Indeterminacy (VoI) metrics
   */
  async calculateVoI(pairs: JudgmentPair[]): Promise<VoIMetrics> {
    if (pairs.length === 0) {
      return {
        average_voi_contribution: 0,
        indeterminacy_correlation: 0,
      voi_by_confidence: [],
        optimal_indeterminacy_range: { min: 0, max: 0 },
      mapper_voi: {}
      };
    }

    // Group by indeterminacy ranges
    const indeterminacyBuckets = [
      { range: [0.0, 0.2], label: 'Low Uncertainty' },
      { range: [0.2, 0.4], label: 'Medium Uncertainty' },
      { range: [0.4, 0.6], label: 'High Uncertainty' },
      { range: [0.6, 1.0], label: 'Very High Uncertainty' }
    ];

    const voiByConfidence: VoIByConfidence[] = [];
    const indeterminacyValues: number[] = [];
    const varianceValues: number[] = [];

    for (const bucket of indeterminacyBuckets) {
      const bucketPairs = pairs.filter(pair => {
        const indeterminacy = pair.decision.judgment.I;
        return indeterminacy >= bucket.range[0]! && indeterminacy < bucket.range[1]!;
      });

      if (bucketPairs.length === 0) continue;

      const outcomes = bucketPairs.map(pair => pair.outcome.outcome_judgment.T);
      const meanOutcome = outcomes.reduce((sum, outcome) => sum + outcome, 0) / outcomes.length;
      const variance = outcomes.reduce((sum, outcome) => 
        sum + Math.pow(outcome - meanOutcome, 2), 0
      ) / outcomes.length;

      const averageIndeterminacy = bucketPairs.reduce((sum, pair) => 
        sum + pair.decision.judgment.I, 0
      ) / bucketPairs.length;

      const averageConfidence = bucketPairs.reduce((sum, pair) => 
        sum + Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F), 0
      ) / bucketPairs.length;

      voiByConfidence.push({
        confidence_level: averageConfidence,
        average_indeterminacy: averageIndeterminacy,
        voi_contribution: variance,
        sample_size: bucketPairs.length
      });

      indeterminacyValues.push(averageIndeterminacy);
      varianceValues.push(variance);
    }

    // Calculate correlation between indeterminacy and variance
    const indeterminacyCorrelation = this.calculateCorrelation(indeterminacyValues, varianceValues);
    
    // Calculate average VoI contribution
    const averageVoIContribution = varianceValues.length > 0 
      ? varianceValues.reduce((sum, v) => sum + v, 0) / varianceValues.length 
      : 0;

    // Find optimal indeterminacy range (where VoI is highest)
    const optimalRange = this.findOptimalIndeterminacyRange(voiByConfidence);

    // Calculate mapper-specific VoI (simplified to avoid recursion)
    const mapperVoI: Record<string, number> = {};
    const mapperIds = [...new Set(pairs.map(p => p.decision.mapper_id).filter(Boolean))];
    
    for (const mapperId of mapperIds) {
      if (!mapperId) continue;
      const mapperPairs = pairs.filter(p => p.decision.mapper_id === mapperId);
      // Calculate VoI correlation directly without recursion
      const mapperVoICorrelation = this.calculateMapperVoICorrelation(mapperPairs);
      mapperVoI[mapperId] = mapperVoICorrelation;
    }

    return {
      average_voi_contribution: averageVoIContribution,
      indeterminacy_correlation: indeterminacyCorrelation,
      voi_by_confidence: voiByConfidence,
      optimal_indeterminacy_range: optimalRange,
      mapper_voi: mapperVoI
    };
  }

  /**
   * Evaluate performance of a specific mapper
   */
  async evaluateMapperPerformance(
    mapperId: string,
    pairs: JudgmentPair[],
    timeRange?: { start: Date; end: Date }
  ): Promise<MapperMetrics> {
    const mapperPairs = timeRange 
      ? pairs.filter(p => 
          p.decision.mapper_id === mapperId &&
          new Date(p.decision.timestamp) >= timeRange.start &&
          new Date(p.decision.timestamp) <= timeRange.end
        )
      : pairs.filter(p => p.decision.mapper_id === mapperId);

    if (mapperPairs.length === 0) {
      return {
        mapper_id: mapperId,
        total_decisions: 0,
        calibration_score: 0,
        success_rate: 0,
        average_confidence: 0,
        average_indeterminacy: 0,
        voi_contribution: 0,
        performance_grade: 'D'
      };
    }

    const calibration = await this.calculateCalibration(mapperPairs);
    const voi = await this.calculateVoI(mapperPairs);
    const successRate = this.calculateSuccessRate(mapperPairs);

    return {
      mapper_id: mapperId,
      total_decisions: mapperPairs.length,
      calibration_score: calibration.overall_calibration_score,
      success_rate: successRate,
      average_confidence: this.calculateAverageConfidence(mapperPairs),
      average_indeterminacy: this.calculateAverageIndeterminacy(mapperPairs),
      voi_contribution: voi.indeterminacy_correlation,
      performance_grade: this.calculatePerformanceGrade(calibration.overall_calibration_score, successRate)
    };
  }

  /**
   * Calculate success rate from judgment pairs
   */
  calculateSuccessRate(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    const successes = pairs.filter(pair => {
      const outcomeType = pair.outcome.outcome_judgment.outcome_type;
      return outcomeType === 'success' ||
             outcomeType === 'trading_success' ||
             outcomeType === 'medical_success';
    }).length;
    return successes / pairs.length;
  }

  /**
   * Calculate performance grade based on calibration and success rate
   */
  calculatePerformanceGrade(calibrationScore: number, successRate: number): PerformanceGrade {
    const combinedScore = (calibrationScore + successRate) / 2;
    if (combinedScore >= 0.9) return 'A+';
    if (combinedScore >= 0.8) return 'A';
    if (combinedScore >= 0.7) return 'B';
    if (combinedScore >= 0.6) return 'C';
    return 'D';
  }

  // Private helper methods

  private calculateMapperCalibrationScore(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    
    // Simple calibration score calculation for mappers
    const buckets = [
      { range: [0.8, 1.0], label: 'High Confidence' },
      { range: [0.6, 0.8], label: 'Medium Confidence' },
      { range: [0.4, 0.6], label: 'Low Confidence' },
      { range: [0.0, 0.4], label: 'Very Low Confidence' }
    ];

    let totalCalibrationError = 0;
    let validBuckets = 0;

    for (const bucket of buckets) {
      const bucketPairs = pairs.filter(pair => {
        const confidence = Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F);
        return confidence >= bucket.range[0]! && confidence < bucket.range[1]!;
      });

      if (bucketPairs.length === 0) continue;

      const predictedSuccessRate = bucketPairs.reduce((sum, pair) => 
        sum + Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F), 0
      ) / bucketPairs.length;

      const actualSuccessRate = bucketPairs.reduce((sum, pair) => 
        sum + pair.outcome.outcome_judgment.T, 0
      ) / bucketPairs.length;

      const calibrationError = Math.abs(predictedSuccessRate - actualSuccessRate);
      totalCalibrationError += calibrationError;
      validBuckets++;
    }

    return validBuckets > 0 ? Math.max(0, 1 - (totalCalibrationError / validBuckets)) : 0;
  }

  private calculateMapperVoICorrelation(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    
    // Simple VoI correlation calculation for mappers
    const indeterminacyValues: number[] = [];
    const varianceValues: number[] = [];

    for (const pair of pairs) {
      const indeterminacy = pair.decision.judgment.I;
      const outcome = pair.outcome.outcome_judgment.T;
      
      indeterminacyValues.push(indeterminacy);
      varianceValues.push(outcome);
    }

    return this.calculateCorrelation(indeterminacyValues, varianceValues);
  }

  private calculateAverageConfidence(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((sum, pair) => 
      sum + Math.max(pair.decision.judgment.T, 1 - pair.decision.judgment.F), 0
    ) / pairs.length;
  }

  private calculateAverageIndeterminacy(pairs: JudgmentPair[]): number {
    if (pairs.length === 0) return 0;
    return pairs.reduce((sum, pair) => sum + pair.decision.judgment.I, 0) / pairs.length;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i]! - meanX;
      const diffY = y[i]! - meanY;
      numerator += diffX * diffY;
      denominatorX += diffX * diffX;
      denominatorY += diffY * diffY;
    }
    
    const denominator = Math.sqrt(denominatorX * denominatorY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateConfidenceIntervals(pairs: JudgmentPair[]): ConfidenceInterval[] {
    const intervals: ConfidenceInterval[] = [];
    const confidenceLevels = [0.95, 0.90, 0.80];
    
    for (const level of confidenceLevels) {
      const alpha = 1 - level;
      const zScore = this.getZScore(alpha / 2);
      const margin = zScore * Math.sqrt((level * (1 - level)) / pairs.length);
      
      intervals.push({
        confidence_level: level,
        lower_bound: Math.max(0, level - margin),
        upper_bound: Math.min(1, level + margin),
        sample_size: pairs.length
      });
    }
    
    return intervals;
  }

  private getZScore(alpha: number): number {
    // Approximate z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.025: 1.96,  // 95% confidence
      0.05: 1.645,  // 90% confidence
      0.1: 1.28     // 80% confidence
    };
    return zScores[alpha] || 1.96;
  }

  private findOptimalIndeterminacyRange(voiByConfidence: VoIByConfidence[]): { min: number; max: number } {
    if (voiByConfidence.length === 0) return { min: 0, max: 0 };
    
    // Find the range with highest VoI contribution
    const maxVoI = Math.max(...voiByConfidence.map(v => v.voi_contribution));
    const optimalEntry = voiByConfidence.find(v => v.voi_contribution === maxVoI);
    
    if (!optimalEntry) return { min: 0, max: 0 };
    
    // Return a range around the optimal indeterminacy level
    const center = optimalEntry.average_indeterminacy;
    const range = 0.1; // ±10% range
    
    return {
      min: Math.max(0, center - range),
      max: Math.min(1, center + range)
    };
  }

  private async calculateTimeMetrics(pairs: JudgmentPair[]): Promise<Record<string, TimeMetrics>> {
    const timeMetrics: Record<string, TimeMetrics> = {};
    
    // Group by month
    const monthlyGroups: Record<string, JudgmentPair[]> = {};
    
    for (const pair of pairs) {
      const date = new Date(pair.decision.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(pair);
    }
    
    for (const [month, monthPairs] of Object.entries(monthlyGroups)) {
      const calibration = await this.calculateCalibration(monthPairs);
      const successRate = this.calculateSuccessRate(monthPairs);
      const avgConfidence = this.calculateAverageConfidence(monthPairs);
      
      timeMetrics[month] = {
        period: month,
        total_decisions: monthPairs.length,
        calibration_score: calibration.overall_calibration_score,
        success_rate: successRate,
        average_confidence: avgConfidence
      };
    }
    
    return timeMetrics;
  }
}
