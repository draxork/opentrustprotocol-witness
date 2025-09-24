/**
 * OpenTrust Protocol Witness - Performance Dashboard
 * 
 * Real-time performance monitoring and visualization dashboard
 * for Witness systems with analytics integration.
 * 
 * @version 3.0.0
 * @author OpenTrust Protocol Team
 */

import { EnhancedWitness } from '../witness/EnhancedWitness';
import { WitnessConfig } from '../types/index';

export interface DashboardMetrics {
  timestamp: string;
  witnesss: WitnessDashboardData[];
  global_metrics: {
    total_witnesss: number;
    total_judgments: number;
    average_success_rate: number;
    system_health: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface WitnessDashboardData {
  witness_id: string;
  status: 'healthy' | 'warning' | 'critical';
  performance_grade: string;
  success_rate: number;
  total_judgments: number;
  last_activity: string;
  trends: {
    success_rate_trend: 'up' | 'stable' | 'down';
    confidence_trend: 'up' | 'stable' | 'down';
    activity_trend: 'up' | 'stable' | 'down';
  };
  alerts: string[];
}

export class PerformanceDashboard {
  private witnesss: Map<string, EnhancedWitness> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private metricsHistory: DashboardMetrics[] = [];

  constructor() {
    // Initialize dashboard
  }

  /**
   * Register an witness with the dashboard
   */
  registerWitness(witness: EnhancedWitness): void {
    this.witnesss.set(witness['config'].witnessId, witness);
    console.log(`📊 Dashboard registered witness: ${witness['config'].witnessId}`);
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error: any) {
        console.error('Dashboard update failed:', error.message);
      }
    }, intervalMs);

    console.log(`🔄 Dashboard monitoring started (${intervalMs}ms interval)`);
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏹️ Dashboard monitoring stopped');
    }
  }

  /**
   * Get current dashboard metrics
   */
  async getCurrentMetrics(): Promise<DashboardMetrics> {
    const witnesss = Array.from(this.witnesss.values());
    const witnessData: WitnessDashboardData[] = [];

    for (const witness of witnesss) {
      try {
        const status = await witness.getWitnessStatus();
        const realTimeMetrics = await witness.getRealTimeMetrics();

        // Calculate trends (simplified)
        const trends = {
          success_rate_trend: 'stable' as const,
          confidence_trend: status.performance_indicators.confidence_trend === 'increasing' ? 'up' as const : 
                           status.performance_indicators.confidence_trend === 'decreasing' ? 'down' as const : 'stable' as const,
          activity_trend: 'stable' as const
        };

        // Generate alerts
        const alerts: string[] = [];
        if (status.status === 'critical') {
          alerts.push('Critical performance issue detected');
        }
        if (realTimeMetrics.success_rate < 0.5) {
          alerts.push('Low success rate warning');
        }
        if (status.performance_indicators.calibration_quality === 'poor') {
          alerts.push('Poor calibration quality');
        }

        witnessData.push({
          witness_id: status.witness_id,
          status: status.status,
          performance_grade: realTimeMetrics.performance_grade,
          success_rate: realTimeMetrics.success_rate,
          total_judgments: realTimeMetrics.total_judgments,
          last_activity: status.last_activity,
          trends,
          alerts
        });
      } catch (error: any) {
        console.warn(`Failed to get metrics for witness: ${error.message}`);
      }
    }

    // Calculate global metrics
    const totalJudgments = witnessData.reduce((sum, witness) => sum + witness.total_judgments, 0);
    const averageSuccessRate = witnessData.length > 0 
      ? witnessData.reduce((sum, witness) => sum + witness.success_rate, 0) / witnessData.length 
      : 0;

    // Determine system health
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    const criticalWitnesss = witnessData.filter(o => o.status === 'critical').length;
    const warningWitnesss = witnessData.filter(o => o.status === 'warning').length;
    
    if (criticalWitnesss > 0) systemHealth = 'poor';
    else if (warningWitnesss > witnessData.length * 0.3) systemHealth = 'fair';
    else if (averageSuccessRate < 0.8) systemHealth = 'good';

    const metrics: DashboardMetrics = {
      timestamp: new Date().toISOString(),
      witnesss: witnessData,
      global_metrics: {
        total_witnesss: witnessData.length,
        total_judgments: totalJudgments,
        average_success_rate: averageSuccessRate,
        system_health: systemHealth
      }
    };

    // Store in history (keep last 100 entries)
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 50): DashboardMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(): {
    timestamps: string[];
    success_rates: number[];
    total_judgments: number[];
    witness_count: number[];
  } {
    const history = this.getMetricsHistory();
    
    const trends = {
      timestamps: history.map(m => m.timestamp),
      success_rates: history.map(m => m.global_metrics.average_success_rate),
      total_judgments: history.map(m => m.global_metrics.total_judgments),
      witness_count: history.map(m => m.global_metrics.total_witnesss)
    };
    
    return trends;
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<{
    report_timestamp: string;
    summary: DashboardMetrics;
    detailed_analysis: any[];
    recommendations: string[];
  }> {
    const currentMetrics = await this.getCurrentMetrics();
    // Get trends for potential future use
    this.getPerformanceTrends();
    
    const detailedAnalysis = [];
    const recommendations: string[] = [];

    // Analyze each witness
    for (const witness of currentMetrics.witnesss) {
      const analysis: any = {
        witness_id: witness.witness_id,
        status: witness.status,
        performance_grade: witness.performance_grade,
        success_rate: witness.success_rate,
        alerts: witness.alerts
      };

      // Generate recommendations
      if (witness.status === 'critical') {
        recommendations.push(`Immediate attention required for witness ${witness.witness_id}`);
      }
      if (witness.success_rate < 0.6) {
        recommendations.push(`Review decision logic for witness ${witness.witness_id}`);
      }
      if (witness.alerts.length > 0) {
        recommendations.push(`Address alerts for witness ${witness.witness_id}: ${witness.alerts.join(', ')}`);
      }

      detailedAnalysis.push(analysis);
    }

    // Global recommendations
    if (currentMetrics.global_metrics.system_health === 'poor') {
      recommendations.push('System-wide performance review recommended');
    }
    if (currentMetrics.global_metrics.average_success_rate < 0.7) {
      recommendations.push('Consider updating witness configurations or training data');
    }

    return {
      report_timestamp: new Date().toISOString(),
      summary: currentMetrics,
      detailed_analysis: detailedAnalysis,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Export dashboard data
   */
  async exportDashboardData(): Promise<{
    export_timestamp: string;
    current_metrics: DashboardMetrics;
    metrics_history: DashboardMetrics[];
    trends: any;
    witnesss_config: any[];
  }> {
    const currentMetrics = await this.getCurrentMetrics();
    const history = this.getMetricsHistory();
    const trends = this.getPerformanceTrends();
    
    const witnesssConfig = Array.from(this.witnesss.values()).map(witness => ({
      witness_id: witness['config'].witnessId,
      version: witness['config'].version,
      description: witness['config'].description
    }));

    return {
      export_timestamp: new Date().toISOString(),
      current_metrics: currentMetrics,
      metrics_history: history,
      trends,
      witnesss_config: witnesssConfig
    };
  }

  /**
   * Create a simple witness for testing
   */
  static createTestWitness(witnessId: string, description?: string): EnhancedWitness {
    const config: WitnessConfig = {
      witnessId,
      version: '3.0.0',
      description: description || `Test Witness: ${witnessId}`
    };

    return new EnhancedWitness(config);
  }

  private async updateMetrics(): Promise<void> {
    // This method is called periodically to update metrics
    // The actual metrics are calculated in getCurrentMetrics()
    const metrics = await this.getCurrentMetrics();
    
    // Log summary for monitoring
    console.log(`📊 Dashboard Update: ${metrics.global_metrics.total_witnesss} witnesss, ` +
               `${metrics.global_metrics.total_judgments} judgments, ` +
               `${(metrics.global_metrics.average_success_rate * 100).toFixed(1)}% success rate`);
  }
}
