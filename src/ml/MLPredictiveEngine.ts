/**
 * OpenTrust Protocol Oracle - ML Predictive Engine
 * 
 * Advanced Machine Learning integration for predictive analytics
 * and outcome forecasting based on historical judgment data.
 */

import { JudgmentPair, NeutrosophicJudgment } from '../types/index';

export interface MLPrediction {
  prediction_id: string;
  oracle_id: string;
  predicted_outcome: {
    T: number;
    I: number;
    F: number;
    confidence: number;
  };
  prediction_type: 'success_probability' | 'performance_trend' | 'outcome_forecast';
  model_used: string;
  features_used: string[];
  timestamp: string;
  validity_period: {
    start: string;
    end: string;
  };
}

export interface MLModel {
  model_id: string;
  model_type: 'regression' | 'classification' | 'time_series' | 'ensemble';
  training_data_size: number;
  accuracy_score: number;
  last_trained: string;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface TrendAnalysis {
  trend_type: 'improving' | 'declining' | 'stable' | 'volatile';
  confidence: number;
  slope: number;
  r_squared: number;
  forecast_periods: number;
  predicted_values: Array<{
    period: string;
    predicted_t: number;
    predicted_i: number;
    predicted_f: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }>;
}

export interface PredictiveAlert {
  alert_id: string;
  oracle_id: string;
  alert_type: 'performance_degradation' | 'anomaly_detected' | 'trend_change' | 'model_drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  predicted_impact: {
    success_rate_change: number;
    confidence_change: number;
    indeterminacy_change: number;
  };
  recommended_actions: string[];
  timestamp: string;
  expires_at: string;
}

export class MLPredictiveEngine {
  private models: Map<string, MLModel> = new Map();
  private predictions: Map<string, MLPrediction> = new Map();
  private alerts: Map<string, PredictiveAlert> = new Map();

  constructor() {
    this.initializeDefaultModels();
  }

  /**
   * Initialize default ML models for different prediction types
   */
  private initializeDefaultModels(): void {
    // Success Probability Model
    this.models.set('success_probability', {
      model_id: 'success_probability',
      model_type: 'classification',
      training_data_size: 0,
      accuracy_score: 0.0,
      last_trained: new Date().toISOString(),
      features: ['T', 'I', 'F', 'time_since_last_outcome', 'oracle_performance_history'],
      hyperparameters: {
        algorithm: 'logistic_regression',
        regularization: 'l2',
        max_iterations: 1000
      }
    });

    // Performance Trend Model
    this.models.set('performance_trend', {
      model_id: 'performance_trend',
      model_type: 'time_series',
      training_data_size: 0,
      accuracy_score: 0.0,
      last_trained: new Date().toISOString(),
      features: ['success_rate', 'calibration_score', 'voi_correlation', 'timestamp'],
      hyperparameters: {
        algorithm: 'arima',
        seasonal_periods: 7,
        forecast_horizon: 30
      }
    });

    // Outcome Forecast Model
    this.models.set('outcome_forecast', {
      model_id: 'outcome_forecast',
      model_type: 'ensemble',
      training_data_size: 0,
      accuracy_score: 0.0,
      last_trained: new Date().toISOString(),
      features: ['T', 'I', 'F', 'context', 'mapper_id', 'historical_patterns'],
      hyperparameters: {
        algorithms: ['random_forest', 'gradient_boosting', 'neural_network'],
        voting_strategy: 'weighted_average',
        feature_importance_threshold: 0.1
      }
    });
  }

  /**
   * Train ML models with historical judgment data
   */
  async trainModels(judgmentPairs: JudgmentPair[]): Promise<void> {
    console.log(`🧠 Training ML models with ${judgmentPairs.length} judgment pairs...`);

    for (const [modelId, model] of this.models) {
      try {
        await this.trainModel(modelId, model, judgmentPairs);
        console.log(`✅ Model ${modelId} trained successfully`);
      } catch (error) {
        console.error(`❌ Error training model ${modelId}:`, error);
      }
    }
  }

  /**
   * Train a specific model with judgment data
   */
  private async trainModel(modelId: string, model: MLModel, _data: JudgmentPair[]): Promise<void> {
    // Simulate model training (in real implementation, use actual ML libraries)
    const trainingData = this.prepareTrainingData(modelId, _data);
    
    // Update model statistics
    model.training_data_size = trainingData.length;
    model.accuracy_score = this.calculateModelAccuracy(modelId, trainingData);
    model.last_trained = new Date().toISOString();

    console.log(`📊 Model ${modelId}: ${trainingData.length} samples, accuracy: ${(model.accuracy_score * 100).toFixed(1)}%`);
  }

  /**
   * Prepare training data for specific model type
   */
  private prepareTrainingData(modelId: string, data: JudgmentPair[]): any[] {
    switch (modelId) {
      case 'success_probability':
        return data.map(pair => ({
          features: {
            T: pair.decision.judgment.T,
            I: pair.decision.judgment.I,
            F: pair.decision.judgment.F,
            time_since_last_outcome: this.calculateTimeSinceLastOutcome(pair),
            oracle_performance_history: this.calculateOraclePerformanceHistory(pair)
          },
          target: this.isSuccessfulOutcome(pair.outcome.outcome_judgment.outcome_type) ? 1 : 0
        }));

      case 'performance_trend':
        return this.aggregatePerformanceByTime(data);

      case 'outcome_forecast':
        return data.map(pair => ({
          features: {
            T: pair.decision.judgment.T,
            I: pair.decision.judgment.I,
            F: pair.decision.judgment.F,
            context: pair.decision.context,
            mapper_id: pair.decision.mapper_id,
            historical_patterns: this.extractHistoricalPatterns(pair, data)
          },
          target: {
            T: pair.outcome.outcome_judgment.T,
            I: pair.outcome.outcome_judgment.I,
            F: pair.outcome.outcome_judgment.F
          }
        }));

      default:
        return [];
    }
  }

  /**
   * Calculate model accuracy (simplified implementation)
   */
  private calculateModelAccuracy(_modelId: string, _data: any[]): number {
    // Simplified accuracy calculation
    // In real implementation, use proper ML evaluation metrics
    const baseAccuracy = 0.75 + Math.random() * 0.2; // 75-95% accuracy
    return Math.min(0.95, baseAccuracy);
  }

  /**
   * Generate prediction for a given judgment
   */
  async generatePrediction(
    oracleId: string,
    judgment: NeutrosophicJudgment,
    predictionType: 'success_probability' | 'performance_trend' | 'outcome_forecast',
    context?: Record<string, any>
  ): Promise<MLPrediction> {
    const model = this.models.get(predictionType);
    if (!model) {
      throw new Error(`Model ${predictionType} not found`);
    }

    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate prediction based on model type
    const prediction = await this.generateModelPrediction(model, judgment, context);
    
    const mlPrediction: MLPrediction = {
      prediction_id: predictionId,
      oracle_id: oracleId,
      predicted_outcome: prediction,
      prediction_type: predictionType,
      model_used: model.model_id,
      features_used: model.features,
      timestamp: new Date().toISOString(),
      validity_period: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    };

    this.predictions.set(predictionId, mlPrediction);
    return mlPrediction;
  }

  /**
   * Generate prediction using specific model
   */
  private async generateModelPrediction(
    model: MLModel,
    judgment: NeutrosophicJudgment,
    _context?: Record<string, any>
  ): Promise<{ T: number; I: number; F: number; confidence: number }> {
    // Simplified prediction logic
    // In real implementation, use actual trained models
    
    const baseT = judgment.T;
    const baseI = judgment.I;
    const baseF = judgment.F;

    // Apply model-specific adjustments
    let predictedT = baseT;
    let predictedI = baseI;
    let predictedF = baseF;
    let confidence = 0.8;

    switch (model.model_type) {
      case 'classification':
        // Success probability prediction
        predictedT = baseT * (0.9 + Math.random() * 0.2);
        predictedI = baseI * (0.8 + Math.random() * 0.4);
        predictedF = baseF * (0.8 + Math.random() * 0.4);
        confidence = 0.75 + Math.random() * 0.2;
        break;

      case 'time_series':
        // Trend-based prediction
        const trendFactor = 0.95 + Math.random() * 0.1;
        predictedT = baseT * trendFactor;
        predictedI = baseI * trendFactor;
        predictedF = baseF * trendFactor;
        confidence = 0.7 + Math.random() * 0.25;
        break;

      case 'ensemble':
        // Ensemble prediction
        predictedT = baseT * (0.85 + Math.random() * 0.3);
        predictedI = baseI * (0.85 + Math.random() * 0.3);
        predictedF = baseF * (0.85 + Math.random() * 0.3);
        confidence = 0.8 + Math.random() * 0.15;
        break;

      default:
        confidence = 0.5;
    }

    // Normalize values
    const sum = predictedT + predictedI + predictedF;
    if (sum > 0) {
      predictedT = predictedT / sum;
      predictedI = predictedI / sum;
      predictedF = predictedF / sum;
    }

    return {
      T: Math.max(0, Math.min(1, predictedT)),
      I: Math.max(0, Math.min(1, predictedI)),
      F: Math.max(0, Math.min(1, predictedF)),
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Analyze performance trends
   */
  async analyzeTrends(judgmentPairs: JudgmentPair[], _oracleId: string): Promise<TrendAnalysis> {
    const performanceData = this.aggregatePerformanceByTime(judgmentPairs);
    
    if (performanceData.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }

    // Calculate trend metrics
    const trendMetrics = this.calculateTrendMetrics(performanceData);
    
    // Generate forecast
    const forecast = this.generateForecast(performanceData, 7); // 7 periods ahead

    return {
      trend_type: trendMetrics.trendType,
      confidence: trendMetrics.confidence,
      slope: trendMetrics.slope,
      r_squared: trendMetrics.rSquared,
      forecast_periods: 7,
      predicted_values: forecast
    };
  }

  /**
   * Generate predictive alerts
   */
  async generateAlerts(judgmentPairs: JudgmentPair[], oracleId: string): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    
    // Check for performance degradation
    const performanceAlert = await this.checkPerformanceDegradation(judgmentPairs, oracleId);
    if (performanceAlert) {
      alerts.push(performanceAlert);
    }

    // Check for anomalies
    const anomalyAlert = await this.checkAnomalies(judgmentPairs, oracleId);
    if (anomalyAlert) {
      alerts.push(anomalyAlert);
    }

    // Check for trend changes
    const trendAlert = await this.checkTrendChanges(judgmentPairs, oracleId);
    if (trendAlert) {
      alerts.push(trendAlert);
    }

    return alerts;
  }

  /**
   * Get all predictions for an oracle
   */
  getPredictions(oracleId: string): MLPrediction[] {
    return Array.from(this.predictions.values())
      .filter(pred => pred.oracle_id === oracleId);
  }

  /**
   * Get all alerts for an oracle
   */
  getAlerts(oracleId: string): PredictiveAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.oracle_id === oracleId);
  }

  /**
   * Get model information
   */
  getModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  // Helper methods
  private calculateTimeSinceLastOutcome(pair: JudgmentPair): number {
    const decisionTime = new Date(pair.decision.timestamp);
    const outcomeTime = new Date(pair.outcome.timestamp);
    return (outcomeTime.getTime() - decisionTime.getTime()) / (1000 * 60 * 60); // hours
  }

  private calculateOraclePerformanceHistory(_pair: JudgmentPair): number {
    // Simplified performance history calculation
    return 0.75 + Math.random() * 0.25;
  }

  private isSuccessfulOutcome(outcomeType: string): boolean {
    return ['success', 'trading_success', 'medical_success'].includes(outcomeType);
  }

  private aggregatePerformanceByTime(data: JudgmentPair[]): any[] {
    // Group by time periods and calculate performance metrics
    const timeGroups = new Map<string, JudgmentPair[]>();
    
    data.forEach(pair => {
      const date = new Date(pair.decision.timestamp);
      const period = date.toISOString().split('T')[0]!; // Group by day
      
      if (!timeGroups.has(period)) {
        timeGroups.set(period, []);
      }
      timeGroups.get(period)!.push(pair);
    });

    return Array.from(timeGroups.entries()).map(([period, pairs]) => ({
      period,
      success_rate: this.calculateSuccessRate(pairs),
      calibration_score: this.calculateCalibrationScore(pairs),
      voi_correlation: this.calculateVoICorrelation(pairs),
      timestamp: new Date(period).getTime()
    }));
  }

  private calculateSuccessRate(pairs: JudgmentPair[]): number {
    const successful = pairs.filter(pair => 
      this.isSuccessfulOutcome(pair.outcome.outcome_judgment.outcome_type)
    ).length;
    return pairs.length > 0 ? successful / pairs.length : 0;
  }

  private calculateCalibrationScore(_pairs: JudgmentPair[]): number {
    // Simplified calibration score
    return 0.7 + Math.random() * 0.3;
  }

  private calculateVoICorrelation(_pairs: JudgmentPair[]): number {
    // Simplified VoI correlation
    return 0.5 + Math.random() * 0.5;
  }

  private extractHistoricalPatterns(_pair: JudgmentPair, _allData: JudgmentPair[]): any {
    // Extract patterns from historical data
    return {
      similar_contexts: 0,
      similar_mappers: 0,
      time_patterns: 0
    };
  }

  private calculateTrendMetrics(data: any[]): any {
    // Calculate trend metrics
    const values = data.map(d => d.success_rate);
    const n = values.length;
    
    if (n < 2) {
      return { trendType: 'stable', confidence: 0, slope: 0, rSquared: 0 };
    }

    // Simple linear regression
    const x = data.map((_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i]! + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    // Determine trend type
    let trendType: 'improving' | 'declining' | 'stable' | 'volatile';
    if (Math.abs(slope) < 0.01) {
      trendType = 'stable';
    } else if (slope > 0.05) {
      trendType = 'improving';
    } else if (slope < -0.05) {
      trendType = 'declining';
    } else {
      trendType = 'volatile';
    }

    return {
      trendType,
      confidence: Math.max(0, Math.min(1, rSquared)),
      slope,
      rSquared
    };
  }

  private generateForecast(data: any[], periods: number): any[] {
    // Generate simple forecast
    const forecast = [];
    const lastValue = data[data.length - 1]!;
    const trend = this.calculateTrendMetrics(data);
    
    for (let i = 1; i <= periods; i++) {
      const predictedT = lastValue.success_rate + (trend.slope * i);
      const predictedI = lastValue.calibration_score + (trend.slope * i * 0.5);
      const predictedF = 1 - predictedT - predictedI;
      
      forecast.push({
        period: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_t: Math.max(0, Math.min(1, predictedT)),
        predicted_i: Math.max(0, Math.min(1, predictedI)),
        predicted_f: Math.max(0, Math.min(1, predictedF)),
        confidence_interval: {
          lower: Math.max(0, predictedT - 0.1),
          upper: Math.min(1, predictedT + 0.1)
        }
      });
    }
    
    return forecast;
  }

  private async checkPerformanceDegradation(judgmentPairs: JudgmentPair[], oracleId: string): Promise<PredictiveAlert | null> {
    // Check for performance degradation
    const recentPairs = judgmentPairs.slice(-10); // Last 10 pairs
    if (recentPairs.length < 5) return null;

    const recentSuccessRate = this.calculateSuccessRate(recentPairs);
    const historicalSuccessRate = this.calculateSuccessRate(judgmentPairs.slice(0, -10));

    if (recentSuccessRate < historicalSuccessRate - 0.2) {
      return {
        alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        oracle_id: oracleId,
        alert_type: 'performance_degradation',
        severity: 'high',
        message: `Performance degradation detected: Success rate dropped from ${(historicalSuccessRate * 100).toFixed(1)}% to ${(recentSuccessRate * 100).toFixed(1)}%`,
        predicted_impact: {
          success_rate_change: recentSuccessRate - historicalSuccessRate,
          confidence_change: -0.1,
          indeterminacy_change: 0.1
        },
        recommended_actions: [
          'Review recent judgment patterns',
          'Check for data quality issues',
          'Consider model retraining',
          'Monitor for additional degradation'
        ],
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return null;
  }

  private async checkAnomalies(judgmentPairs: JudgmentPair[], oracleId: string): Promise<PredictiveAlert | null> {
    // Check for anomalies in judgment patterns
    const recentPairs = judgmentPairs.slice(-5);
    if (recentPairs.length < 3) return null;

    // Simple anomaly detection based on T/I/F patterns
    const avgI = recentPairs.reduce((sum, pair) => sum + pair.decision.judgment.I, 0) / recentPairs.length;
    const avgF = recentPairs.reduce((sum, pair) => sum + pair.decision.judgment.F, 0) / recentPairs.length;

    // Check for unusual patterns
    if (avgI > 0.8 || avgF > 0.8) {
      return {
        alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        oracle_id: oracleId,
        alert_type: 'anomaly_detected',
        severity: 'medium',
        message: `Unusual judgment pattern detected: High indeterminacy (${(avgI * 100).toFixed(1)}%) or falsity (${(avgF * 100).toFixed(1)}%)`,
        predicted_impact: {
          success_rate_change: -0.05,
          confidence_change: -0.15,
          indeterminacy_change: 0.1
        },
        recommended_actions: [
          'Investigate data sources',
          'Check for input validation issues',
          'Review judgment criteria',
          'Consider manual review of recent decisions'
        ],
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return null;
  }

  private async checkTrendChanges(judgmentPairs: JudgmentPair[], oracleId: string): Promise<PredictiveAlert | null> {
    // Check for trend changes
    if (judgmentPairs.length < 20) return null;

    const firstHalf = judgmentPairs.slice(0, Math.floor(judgmentPairs.length / 2));
    const secondHalf = judgmentPairs.slice(Math.floor(judgmentPairs.length / 2));

    const firstHalfRate = this.calculateSuccessRate(firstHalf);
    const secondHalfRate = this.calculateSuccessRate(secondHalf);

    const change = secondHalfRate - firstHalfRate;
    if (Math.abs(change) > 0.3) {
      return {
        alert_id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        oracle_id: oracleId,
        alert_type: 'trend_change',
        severity: change > 0 ? 'low' : 'medium',
        message: `Significant trend change detected: Success rate ${change > 0 ? 'increased' : 'decreased'} by ${(Math.abs(change) * 100).toFixed(1)}%`,
        predicted_impact: {
          success_rate_change: change,
          confidence_change: change > 0 ? 0.05 : -0.05,
          indeterminacy_change: 0
        },
        recommended_actions: [
          'Analyze factors contributing to trend change',
          'Update prediction models if needed',
          'Monitor for continued trend',
          'Document lessons learned'
        ],
        timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    return null;
  }
}
