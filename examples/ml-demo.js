/**
 * OpenTrust Protocol Oracle - ML Predictive Engine Demo
 * 
 * Comprehensive demonstration of Machine Learning capabilities
 * including predictions, trend analysis, and alert generation.
 */

const { 
  MLPredictiveEngine, 
  MemoryStorage, 
  createTradingOracle, 
  createMedicalOracle 
} = require('../dist/index.js');

// Define OutcomeType locally
const OutcomeType = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  TRADING_SUCCESS: 'trading_success',
  TRADING_FAILURE: 'trading_failure',
  MEDICAL_SUCCESS: 'medical_success',
  MEDICAL_FAILURE: 'medical_failure'
};

async function mlDemo() {
  console.log('🧠 OpenTrust Protocol Oracle - ML Predictive Engine Demo\n');

  // Initialize components
  const mlEngine = new MLPredictiveEngine();
  const storage = new MemoryStorage();
  const tradingOracle = createTradingOracle('ml-demo-trading-oracle');
  const medicalOracle = createMedicalOracle('ml-demo-medical-oracle');

  console.log('📊 Phase 1: Recording Historical Data for ML Training\n');

  // Record historical trading outcomes
  const historicalTradingData = [
    { judgmentId: 'trade-hist-1', pair: 'BTC/USDT', profit: 800 },
    { judgmentId: 'trade-hist-2', pair: 'ETH/USDT', profit: -150 },
    { judgmentId: 'trade-hist-3', pair: 'ADA/USDT', profit: 300 },
    { judgmentId: 'trade-hist-4', pair: 'DOT/USDT', profit: -200 },
    { judgmentId: 'trade-hist-5', pair: 'LINK/USDT', profit: 600 },
    { judgmentId: 'trade-hist-6', pair: 'BTC/USDT', profit: 400 },
    { judgmentId: 'trade-hist-7', pair: 'ETH/USDT', profit: -100 },
    { judgmentId: 'trade-hist-8', pair: 'ADA/USDT', profit: 250 },
    { judgmentId: 'trade-hist-9', pair: 'DOT/USDT', profit: 350 },
    { judgmentId: 'trade-hist-10', pair: 'LINK/USDT', profit: -50 }
  ];

  for (const data of historicalTradingData) {
    await tradingOracle.recordTrade(data.judgmentId, data.pair, data.profit);
  }

  // Record historical medical outcomes
  const historicalMedicalData = [
    { judgmentId: 'treatment-hist-1', condition: 'hypertension', success: true },
    { judgmentId: 'treatment-hist-2', condition: 'diabetes', success: false },
    { judgmentId: 'treatment-hist-3', condition: 'allergy', success: true },
    { judgmentId: 'treatment-hist-4', condition: 'infection', success: true },
    { judgmentId: 'treatment-hist-5', condition: 'chronic-pain', success: false },
    { judgmentId: 'treatment-hist-6', condition: 'hypertension', success: true },
    { judgmentId: 'treatment-hist-7', condition: 'diabetes', success: true },
    { judgmentId: 'treatment-hist-8', condition: 'allergy', success: false },
    { judgmentId: 'treatment-hist-9', condition: 'infection', success: true },
    { judgmentId: 'treatment-hist-10', condition: 'chronic-pain', success: true }
  ];

  for (const data of historicalMedicalData) {
    await medicalOracle.recordTreatment(data.judgmentId, data.condition, data.success);
  }

  console.log('✅ Recorded 20 historical outcomes (10 trading + 10 medical)\n');

  console.log('🧠 Phase 2: ML Model Training\n');

  // Create sample judgment pairs for ML training
  const samplePairs = [
    // Trading pairs
    {
      decision: {
        judgment_id: 'trade-hist-1',
        judgment: { T: 0.8, I: 0.1, F: 0.1, provenance_chain: [] },
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        context: { pair: 'BTC/USDT' },
        mapper_id: 'trading-mapper'
      },
      outcome: {
        judgment_id: 'outcome-trade-hist-1',
        outcome_judgment: {
          T: 1.0, I: 0.0, F: 0.0, provenance_chain: [],
          links_to_judgment_id: 'trade-hist-1',
          outcome_type: OutcomeType.TRADING_SUCCESS
        },
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        oracle_source: 'ml-demo-trading-oracle'
      }
    },
    {
      decision: {
        judgment_id: 'trade-hist-2',
        judgment: { T: 0.6, I: 0.2, F: 0.2, provenance_chain: [] },
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        context: { pair: 'ETH/USDT' },
        mapper_id: 'trading-mapper'
      },
      outcome: {
        judgment_id: 'outcome-trade-hist-2',
        outcome_judgment: {
          T: 0.0, I: 0.0, F: 1.0, provenance_chain: [],
          links_to_judgment_id: 'trade-hist-2',
          outcome_type: OutcomeType.TRADING_FAILURE
        },
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        oracle_source: 'ml-demo-trading-oracle'
      }
    },
    // Medical pairs
    {
      decision: {
        judgment_id: 'treatment-hist-1',
        judgment: { T: 0.9, I: 0.05, F: 0.05, provenance_chain: [] },
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        context: { condition: 'hypertension' },
        mapper_id: 'medical-mapper'
      },
      outcome: {
        judgment_id: 'outcome-treatment-hist-1',
        outcome_judgment: {
          T: 1.0, I: 0.0, F: 0.0, provenance_chain: [],
          links_to_judgment_id: 'treatment-hist-1',
          outcome_type: OutcomeType.MEDICAL_SUCCESS
        },
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        oracle_source: 'ml-demo-medical-oracle'
      }
    },
    {
      decision: {
        judgment_id: 'treatment-hist-2',
        judgment: { T: 0.7, I: 0.15, F: 0.15, provenance_chain: [] },
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        context: { condition: 'diabetes' },
        mapper_id: 'medical-mapper'
      },
      outcome: {
        judgment_id: 'outcome-treatment-hist-2',
        outcome_judgment: {
          T: 0.0, I: 0.0, F: 1.0, provenance_chain: [],
          links_to_judgment_id: 'treatment-hist-2',
          outcome_type: OutcomeType.MEDICAL_FAILURE
        },
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        oracle_source: 'ml-demo-medical-oracle'
      }
    }
  ];

  // Store pairs in storage
  for (const pair of samplePairs) {
    await storage.savePair(pair);
  }

  // Train ML models
  await mlEngine.trainModels(samplePairs);
  console.log('✅ ML models trained successfully\n');

  console.log('🔮 Phase 3: ML Predictions\n');

  // Generate predictions for new judgments
  const newJudgments = [
    {
      judgment: { T: 0.85, I: 0.1, F: 0.05, provenance_chain: [] },
      context: { pair: 'BTC/USDT' },
      oracleId: 'ml-demo-trading-oracle'
    },
    {
      judgment: { T: 0.75, I: 0.15, F: 0.1, provenance_chain: [] },
      context: { condition: 'hypertension' },
      oracleId: 'ml-demo-medical-oracle'
    }
  ];

  for (const { judgment, context, oracleId } of newJudgments) {
    try {
      // Success probability prediction
      const successPrediction = await mlEngine.generatePrediction(
        oracleId,
        judgment,
        'success_probability',
        context
      );

      console.log(`📈 Success Probability Prediction for ${oracleId}:`);
      console.log(`   • Prediction ID: ${successPrediction.prediction_id}`);
      console.log(`   • Predicted T: ${(successPrediction.predicted_outcome.T * 100).toFixed(1)}%`);
      console.log(`   • Predicted I: ${(successPrediction.predicted_outcome.I * 100).toFixed(1)}%`);
      console.log(`   • Predicted F: ${(successPrediction.predicted_outcome.F * 100).toFixed(1)}%`);
      console.log(`   • Confidence: ${(successPrediction.predicted_outcome.confidence * 100).toFixed(1)}%`);
      console.log(`   • Model Used: ${successPrediction.model_used}\n`);

      // Performance trend prediction
      const trendPrediction = await mlEngine.generatePrediction(
        oracleId,
        judgment,
        'performance_trend',
        context
      );

      console.log(`📊 Performance Trend Prediction for ${oracleId}:`);
      console.log(`   • Prediction ID: ${trendPrediction.prediction_id}`);
      console.log(`   • Predicted T: ${(trendPrediction.predicted_outcome.T * 100).toFixed(1)}%`);
      console.log(`   • Predicted I: ${(trendPrediction.predicted_outcome.I * 100).toFixed(1)}%`);
      console.log(`   • Predicted F: ${(trendPrediction.predicted_outcome.F * 100).toFixed(1)}%`);
      console.log(`   • Confidence: ${(trendPrediction.predicted_outcome.confidence * 100).toFixed(1)}%\n`);

    } catch (error) {
      console.log(`❌ Prediction Error for ${oracleId}: ${error.message}\n`);
    }
  }

  console.log('📈 Phase 4: Trend Analysis\n');

  // Analyze trends for trading oracle
  try {
    const tradingTrends = await mlEngine.analyzeTrends(samplePairs, 'ml-demo-trading-oracle');
    console.log('📊 Trading Oracle Trend Analysis:');
    console.log(`   • Trend Type: ${tradingTrends.trend_type}`);
    console.log(`   • Confidence: ${(tradingTrends.confidence * 100).toFixed(1)}%`);
    console.log(`   • Slope: ${tradingTrends.slope.toFixed(4)}`);
    console.log(`   • R-squared: ${tradingTrends.r_squared.toFixed(4)}`);
    console.log(`   • Forecast Periods: ${tradingTrends.forecast_periods}`);
    console.log(`   • Predicted Values: ${tradingTrends.predicted_values.length} periods\n`);
  } catch (error) {
    console.log(`❌ Trend Analysis Error: ${error.message}\n`);
  }

  console.log('🚨 Phase 5: Predictive Alerts\n');

  // Generate alerts for trading oracle
  try {
    const tradingAlerts = await mlEngine.generateAlerts(samplePairs, 'ml-demo-trading-oracle');
    console.log('🚨 Trading Oracle Alerts:');
    if (tradingAlerts.length === 0) {
      console.log('   • No alerts generated - system operating normally\n');
    } else {
      tradingAlerts.forEach((alert, index) => {
        console.log(`   • Alert ${index + 1}: ${alert.alert_type}`);
        console.log(`     - Severity: ${alert.severity}`);
        console.log(`     - Message: ${alert.message}`);
        console.log(`     - Recommended Actions: ${alert.recommended_actions.length} actions\n`);
      });
    }
  } catch (error) {
    console.log(`❌ Alert Generation Error: ${error.message}\n`);
  }

  console.log('📊 Phase 6: ML Models Information\n');

  // Get ML models information
  const models = mlEngine.getModels();
  console.log('🧠 Available ML Models:');
  models.forEach((model, index) => {
    console.log(`   • Model ${index + 1}: ${model.model_id}`);
    console.log(`     - Type: ${model.model_type}`);
    console.log(`     - Training Samples: ${model.training_data_size}`);
    console.log(`     - Accuracy: ${(model.accuracy_score * 100).toFixed(1)}%`);
    console.log(`     - Last Trained: ${model.last_trained}`);
    console.log(`     - Features: ${model.features.join(', ')}\n`);
  });

  console.log('📊 Phase 7: Storage Statistics\n');

  const stats = await storage.getStorageStats();
  console.log('💾 Memory Storage Statistics:');
  console.log(`   • Total Pairs: ${stats.totalPairs}`);
  console.log(`   • Oracle Count: ${stats.oracleCount}`);
  console.log(`   • Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);

  console.log('\n🎉 ML Predictive Engine Demo Completed Successfully!');
  console.log('\n📚 Key Features Demonstrated:');
  console.log('   ✅ ML Model Training with historical data');
  console.log('   ✅ Success Probability Predictions');
  console.log('   ✅ Performance Trend Analysis');
  console.log('   ✅ Outcome Forecasting');
  console.log('   ✅ Predictive Alert Generation');
  console.log('   ✅ Multiple ML Models (Classification, Time Series, Ensemble)');
  console.log('   ✅ Confidence Scoring and Validation');
  console.log('   ✅ Comprehensive Error Handling');
}

// Run the demo
mlDemo().catch(console.error);
