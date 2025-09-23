/**
 * OpenTrust Protocol Oracle - Analytics Engine Demo
 * 
 * Comprehensive demonstration of the Analytics Engine capabilities
 * including performance analysis, calibration metrics, and VoI calculations.
 */

const { 
  OTPAnalyticsEngine, 
  MemoryStorage, 
  createTradingOracle, 
  createMedicalOracle 
} = require('../dist/index.js');

// Define OutcomeType locally since it's not exported in the simplified version
const OutcomeType = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  TRADING_SUCCESS: 'trading_success',
  TRADING_FAILURE: 'trading_failure',
  MEDICAL_SUCCESS: 'medical_success',
  MEDICAL_FAILURE: 'medical_failure'
};

async function analyticsDemo() {
  console.log('🚀 OpenTrust Protocol Oracle - Analytics Engine Demo\n');

  // Initialize components
  const analyticsEngine = new OTPAnalyticsEngine();
  const storage = new MemoryStorage();
  const tradingOracle = createTradingOracle('demo-trading-oracle');
  const medicalOracle = createMedicalOracle('demo-medical-oracle');

  console.log('📊 Phase 1: Recording Sample Outcomes\n');

  // Record trading outcomes
  const tradingOutcomes = [
    { judgmentId: 'trade-1', pair: 'BTC/USDT', profit: 500 },
    { judgmentId: 'trade-2', pair: 'ETH/USDT', profit: -200 },
    { judgmentId: 'trade-3', pair: 'ADA/USDT', profit: 300 },
    { judgmentId: 'trade-4', pair: 'DOT/USDT', profit: -150 },
    { judgmentId: 'trade-5', pair: 'LINK/USDT', profit: 800 }
  ];

  for (const outcome of tradingOutcomes) {
    await tradingOracle.recordTrade(outcome.judgmentId, outcome.pair, outcome.profit);
  }

  // Record medical outcomes
  const medicalOutcomes = [
    { judgmentId: 'treatment-1', condition: 'hypertension', success: true },
    { judgmentId: 'treatment-2', condition: 'diabetes', success: false },
    { judgmentId: 'treatment-3', condition: 'allergy', success: true },
    { judgmentId: 'treatment-4', condition: 'infection', success: true },
    { judgmentId: 'treatment-5', condition: 'chronic-pain', success: false }
  ];

  for (const outcome of medicalOutcomes) {
    await medicalOracle.recordTreatment(outcome.judgmentId, outcome.condition, outcome.success);
  }

  console.log('✅ Recorded 10 sample outcomes (5 trading + 5 medical)\n');

  console.log('📈 Phase 2: Analytics Engine Analysis\n');

  // Create sample judgment pairs for analysis
  const samplePairs = [
    // Trading pairs
    {
      decision: {
        judgment_id: 'trade-1',
        judgment: { t: 0.8, i: 0.1, f: 0.1, provenance_chain: [] },
        timestamp: new Date().toISOString(),
        context: { pair: 'BTC/USDT' },
        mapper_id: 'trading-mapper'
      },
      outcome: {
        judgment_id: 'outcome-trade-1',
        outcome_judgment: {
          t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
          links_to_judgment_id: 'trade-1',
          outcome_type: OutcomeType.TRADING_SUCCESS
        },
        timestamp: new Date().toISOString(),
        oracle_source: 'demo-trading-oracle'
      }
    },
    {
      decision: {
        judgment_id: 'trade-2',
        judgment: { t: 0.6, i: 0.2, f: 0.2, provenance_chain: [] },
        timestamp: new Date().toISOString(),
        context: { pair: 'ETH/USDT' },
        mapper_id: 'trading-mapper'
      },
      outcome: {
        judgment_id: 'outcome-trade-2',
        outcome_judgment: {
          t: 0.0, i: 0.0, f: 1.0, provenance_chain: [],
          links_to_judgment_id: 'trade-2',
          outcome_type: OutcomeType.TRADING_FAILURE
        },
        timestamp: new Date().toISOString(),
        oracle_source: 'demo-trading-oracle'
      }
    },
    // Medical pairs
    {
      decision: {
        judgment_id: 'treatment-1',
        judgment: { t: 0.9, i: 0.05, f: 0.05, provenance_chain: [] },
        timestamp: new Date().toISOString(),
        context: { condition: 'hypertension' },
        mapper_id: 'medical-mapper'
      },
      outcome: {
        judgment_id: 'outcome-treatment-1',
        outcome_judgment: {
          t: 1.0, i: 0.0, f: 0.0, provenance_chain: [],
          links_to_judgment_id: 'treatment-1',
          outcome_type: OutcomeType.MEDICAL_SUCCESS
        },
        timestamp: new Date().toISOString(),
        oracle_source: 'demo-medical-oracle'
      }
    },
    {
      decision: {
        judgment_id: 'treatment-2',
        judgment: { t: 0.7, i: 0.15, f: 0.15, provenance_chain: [] },
        timestamp: new Date().toISOString(),
        context: { condition: 'diabetes' },
        mapper_id: 'medical-mapper'
      },
      outcome: {
        judgment_id: 'outcome-treatment-2',
        outcome_judgment: {
          t: 0.0, i: 0.0, f: 1.0, provenance_chain: [],
          links_to_judgment_id: 'treatment-2',
          outcome_type: OutcomeType.MEDICAL_FAILURE
        },
        timestamp: new Date().toISOString(),
        oracle_source: 'demo-medical-oracle'
      }
    }
  ];

  // Store pairs in storage
  for (const pair of samplePairs) {
    await storage.savePair(pair);
  }

  console.log('💾 Stored 4 judgment pairs in memory storage\n');

  // Analyze trading oracle performance
  try {
    const tradingAnalysis = await analyticsEngine.analyzePerformance('demo-trading-oracle', samplePairs);
    console.log('📊 Trading Oracle Performance Analysis:');
    console.log(`   • Oracle ID: ${tradingAnalysis.oracle_id}`);
    console.log(`   • Total Judgments: ${tradingAnalysis.total_judgments}`);
    console.log(`   • Success Rate: ${(tradingAnalysis.success_rate * 100).toFixed(1)}%`);
    console.log(`   • Performance Grade: ${tradingAnalysis.performance_grade}`);
    console.log(`   • Calibration Score: ${(tradingAnalysis.overall_calibration_score * 100).toFixed(1)}%`);
    console.log(`   • Value of Indeterminacy: ${(tradingAnalysis.value_of_indeterminacy * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`❌ Trading Oracle Analysis Error: ${error.message}\n`);
  }

  // Analyze medical oracle performance
  try {
    const medicalAnalysis = await analyticsEngine.analyzePerformance('demo-medical-oracle', samplePairs);
    console.log('🏥 Medical Oracle Performance Analysis:');
    console.log(`   • Oracle ID: ${medicalAnalysis.oracle_id}`);
    console.log(`   • Total Judgments: ${medicalAnalysis.total_judgments}`);
    console.log(`   • Success Rate: ${(medicalAnalysis.success_rate * 100).toFixed(1)}%`);
    console.log(`   • Performance Grade: ${medicalAnalysis.performance_grade}`);
    console.log(`   • Calibration Score: ${(medicalAnalysis.overall_calibration_score * 100).toFixed(1)}%`);
    console.log(`   • Value of Indeterminacy: ${(medicalAnalysis.value_of_indeterminacy * 100).toFixed(1)}%\n`);
  } catch (error) {
    console.log(`❌ Medical Oracle Analysis Error: ${error.message}\n`);
  }

  console.log('🔬 Phase 3: Detailed Metrics Analysis\n');

  // Calibration analysis
  try {
    const calibration = await analyticsEngine.calculateCalibration(samplePairs);
    console.log('📏 Calibration Metrics:');
    console.log(`   • Overall Calibration Score: ${(calibration.overall_calibration_score * 100).toFixed(1)}%`);
    console.log(`   • Sample Size: ${calibration.sample_size}`);
    console.log(`   • Calibration Error: ${(calibration.calibration_error * 100).toFixed(1)}%`);
    console.log(`   • Reliability Points: ${calibration.reliability_points.length}`);
    console.log(`   • Confidence Intervals: ${calibration.confidence_intervals.length}\n`);
  } catch (error) {
    console.log(`❌ Calibration Analysis Error: ${error.message}\n`);
  }

  // VoI analysis
  try {
    const voi = await analyticsEngine.calculateVoI(samplePairs);
    console.log('🎯 Value of Indeterminacy (VoI) Analysis:');
    console.log(`   • Average VoI Contribution: ${(voi.average_voi_contribution * 100).toFixed(1)}%`);
    console.log(`   • Indeterminacy Correlation: ${(voi.indeterminacy_correlation * 100).toFixed(1)}%`);
    console.log(`   • Optimal Indeterminacy Range: ${(voi.optimal_indeterminacy_range.min * 100).toFixed(1)}% - ${(voi.optimal_indeterminacy_range.max * 100).toFixed(1)}%`);
    console.log(`   • VoI by Confidence Levels: ${voi.voi_by_confidence.length} bins`);
    console.log(`   • Mapper VoI Contributions: ${Object.keys(voi.mapper_voi).length} mappers\n`);
  } catch (error) {
    console.log(`❌ VoI Analysis Error: ${error.message}\n`);
  }

  console.log('📊 Phase 4: Storage Statistics\n');

  const stats = await storage.getStorageStats();
  console.log('💾 Memory Storage Statistics:');
  console.log(`   • Total Pairs: ${stats.totalPairs}`);
  console.log(`   • Oracle Count: ${stats.oracleCount}`);
  console.log(`   • Timestamp Count: ${stats.timestampCount}`);
  console.log(`   • Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);
  if (stats.oldestTimestamp) {
    console.log(`   • Oldest Record: ${stats.oldestTimestamp.toISOString()}`);
  }
  if (stats.newestTimestamp) {
    console.log(`   • Newest Record: ${stats.newestTimestamp.toISOString()}`);
  }

  console.log('\n🎉 Analytics Engine Demo Completed Successfully!');
  console.log('\n📚 Key Features Demonstrated:');
  console.log('   ✅ Performance Analysis with grading (A+ to D)');
  console.log('   ✅ Calibration metrics and reliability analysis');
  console.log('   ✅ Value of Indeterminacy (VoI) calculations');
  console.log('   ✅ Success rate calculations');
  console.log('   ✅ Memory storage with indexing');
  console.log('   ✅ Multi-oracle support (Trading & Medical)');
  console.log('   ✅ Comprehensive error handling');
}

// Run the demo
analyticsDemo().catch(console.error);
