/**
 * OpenTrust Protocol Oracle - Performance Dashboard
 * 
 * Real-time performance monitoring and visualization dashboard
 * for Oracle systems with analytics integration.
 * 
 * @version 3.0.0
 * @author OpenTrust Protocol Team
 */

import { EnhancedOracle } from '../oracle/EnhancedOracle';
import { OracleConfig } from '../types/index';

export interface DashboardMetrics {
  timestamp: string;
  oracles: OracleDashboardData[];
  global_metrics: {
    total_oracles: number;
    total_judgments: number;
    average_success_rate: number;
    system_health: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface OracleDashboardData {
  oracle_id: string;
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
  private oracles: Map<string, EnhancedOracle> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private metricsHistory: DashboardMetrics[] = [];

  constructor() {
    // Initialize dashboard
  }

  /**
   * Register an oracle with the dashboard
   */
  registerOracle(oracle: EnhancedOracle): void {
    this.oracles.set(oracle['config'].oracleId, oracle);
    console.log(`📊 Dashboard registered oracle: ${oracle['config'].oracleId}`);
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
    const oracles = Array.from(this.oracles.values());
    const oracleData: OracleDashboardData[] = [];

    for (const oracle of oracles) {
      try {
        const status = await oracle.getOracleStatus();
        const realTimeMetrics = await oracle.getRealTimeMetrics();

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

        oracleData.push({
          oracle_id: status.oracle_id,
          status: status.status,
          performance_grade: realTimeMetrics.performance_grade,
          success_rate: realTimeMetrics.success_rate,
          total_judgments: realTimeMetrics.total_judgments,
          last_activity: status.last_activity,
          trends,
          alerts
        });
      } catch (error: any) {
        console.warn(`Failed to get metrics for oracle: ${error.message}`);
      }
    }

    // Calculate global metrics
    const totalJudgments = oracleData.reduce((sum, oracle) => sum + oracle.total_judgments, 0);
    const averageSuccessRate = oracleData.length > 0 
      ? oracleData.reduce((sum, oracle) => sum + oracle.success_rate, 0) / oracleData.length 
      : 0;

    // Determine system health
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    const criticalOracles = oracleData.filter(o => o.status === 'critical').length;
    const warningOracles = oracleData.filter(o => o.status === 'warning').length;
    
    if (criticalOracles > 0) systemHealth = 'poor';
    else if (warningOracles > oracleData.length * 0.3) systemHealth = 'fair';
    else if (averageSuccessRate < 0.8) systemHealth = 'good';

    const metrics: DashboardMetrics = {
      timestamp: new Date().toISOString(),
      oracles: oracleData,
      global_metrics: {
        total_oracles: oracleData.length,
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
    oracle_count: number[];
  } {
    const history = this.getMetricsHistory();
    
    const trends = {
      timestamps: history.map(m => m.timestamp),
      success_rates: history.map(m => m.global_metrics.average_success_rate),
      total_judgments: history.map(m => m.global_metrics.total_judgments),
      oracle_count: history.map(m => m.global_metrics.total_oracles)
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

    // Analyze each oracle
    for (const oracle of currentMetrics.oracles) {
      const analysis: any = {
        oracle_id: oracle.oracle_id,
        status: oracle.status,
        performance_grade: oracle.performance_grade,
        success_rate: oracle.success_rate,
        alerts: oracle.alerts
      };

      // Generate recommendations
      if (oracle.status === 'critical') {
        recommendations.push(`Immediate attention required for oracle ${oracle.oracle_id}`);
      }
      if (oracle.success_rate < 0.6) {
        recommendations.push(`Review decision logic for oracle ${oracle.oracle_id}`);
      }
      if (oracle.alerts.length > 0) {
        recommendations.push(`Address alerts for oracle ${oracle.oracle_id}: ${oracle.alerts.join(', ')}`);
      }

      detailedAnalysis.push(analysis);
    }

    // Global recommendations
    if (currentMetrics.global_metrics.system_health === 'poor') {
      recommendations.push('System-wide performance review recommended');
    }
    if (currentMetrics.global_metrics.average_success_rate < 0.7) {
      recommendations.push('Consider updating oracle configurations or training data');
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
    oracles_config: any[];
  }> {
    const currentMetrics = await this.getCurrentMetrics();
    const history = this.getMetricsHistory();
    const trends = this.getPerformanceTrends();
    
    const oraclesConfig = Array.from(this.oracles.values()).map(oracle => ({
      oracle_id: oracle['config'].oracleId,
      version: oracle['config'].version,
      description: oracle['config'].description
    }));

    return {
      export_timestamp: new Date().toISOString(),
      current_metrics: currentMetrics,
      metrics_history: history,
      trends,
      oracles_config: oraclesConfig
    };
  }

  /**
   * Create a simple oracle for testing
   */
  static createTestOracle(oracleId: string, description?: string): EnhancedOracle {
    const config: OracleConfig = {
      oracleId,
      version: '3.0.0',
      description: description || `Test Oracle: ${oracleId}`
    };

    return new EnhancedOracle(config);
  }

  private async updateMetrics(): Promise<void> {
    // This method is called periodically to update metrics
    // The actual metrics are calculated in getCurrentMetrics()
    const metrics = await this.getCurrentMetrics();
    
    // Log summary for monitoring
    console.log(`📊 Dashboard Update: ${metrics.global_metrics.total_oracles} oracles, ` +
               `${metrics.global_metrics.total_judgments} judgments, ` +
               `${(metrics.global_metrics.average_success_rate * 100).toFixed(1)}% success rate`);
  }
}
