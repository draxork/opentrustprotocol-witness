/**
 * OpenTrust Protocol Witness - Trading Witness Demo
 * 
 * This example demonstrates how to use the TradingWitness to track
 * financial trading outcomes and analyze performance.
 */

const {
  createTradingWitness,
  createMemoryStorage,
  createAnalyticsEngine
} = require('../dist/index');

// Mock the opentrustprotocol dependency for demo
const mockNeutrosophicJudgment = {
  judgment_id: 'demo-trade-decision',
  t: 0.8,  // 80% confidence in success
  i: 0.1,  // 10% uncertainty
  f: 0.1,  // 10% chance of failure
  provenance_chain: [{
    source_id: 'demo-mapper',
    timestamp: new Date().toISOString(),
    description: 'Demo trading decision',
    metadata: { mapper_id: 'demo-mapper' }
  }]
};

async function runTradingWitnessDemo() {
  console.log('🚀 OpenTrust Protocol Witness - Trading Witness Demo\n');

  try {
    // Create storage and witness
    const storage = createMemoryStorage();
    const witness = createTradingWitness('demo-trading-witness', storage);

    console.log('✅ Created Trading Witness:', witness.config.witnessId);

    // Simulate multiple trades
    const trades = [
      {
        pair: 'BTC/USDT',
        direction: 'long',
        entryPrice: 50000,
        exitPrice: 55000,
        positionSize: 1000,
        profit: 500,
        marketConditions: {
          volatility: 0.05,
          volume: 1000000,
          trend: 'bullish'
        }
      },
      {
        pair: 'ETH/USDT',
        direction: 'short',
        entryPrice: 3000,
        exitPrice: 2800,
        positionSize: 500,
        profit: 100,
        marketConditions: {
          volatility: 0.08,
          volume: 800000,
          trend: 'bearish'
        }
      },
      {
        pair: 'ADA/USDT',
        direction: 'long',
        entryPrice: 0.5,
        exitPrice: 0.45,
        positionSize: 10000,
        profit: -500,
        marketConditions: {
          volatility: 0.12,
          volume: 500000,
          trend: 'bearish'
        }
      }
    ];

    // Record each trade
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      const judgment = {
        ...mockNeutrosophicJudgment,
        judgment_id: `trade-decision-${i + 1}`
      };

      const tradeContext = {
        pair: trade.pair,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        positionSize: trade.positionSize,
        marketConditions: trade.marketConditions,
        risk: {
          positionSize: trade.positionSize,
          stopLoss: trade.entryPrice * (trade.direction === 'long' ? 0.95 : 1.05),
          takeProfit: trade.entryPrice * (trade.direction === 'long' ? 1.10 : 0.90)
        }
      };

      const marketSnapshot = {
        timestamp: new Date().toISOString(),
        pair: trade.pair,
        price: trade.exitPrice,
        volume: trade.marketConditions.volume,
        volatility: trade.marketConditions.volatility,
        trend: trade.marketConditions.trend
      };

      if (trade.profit > 0) {
        await witness.recordSuccessfulTrade(judgment, tradeContext, trade.profit, marketSnapshot);
        console.log(`✅ Recorded successful trade: ${trade.pair} - Profit: $${trade.profit}`);
      } else {
        await witness.recordFailedTrade(judgment, tradeContext, Math.abs(trade.profit), marketSnapshot);
        console.log(`❌ Recorded failed trade: ${trade.pair} - Loss: $${Math.abs(trade.profit)}`);
      }
    }

    console.log('\n📊 Trading Performance Analysis:');
    console.log('================================');

    // Get trading performance
    const performance = await witness.getTradingPerformance();
    
    console.log(`Total Trades: ${performance.trading.totalTrades}`);
    console.log(`Winning Trades: ${performance.trading.winningTrades}`);
    console.log(`Losing Trades: ${performance.trading.losingTrades}`);
    console.log(`Win Rate: ${(performance.trading.winRate * 100).toFixed(1)}%`);
    console.log(`Average Profit: $${performance.trading.averageProfit.toFixed(2)}`);
    console.log(`Average Loss: $${performance.trading.averageLoss.toFixed(2)}`);
    console.log(`Profit Factor: ${performance.trading.profitFactor.toFixed(2)}`);
    console.log(`Sharpe Ratio: ${performance.trading.sharpeRatio.toFixed(3)}`);
    console.log(`Total Profit: $${performance.trading.totalProfit.toFixed(2)}`);

    console.log('\n🎯 Overall Performance Grade:', performance.performance_grade);
    console.log(`Success Rate: ${(performance.success_rate * 100).toFixed(1)}%`);

    // Get storage statistics
    const stats = storage.getStorageStatistics();
    console.log('\n💾 Storage Statistics:');
    console.log('======================');
    console.log(`Total Pairs: ${stats.totalPairs}`);
    console.log(`Witness Count: ${stats.witnessCount}`);
    console.log(`Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)} KB`);

    console.log('\n🎉 Trading Witness Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runTradingWitnessDemo().catch(console.error);
}

module.exports = { runTradingWitnessDemo };
