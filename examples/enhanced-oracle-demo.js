/**
 * OpenTrust Protocol Oracle - Enhanced Oracle + Dashboard Demo
 * 
 * Comprehensive demonstration of the integrated Oracle system with
 * Analytics Engine and Performance Dashboard.
 */

const { 
  EnhancedOracle, 
  PerformanceDashboard,
  MemoryStorage,
  OutcomeType 
} = require('../dist/index.js');

async function enhancedOracleDemo() {
  console.log('🚀 OpenTrust Protocol Oracle - Enhanced System Demo\n');

  // Initialize components
  const dashboard = new PerformanceDashboard();
  const storage = new MemoryStorage();

  // Create enhanced oracles
  const tradingOracle = new EnhancedOracle({
    oracleId: 'enhanced-trading-oracle',
    version: '3.0.0',
    description: 'Enhanced Trading Oracle with Analytics'
  }, storage);

  const medicalOracle = new EnhancedOracle({
    oracleId: 'enhanced-medical-oracle',
    version: '3.0.0',
    description: 'Enhanced Medical Oracle with Analytics'
  }, storage);

  // Register oracles with dashboard
  dashboard.registerOracle(tradingOracle);
  dashboard.registerOracle(medicalOracle);

  console.log('📊 Phase 1: Recording Enhanced Outcomes\n');

  // Record trading outcomes with enhanced analytics
  const tradingDecisions = [
    {
      decision: {
        judgment_id: 'enhanced-trade-1',
        t: 0.9, i: 0.05, f: 0.05,
        provenance_chain: [{ source_id: 'trading-mapper', timestamp: new Date().toISOString(), description: 'BTC/USDT analysis' }]
      },
      outcome: {
        judgment_id: 'enhanced-outcome-1',
        links_to_judgment_id: 'enhanced-trade-1',
        t: 1.0, i: 0.0, f: 0.0,
        outcome_type: OutcomeType.TRADING_SUCCESS,
        provenance_chain: []
      },
      context: { pair: 'BTC/USDT', profit: 500 }
    },
    {
      decision: {
        judgment_id: 'enhanced-trade-2',
        t: 0.6, i: 0.2, f: 0.2,
        provenance_chain: [{ source_id: 'trading-mapper', timestamp: new Date().toISOString(), description: 'ETH/USDT analysis' }]
      },
      outcome: {
        judgment_id: 'enhanced-outcome-2',
        links_to_judgment_id: 'enhanced-trade-2',
        t: 0.0, i: 0.0, f: 1.0,
        outcome_type: OutcomeType.TRADING_FAILURE,
        provenance_chain: []
      },
      context: { pair: 'ETH/USDT', loss: 200 }
    }
  ];

  for (const { decision, outcome, context } of tradingDecisions) {
    await tradingOracle.recordOutcome(decision, outcome, context);
  }

  // Record medical outcomes with enhanced analytics
  const medicalDecisions = [
    {
      decision: {
        judgment_id: 'enhanced-treatment-1',
        t: 0.85, i: 0.1, f: 0.05,
        provenance_chain: [{ source_id: 'medical-mapper', timestamp: new Date().toISOString(), description: 'Hypertension treatment' }]
      },
      outcome: {
        judgment_id: 'enhanced-medical-outcome-1',
        links_to_judgment_id: 'enhanced-treatment-1',
        t: 1.0, i: 0.0, f: 0.0,
        outcome_type: OutcomeType.MEDICAL_SUCCESS,
        provenance_chain: []
      },
      context: { condition: 'hypertension', recovery_time: 14 }
    },
    {
      decision: {
        judgment_id: 'enhanced-treatment-2',
        t: 0.7, i: 0.15, f: 0.15,
        provenance_chain: [{ source_id: 'medical-mapper', timestamp: new Date().toISOString(), description: 'Diabetes treatment' }]
      },
      outcome: {
        judgment_id: 'enhanced-medical-outcome-2',
        links_to_judgment_id: 'enhanced-treatment-2',
        t: 0.0, i: 0.0, f: 1.0,
        outcome_type: OutcomeType.MEDICAL_FAILURE,
        provenance_chain: []
      },
      context: { condition: 'diabetes', complications: ['nausea'] }
    }
  ];

  for (const { decision, outcome, context } of medicalDecisions) {
    await medicalOracle.recordOutcome(decision, outcome, context);
  }

  console.log('✅ Recorded 4 enhanced outcomes with analytics integration\n');

  console.log('📈 Phase 2: Enhanced Oracle Analytics\n');

  // Get real-time metrics from trading oracle
  const tradingMetrics = await tradingOracle.getRealTimeMetrics();
  console.log('💰 Enhanced Trading Oracle Metrics:');
  console.log(`   • Oracle ID: ${tradingMetrics.oracle_id}`);
  console.log(`   • Total Judgments: ${tradingMetrics.total_judgments}`);
  console.log(`   • Success Rate: ${(tradingMetrics.success_rate * 100).toFixed(1)}%`);
  console.log(`   • Average Confidence: ${(tradingMetrics.average_confidence * 100).toFixed(1)}%`);
  console.log(`   • Average Indeterminacy: ${(tradingMetrics.average_indeterminacy * 100).toFixed(1)}%`);
  console.log(`   • Performance Grade: ${tradingMetrics.performance_grade}`);
  console.log(`   • Last Updated: ${tradingMetrics.last_updated}\n`);

  // Get real-time metrics from medical oracle
  const medicalMetrics = await medicalOracle.getRealTimeMetrics();
  console.log('🏥 Enhanced Medical Oracle Metrics:');
  console.log(`   • Oracle ID: ${medicalMetrics.oracle_id}`);
  console.log(`   • Total Judgments: ${medicalMetrics.total_judgments}`);
  console.log(`   • Success Rate: ${(medicalMetrics.success_rate * 100).toFixed(1)}%`);
  console.log(`   • Average Confidence: ${(medicalMetrics.average_confidence * 100).toFixed(1)}%`);
  console.log(`   • Average Indeterminacy: ${(medicalMetrics.average_indeterminacy * 100).toFixed(1)}%`);
  console.log(`   • Performance Grade: ${medicalMetrics.performance_grade}`);
  console.log(`   • Last Updated: ${medicalMetrics.last_updated}\n`);

  console.log('🔍 Phase 3: Oracle Status & Health Monitoring\n');

  // Get detailed oracle status
  const tradingStatus = await tradingOracle.getOracleStatus();
  console.log('💰 Trading Oracle Status:');
  console.log(`   • Status: ${tradingStatus.status}`);
  console.log(`   • Version: ${tradingStatus.version}`);
  console.log(`   • Uptime: ${tradingStatus.uptime.toFixed(2)} seconds`);
  console.log(`   • Last Activity: ${tradingStatus.last_activity}`);
  console.log(`   • Performance Indicators:`);
  console.log(`     - Success Rate: ${(tradingStatus.performance_indicators.success_rate * 100).toFixed(1)}%`);
  console.log(`     - Confidence Trend: ${tradingStatus.performance_indicators.confidence_trend}`);
  console.log(`     - Indeterminacy Trend: ${tradingStatus.performance_indicators.indeterminacy_trend}`);
  console.log(`     - Calibration Quality: ${tradingStatus.performance_indicators.calibration_quality}\n`);

  const medicalStatus = await medicalOracle.getOracleStatus();
  console.log('🏥 Medical Oracle Status:');
  console.log(`   • Status: ${medicalStatus.status}`);
  console.log(`   • Version: ${medicalStatus.version}`);
  console.log(`   • Uptime: ${medicalStatus.uptime.toFixed(2)} seconds`);
  console.log(`   • Last Activity: ${medicalStatus.last_activity}`);
  console.log(`   • Performance Indicators:`);
  console.log(`     - Success Rate: ${(medicalStatus.performance_indicators.success_rate * 100).toFixed(1)}%`);
  console.log(`     - Confidence Trend: ${medicalStatus.performance_indicators.confidence_trend}`);
  console.log(`     - Indeterminacy Trend: ${medicalStatus.performance_indicators.indeterminacy_trend}`);
  console.log(`     - Calibration Quality: ${medicalStatus.performance_indicators.calibration_quality}\n`);

  console.log('📊 Phase 4: Performance Dashboard Analytics\n');

  // Get dashboard metrics
  const dashboardMetrics = await dashboard.getCurrentMetrics();
  console.log('📈 Global Dashboard Metrics:');
  console.log(`   • Timestamp: ${dashboardMetrics.timestamp}`);
  console.log(`   • Total Oracles: ${dashboardMetrics.global_metrics.total_oracles}`);
  console.log(`   • Total Judgments: ${dashboardMetrics.global_metrics.total_judgments}`);
  console.log(`   • Average Success Rate: ${(dashboardMetrics.global_metrics.average_success_rate * 100).toFixed(1)}%`);
  console.log(`   • System Health: ${dashboardMetrics.global_metrics.system_health}\n`);

  console.log('🔍 Individual Oracle Dashboard Data:');
  for (const oracle of dashboardMetrics.oracles) {
    console.log(`   📊 ${oracle.oracle_id}:`);
    console.log(`     - Status: ${oracle.status}`);
    console.log(`     - Performance Grade: ${oracle.performance_grade}`);
    console.log(`     - Success Rate: ${(oracle.success_rate * 100).toFixed(1)}%`);
    console.log(`     - Total Judgments: ${oracle.total_judgments}`);
    console.log(`     - Last Activity: ${oracle.last_activity}`);
    console.log(`     - Trends: Success ${oracle.trends.success_rate_trend}, Confidence ${oracle.trends.confidence_trend}`);
    if (oracle.alerts.length > 0) {
      console.log(`     - Alerts: ${oracle.alerts.join(', ')}`);
    }
    console.log('');
  }

  console.log('📋 Phase 5: Performance Report Generation\n');

  // Generate comprehensive performance report
  const report = await dashboard.generateReport();
  console.log('📊 Performance Report:');
  console.log(`   • Report Timestamp: ${report.report_timestamp}`);
  console.log(`   • System Health: ${report.summary.global_metrics.system_health}`);
  console.log(`   • Total Oracles: ${report.summary.global_metrics.total_oracles}`);
  console.log(`   • Total Judgments: ${report.summary.global_metrics.total_judgments}`);
  console.log(`   • Average Success Rate: ${(report.summary.global_metrics.average_success_rate * 100).toFixed(1)}%\n`);

  console.log('📈 Detailed Analysis:');
  for (const analysis of report.detailed_analysis) {
    console.log(`   • ${analysis.oracle_id}: ${analysis.status} (${analysis.performance_grade})`);
    console.log(`     - Success Rate: ${(analysis.success_rate * 100).toFixed(1)}%`);
    if (analysis.alerts.length > 0) {
      console.log(`     - Alerts: ${analysis.alerts.join(', ')}`);
    }
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    for (const recommendation of report.recommendations) {
      console.log(`   • ${recommendation}`);
    }
  }

  console.log('\n📤 Phase 6: Data Export & Backup\n');

  // Export trading oracle data
  const tradingExport = await tradingOracle.exportData();
  console.log('💰 Trading Oracle Export:');
  console.log(`   • Oracle Config: ${tradingExport.oracle_config.oracleId}`);
  console.log(`   • Judgment Pairs: ${tradingExport.judgment_pairs.length}`);
  console.log(`   • Export Timestamp: ${tradingExport.export_timestamp}`);
  console.log(`   • Analytics Summary: ${tradingExport.analytics_summary ? 'Available' : 'N/A'}\n`);

  // Export dashboard data
  const dashboardExport = await dashboard.exportDashboardData();
  console.log('📊 Dashboard Export:');
  console.log(`   • Current Metrics: Available`);
  console.log(`   • Metrics History: ${dashboardExport.metrics_history.length} entries`);
  console.log(`   • Trends Data: Available`);
  console.log(`   • Oracles Config: ${dashboardExport.oracles_config.length} oracles`);
  console.log(`   • Export Timestamp: ${dashboardExport.export_timestamp}\n`);

  console.log('🎉 Enhanced Oracle System Demo Completed Successfully!');
  console.log('\n📚 Key Features Demonstrated:');
  console.log('   ✅ Enhanced Oracle with Analytics Integration');
  console.log('   ✅ Real-time Performance Metrics');
  console.log('   ✅ Oracle Status & Health Monitoring');
  console.log('   ✅ Performance Dashboard with Global Metrics');
  console.log('   ✅ Comprehensive Performance Reports');
  console.log('   ✅ Data Export & Backup Capabilities');
  console.log('   ✅ Multi-Oracle Management');
  console.log('   ✅ Trend Analysis & Recommendations');
  console.log('   ✅ System Health Assessment');
  console.log('   ✅ End-to-End Integration Testing');
}

// Run the demo
enhancedOracleDemo().catch(console.error);
