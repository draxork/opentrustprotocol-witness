# 🔮 OpenTrust Protocol Oracle

[![npm version](https://badge.fury.io/js/opentrustprotocol-oracle.svg)](https://badge.fury.io/js/opentrustprotocol-oracle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 🚀 **REVOLUTIONARY UPDATE: v4.0.1 - Phase 5 Complete - Production-Ready Oracle System**

The **OpenTrust Protocol Oracle** is the revolutionary second pillar of the OpenTrust Protocol ecosystem, bridging the gap between OTP predictions and real-world outcomes. This creates the foundation for the **Circle of Trust** - a continuous learning loop that improves decision-making over time.

### 🎯 **v4.0.1 - Phase 5 Complete - Production System**
- ✅ **Advanced Storage** - PostgreSQL with full persistence
- ✅ **REST API** - Complete HTTP API with authentication
- ✅ **WebSocket Server** - Real-time metric updates
- ✅ **Enhanced Oracle** - Integrated Analytics Engine
- ✅ **Performance Dashboard** - Multi-oracle monitoring
- ✅ **Docker Support** - Complete containerization
- ✅ **Security** - JWT authentication, rate limiting, CORS
- ✅ **Documentation** - Swagger/OpenAPI integration

### 🔮 **The First Pillar: Performance Oracle & Circle of Trust**

The Performance Oracle system introduces groundbreaking capabilities:

- **🎯 Real-World Outcome Tracking**: Link OTP decisions to actual results
- **📊 Performance Analytics**: Comprehensive metrics and calibration analysis
- **🔄 Circle of Trust**: Continuous learning and improvement loop
- **💰 Trading Oracle**: Financial outcome tracking with risk analysis
- **🏥 Medical Oracle**: Healthcare outcome monitoring with safety alerts
- **📈 Value of Indeterminacy (VoI)**: Measure the contribution of uncertainty to decisions

### 🧠 **v4.0.1 Features: Phase 5 Complete - Production System**

#### **🏗️ Advanced Storage & Persistence**
- **🗄️ PostgreSQL Integration**: Full production database support
- **💾 Memory Storage**: High-performance in-memory storage for development
- **🔄 Data Synchronization**: Automatic backup and recovery
- **📊 Storage Analytics**: Comprehensive storage statistics and monitoring

#### **🌐 REST API & WebSocket Server**
- **🔗 Complete HTTP API**: Full CRUD operations for oracles and outcomes
- **🔐 JWT Authentication**: Enterprise-grade security
- **⚡ Rate Limiting**: Protection against abuse and DDoS
- **🌍 CORS Support**: Cross-origin resource sharing
- **📚 Swagger Documentation**: Auto-generated API documentation
- **🔌 WebSocket Server**: Real-time metric updates and notifications

#### **📊 Enhanced Analytics & Monitoring**
- **📏 Calibration Analysis**: Mathematical precision in confidence vs accuracy
- **🎯 Performance Grading**: Automatic A+ to D grading system
- **🔮 VoI Calculations**: Advanced Value of Indeterminacy metrics
- **📊 Multi-Oracle Dashboard**: Comprehensive monitoring interface
- **⏰ Real-time Metrics**: Live performance tracking
- **🚨 Alert System**: Proactive monitoring and notifications

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│            🔮 OPENTRUST PROTOCOL ORACLE v4.0.1 - PHASE 5       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 PRODUCTION API LAYER                                       │
│  ├─ 🔗 REST API Server (Express.js)                           │
│  ├─ 🔌 WebSocket Server (Real-time Updates)                   │
│  ├─ 🔐 JWT Authentication & Authorization                     │
│  ├─ ⚡ Rate Limiting & Security                               │
│  └─ 📚 Swagger/OpenAPI Documentation                          │
│                                                                 │
│  📊 ENHANCED ORACLE SYSTEM                                     │
│  ├─ 🎯 Enhanced Oracle (Analytics Integration)                 │
│  ├─ 💰 Trading Oracle (Financial Outcomes)                     │
│  ├─ 🏥 Medical Oracle (Healthcare Outcomes)                    │
│  └─ 📊 Performance Dashboard (Multi-Oracle Monitoring)         │
│                                                                 │
│  🗄️ ADVANCED STORAGE LAYER                                    │
│  ├─ 💾 Memory Storage (Development & Testing)                  │
│  ├─ 🗃️ PostgreSQL Storage (Production)                        │
│  ├─ 📊 Storage Analytics & Statistics                          │
│  └─ 🔄 Data Synchronization & Backup                          │
│                                                                 │
│  📈 ANALYTICS & METRICS ENGINE                                 │
│  ├─ 🎯 Calibration Analysis                                    │
│  ├─ 🔮 VoI (Value of Indeterminacy)                            │
│  ├─ 📈 Performance Grading                                     │
│  ├─ 🚨 Real-time Monitoring & Alerts                          │
│  └─ 📊 Comprehensive Reporting                                 │
│                                                                 │
│  🐳 DEPLOYMENT & INFRASTRUCTURE                                │
│  ├─ 🐳 Docker & Docker Compose                                │
│  ├─ 🏗️ Production-Ready Configuration                         │
│  ├─ 📊 Health Monitoring & Metrics                            │
│  └─ 🔧 Environment Configuration                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start**

### Installation

```bash
npm install opentrustprotocol-oracle opentrustprotocol
```

### Basic Usage

#### **Option 1: Simple Oracle (Development)**
```typescript
import {
  createTradingOracle,
  createMedicalOracle,
  SimpleOracle
} from 'opentrustprotocol-oracle';

// Create simple oracles for development
const tradingOracle = createTradingOracle('my-trading-oracle');
const medicalOracle = createMedicalOracle('my-medical-oracle');
```

#### **Option 2: Enhanced Oracle System (Production)**
```typescript
import {
  OracleServer,
  EnhancedOracle,
  PerformanceDashboard,
  PostgreSQLStorage
} from 'opentrustprotocol-oracle';

// Create production server with all features
const server = new OracleServer({
  api: {
    port: 3000,
    jwtSecret: 'your-secret-key'
  },
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'oracle_db',
    username: 'oracle_user',
    password: 'oracle_password'
  }
});

await server.start();
```

#### **Option 3: REST API Client**
```typescript
// Use the REST API from any application
const response = await fetch('http://localhost:3000/api/oracles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    oracleId: 'my-oracle',
    version: '4.0.0',
    description: 'My Custom Oracle'
  })
});
```

### Trading Oracle Example

```typescript
import { TradingOracle, TradingContext } from 'opentrustprotocol-oracle';
import { NeutrosophicJudgment } from 'opentrustprotocol';

// Create trading oracle
const oracle = new TradingOracle({
  oracleId: 'crypto-trading-oracle',
  version: '1.0.0',
  description: 'Cryptocurrency Trading Oracle'
}, storage);

// Record a successful trade
const originalDecision: NeutrosophicJudgment = {
  judgment_id: 'trade-decision-001',
  t: 0.8,  // 80% confidence in success
  i: 0.1,  // 10% uncertainty
  f: 0.1,  // 10% chance of failure
  provenance_chain: [/* ... */]
};

const tradeContext: TradingContext = {
  pair: 'BTC/USDT',
  direction: 'long',
  entryPrice: 50000,
  exitPrice: 55000,
  positionSize: 1000,
  marketConditions: {
    volatility: 0.05,
    volume: 1000000,
    trend: 'bullish'
  },
  risk: {
    positionSize: 1000,
    stopLoss: 48000,
    takeProfit: 60000
  }
};

await oracle.recordSuccessfulTrade(
  originalDecision,
  tradeContext,
  500, // $500 profit
  marketSnapshot
);

// Get performance metrics
const performance = await oracle.getTradingPerformance();
console.log(`Win Rate: ${(performance.trading.winRate * 100).toFixed(1)}%`);
console.log(`Total Profit: $${performance.trading.totalProfit.toFixed(2)}`);
console.log(`Sharpe Ratio: ${performance.trading.sharpeRatio.toFixed(3)}`);
```

### Medical Oracle Example

```typescript
import { MedicalOracle, MedicalContext } from 'opentrustprotocol-oracle';

// Create medical oracle
const oracle = new MedicalOracle({
  oracleId: 'medical-treatment-oracle',
  version: '1.0.0',
  description: 'Medical Treatment Oracle'
}, storage);

// Record successful treatment
const medicalContext: MedicalContext = {
  patientId: 'patient-001',
  condition: 'hypertension',
  treatment: 'medication',
  followUpDays: 30,
  protocol: {
    dosage: '10mg daily',
    frequency: 'once daily',
    duration: '30 days'
  }
};

await oracle.recordSuccessfulTreatment(
  originalDecision,
  medicalContext,
  14, // 14 days to recovery
  0.9 // 90% improvement score
);

// Get safety alerts
const alerts = oracle.getSafetyAlerts();
if (alerts.length > 0) {
  console.log('⚠️ Safety Alert:', alerts[0].message);
}
```

---

## 📊 **Analytics & Performance Metrics**

### Calibration Analysis

```typescript
import { OTPAnalyticsEngine } from 'opentrustprotocol-oracle';

const analytics = new OTPAnalyticsEngine();

// Analyze calibration
const calibration = await analytics.calculateCalibration(judgmentPairs);
console.log(`Calibration Score: ${(calibration.overall_calibration_score * 100).toFixed(1)}%`);
console.log(`Brier Score: ${calibration.brier_score.toFixed(3)}`);

// Analyze VoI (Value of Indeterminacy)
const voi = await analytics.calculateVoI(judgmentPairs);
console.log(`VoI Correlation: ${voi.indeterminacy_correlation.toFixed(3)}`);
console.log(`Average VoI Contribution: ${voi.average_voi_contribution.toFixed(3)}`);
```

### Performance Grading

The system provides automatic performance grading:

- **A+**: 90%+ combined score (success rate + calibration)
- **A**: 80-89% combined score
- **B**: 70-79% combined score
- **C**: 60-69% combined score
- **D**: <60% combined score

---

## 🔧 **Advanced Configuration**

### Custom Validation Rules

```typescript
import { PerformanceOracle } from 'opentrustprotocol-oracle';

const oracle = new PerformanceOracle({
  oracleId: 'custom-oracle',
  version: '1.0.0'
}, storage, {
  minConfidenceThreshold: 0.3,
  maxOutcomeAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  requiredFields: ['judgment_id', 'T', 'I', 'F', 'outcome_type'],
  customValidator: (outcome) => {
    // Custom validation logic
    return outcome.metadata && outcome.metadata.customField;
  }
});
```

### Storage Configuration

```typescript
import { MemoryStorage } from 'opentrustprotocol-oracle';

const storage = new MemoryStorage();

// Get storage statistics
const stats = storage.getStorageStatistics();
console.log(`Total Pairs: ${stats.totalPairs}`);
console.log(`Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

// Cleanup old data
const cleanedCount = await storage.cleanup(30 * 24 * 60 * 60 * 1000); // 30 days
console.log(`Cleaned up ${cleanedCount} old pairs`);
```

---

## 🐳 **Docker Deployment**

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/draxork/opentrustprotocol-oracle.git
cd opentrustprotocol-oracle

# Start the complete system
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the system
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t opentrustprotocol-oracle:4.0.0 .

# Run with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Configuration

```bash
# Required environment variables
export API_PORT=3000
export JWT_SECRET=your-secure-jwt-secret
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=oracle_db
export POSTGRES_USER=oracle_user
export POSTGRES_PASSWORD=oracle_password
```

---

## 🌐 **REST API Documentation**

### Authentication
All API endpoints require JWT authentication:

```bash
# Get authentication token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/oracles
```

### Available Endpoints

#### **Oracle Management**
- `POST /api/oracles` - Create new oracle
- `GET /api/oracles` - List all oracles
- `GET /api/oracles/:id` - Get oracle details
- `GET /api/oracles/:id/status` - Get oracle status

#### **Outcome Recording**
- `POST /api/oracles/:id/outcomes` - Record outcome
- `GET /api/oracles/:id/outcomes` - Get oracle outcomes
- `GET /api/oracles/:id/metrics` - Get performance metrics

#### **Dashboard & Analytics**
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/trends` - Get performance trends
- `POST /api/dashboard/report` - Generate performance report

#### **Storage Operations**
- `GET /api/storage/stats` - Get storage statistics
- `GET /api/storage/pairs` - Get judgment pairs
- `GET /api/storage/pairs/:id` - Get specific pair

### Swagger Documentation
Visit `http://localhost:3000/api-docs` for interactive API documentation.

---

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- oracle.test.ts
```

---

## 📚 **API Reference**

### Core Classes

#### `OracleServer`
Complete production server with REST API and WebSocket support.

**Methods:**
- `start()`: Start the server
- `stop()`: Stop the server gracefully
- `getStatus()`: Get server status

#### `EnhancedOracle`
Advanced oracle with integrated analytics engine.

**Methods:**
- `recordOutcome(decision, outcome, context?)`: Record an outcome
- `getRealTimeMetrics()`: Get real-time performance metrics
- `getOracleStatus()`: Get oracle status
- `getPerformanceAnalysis()`: Get detailed performance analysis
- `exportData()`: Export oracle data

#### `PerformanceDashboard`
Multi-oracle monitoring and analytics dashboard.

**Methods:**
- `registerOracle(oracle)`: Register an oracle for monitoring
- `startMonitoring(interval)`: Start real-time monitoring
- `getCurrentMetrics()`: Get current dashboard metrics
- `getPerformanceTrends()`: Get performance trends
- `generateReport()`: Generate comprehensive report

#### `TradingOracle`
Specialized oracle for financial trading outcomes.

**Methods:**
- `recordTradingOutcome(originalJudgment, tradeContext, marketSnapshot?)`: Record trading outcome
- `recordSuccessfulTrade(originalJudgment, tradeContext, profitLoss, marketSnapshot?)`: Record successful trade
- `recordFailedTrade(originalJudgment, tradeContext, lossAmount, marketSnapshot?)`: Record failed trade
- `getTradingPerformance(pair?)`: Get trading performance metrics

#### `MedicalOracle`
Specialized oracle for healthcare outcomes.

**Methods:**
- `recordTreatmentOutcome(originalJudgment, medicalContext, outcomeDetails)`: Record treatment outcome
- `recordSuccessfulTreatment(originalJudgment, medicalContext, recoveryTime, improvementScore?)`: Record successful treatment
- `recordFailedTreatment(originalJudgment, medicalContext, failureReason, complications?)`: Record failed treatment
- `getSafetyAlerts()`: Get safety alerts

#### `PostgreSQLStorage`
Production-ready database storage with full persistence.

**Methods:**
- `initialize()`: Initialize database connection
- `savePair(pair)`: Save judgment pair to database
- `getPair(judgmentId)`: Retrieve judgment pair
- `getPairsByOracle(oracleId)`: Get all pairs for an oracle
- `getStorageStats()`: Get storage statistics
- `cleanup(olderThanMs)`: Clean up old data

#### `MemoryStorage`
High-performance in-memory storage for development.

**Methods:**
- `storePair(pair)`: Store judgment pair in memory
- `getPair(judgmentId)`: Retrieve judgment pair
- `getPairsByOracle(oracleId)`: Get all pairs for an oracle
- `getStorageStats()`: Get storage statistics
- `cleanup(olderThanMs)`: Clean up old data

#### `OTPAnalyticsEngine`
Analytics engine for performance analysis.

**Methods:**
- `calculateCalibration(pairs)`: Calculate calibration metrics
- `calculateVoI(pairs)`: Calculate VoI metrics
- `analyzePerformance(oracleId, pairs)`: Comprehensive performance analysis
- `calculateSuccessRate(pairs)`: Calculate success rate
- `calculatePerformanceGrade(rate, calibration, voi)`: Calculate performance grade

### Types

#### `TradingContext`
```typescript
interface TradingContext {
  pair: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  marketConditions: {
    volatility: number;
    volume: number;
    trend: 'bullish' | 'bearish' | 'sideways';
  };
  risk: {
    stopLoss?: number;
    takeProfit?: number;
    positionSize: number;
  };
}
```

#### `MedicalContext`
```typescript
interface MedicalContext {
  patientId: string;
  condition: string;
  treatment: string;
  followUpDays: number;
  medicalHistory?: string[];
  protocol: {
    dosage?: string;
    frequency?: string;
    duration?: string;
  };
}
```

---

## 🔒 **Security & Privacy**

### Data Protection
- All patient data is anonymized
- Sensitive information is encrypted
- HIPAA-compliant data handling
- Audit trails for all operations

### Validation
- Input validation for all oracle operations
- Outcome verification before recording
- Custom validation rules support
- Error handling and logging

---

## 🚀 **Roadmap**

### ✅ **Phase 1 - Complete (v1.0.0)**
- ✅ Performance Oracle base implementation
- ✅ Trading Oracle with financial metrics
- ✅ Medical Oracle with safety monitoring

### ✅ **Phase 2 - Complete (v2.0.0)**
- ✅ Analytics Engine with calibration analysis
- ✅ Memory Storage implementation
- ✅ Advanced performance metrics

### ✅ **Phase 3 - Complete (v3.0.0)**
- ✅ Enhanced Oracle with integrated analytics
- ✅ Performance Dashboard implementation
- ✅ Multi-oracle monitoring system

### ✅ **Phase 4 - Complete (v4.0.0)**
- ✅ PostgreSQL Storage implementation
- ✅ Complete REST API with authentication
- ✅ WebSocket Server for real-time updates
- ✅ Docker & Docker Compose support
- ✅ Production-ready deployment

### ✅ **Phase 5 - Complete (v4.0.1)**
- ✅ Advanced Storage & Persistence (PostgreSQL + Memory)
- ✅ Complete REST API with JWT Authentication
- ✅ WebSocket Server for Real-time Updates
- ✅ Enhanced Oracle with Integrated Analytics
- ✅ Performance Dashboard (Multi-oracle Monitoring)
- ✅ Docker & Docker Compose Support
- ✅ Security (JWT, Rate Limiting, CORS)
- ✅ Swagger/OpenAPI Documentation

### 🔮 **Phase 6 (Future)**
- 🔄 Machine Learning integration
- 🔄 Advanced predictive analytics
- 🔄 Distributed Oracle network
- 🔄 Cross-oracle performance comparison
- 🔄 Web Dashboard UI for visualization

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/draxork/opentrustprotocol-oracle.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 **Links**

- **GitHub Repository**: [https://github.com/draxork/opentrustprotocol-oracle](https://github.com/draxork/opentrustprotocol-oracle)
- **NPM Package**: [https://www.npmjs.com/package/opentrustprotocol-oracle](https://www.npmjs.com/package/opentrustprotocol-oracle)
- **Documentation**: [https://github.com/draxork/opentrustprotocol-oracle#readme](https://github.com/draxork/opentrustprotocol-oracle#readme)
- **OpenTrust Protocol**: [https://github.com/draxork/opentrustprotocol](https://github.com/draxork/opentrustprotocol)

---

## 🙏 **Acknowledgments**

- **OpenTrust Protocol Team** for the revolutionary neutrosophic logic framework
- **Community Contributors** for feedback and testing
- **Beta Users** for real-world validation

---

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/draxork/opentrustprotocol-oracle/issues)
- **Discussions**: [GitHub Discussions](https://github.com/draxork/opentrustprotocol-oracle/discussions)
- **Email**: support@opentrustprotocol.com

---

**🔮 The future of decision-making is here. Join the Circle of Trust with OpenTrust Protocol Oracle.**
