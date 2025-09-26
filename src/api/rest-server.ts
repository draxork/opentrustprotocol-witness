/**
 * OpenTrust Protocol Witness - REST API Server
 * 
 * Production-ready REST API with Express.js, authentication,
 * rate limiting, and comprehensive Witness operations.
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import jwt from 'jsonwebtoken';

import { EnhancedWitness } from '../witness/EnhancedWitness';
import { PerformanceDashboard } from '../dashboard/PerformanceDashboard';
import { PostgreSQLStorage } from '../storage/PostgreSQLStorage';
import { OTPAnalyticsEngine } from '../analytics/OTPAnalyticsEngine';
import { MLPredictiveEngine } from '../ml/MLPredictiveEngine';
import { WitnessConfig } from '../types/index';

export interface APIConfig {
  port: number;
  jwtSecret: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  postgresConfig: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

export class WitnessAPIServer {
  private app: express.Application;
  private config: APIConfig;
  private storage: PostgreSQLStorage;
  private dashboard: PerformanceDashboard;
  private analytics: OTPAnalyticsEngine;
  private mlEngine: MLPredictiveEngine;
  private witnesses: Map<string, EnhancedWitness> = new Map();
  private server: any;

  constructor(config: APIConfig) {
    this.config = config;
    this.app = express();
    this.storage = new PostgreSQLStorage(config.postgresConfig);
    this.dashboard = new PerformanceDashboard();
    this.analytics = new OTPAnalyticsEngine();
    this.mlEngine = new MLPredictiveEngine();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupAnalyticsRoutes();
    this.setupMLRoutes();
    this.setupDashboardRoutes();
    this.setupSwagger();
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    try {
      // Initialize storage
      await this.storage.initialize();
      console.log('✅ PostgreSQL storage initialized');

      // Start server
      this.server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Witness API Server running on port ${this.config.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.config.port}/api-docs`);
        console.log(`🔗 Health Check: http://localhost:${this.config.port}/health`);
      });

      // Start dashboard monitoring
      this.dashboard.startMonitoring(10000); // 10 second intervals
      console.log('📊 Performance dashboard monitoring started');

    } catch (error) {
      console.error('Failed to start API server:', error);
      throw error;
    }
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
    }
    await this.storage.close();
    this.dashboard.stopMonitoring();
    console.log('🛑 Witness API Server stopped');
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMax,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
      }
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '4.0.0',
        uptime: process.uptime()
      });
    });

    // API routes
    this.setupWitnessRoutes();
    this.setupDashboardRoutes();
    this.setupStorageRoutes();
  }

  private setupWitnessRoutes(): void {
    const router = express.Router();

    // Create Witness
    router.post('/witnesses', this.authenticateToken, async (req, res) => {
      try {
        const config: WitnessConfig = req.body;
        
        if (!config.witnessId || !config.version || !config.description) {
          res.status(400).json({
            error: 'Missing required fields: witnessId, version, description'
          });
          return;
        }

        if (this.witnesses.has(config.witnessId)) {
          res.status(409).json({
            error: `Witness with ID '${config.witnessId}' already exists`
          });
          return;
        }

        const witness = new EnhancedWitness(config, this.storage);
        this.witnesses.set(config.witnessId, witness);
        this.dashboard.registerWitness(witness);

        res.status(201).json({
          message: 'Witness created successfully',
          witnessId: config.witnessId,
          config
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Witness
    router.get('/witnesses/:witnessId', this.authenticateToken, async (req, res) => {
      try {
        const witnessId = req.params['witnessId'];
        const witness = witnessId ? this.witnesses.get(witnessId) : undefined;

        if (!witness) {
          res.status(404).json({
            error: `Witness '${witnessId}' not found`
          });
          return;
        }

        const status = await witness.getWitnessStatus();
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // List Witnesss
    router.get('/witnesses', this.authenticateToken, async (_req, res) => {
      try {
        const witnessesList = Array.from(this.witnesses.keys()).map(witnessId => ({
          witnessId,
          registered: true
        }));

        res.json({
          witnesses: witnessesList,
          total: witnessesList.length
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Record Outcome
    router.post('/witnesses/:witnessId/outcomes', this.authenticateToken, async (req, res) => {
      try {
        const witnessId = req.params['witnessId'];
        const { decision, outcome, context } = req.body;

        const witness = witnessId ? this.witnesses.get(witnessId) : undefined;
        if (!witness) {
          res.status(404).json({
            error: `Witness '${witnessId}' not found`
          });
          return;
        }

        // Validate inputs
        if (!decision || !outcome) {
          res.status(400).json({
            error: 'Missing required fields: decision, outcome'
          });
          return;
        }

        await witness.recordOutcome(decision, outcome, context);

        res.status(201).json({
          message: 'Outcome recorded successfully',
          witnessId,
          decisionId: decision.judgment_id,
          outcomeId: outcome.judgment_id
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Witness Metrics
    router.get('/witnesses/:witnessId/metrics', this.authenticateToken, async (req, res) => {
      try {
        const witnessId = req.params['witnessId'];
        const witness = witnessId ? this.witnesses.get(witnessId) : undefined;

        if (!witness) {
          res.status(404).json({
            error: `Witness '${witnessId}' not found`
          });
          return;
        }

        const metrics = await witness.getRealTimeMetrics();
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.use('/api', router);
  }

  private setupAnalyticsRoutes(): void {
    const router = express.Router();

    // Get Calibration Metrics
    router.get('/metrics/calibration', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId, timeRange, context } = req.query;
        
        let pairs;
        if (witnessId) {
          pairs = await this.storage.getPairsByWitness(witnessId as string);
        } else {
          const timeRangeStr = timeRange as string;
          const startDate = timeRangeStr ? new Date(timeRangeStr.split(',')[0]!) : undefined;
          const endDate = timeRangeStr ? new Date(timeRangeStr.split(',')[1]!) : undefined;
          const timeRangeObj = startDate && endDate ? { start: startDate, end: endDate } : undefined;
          pairs = await this.storage.getJudgmentPairs(timeRangeObj, context as string);
        }

        const calibration = await this.analytics.calculateCalibration(pairs);
        res.json(calibration);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get VoI Metrics
    router.get('/metrics/voi', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId, timeRange, context } = req.query;
        
        let pairs;
        if (witnessId) {
          pairs = await this.storage.getPairsByWitness(witnessId as string);
        } else {
          const timeRangeStr = timeRange as string;
          const startDate = timeRangeStr ? new Date(timeRangeStr.split(',')[0]!) : undefined;
          const endDate = timeRangeStr ? new Date(timeRangeStr.split(',')[1]!) : undefined;
          const timeRangeObj = startDate && endDate ? { start: startDate, end: endDate } : undefined;
          pairs = await this.storage.getJudgmentPairs(timeRangeObj, context as string);
        }

        const voi = await this.analytics.calculateVoI(pairs);
        res.json(voi);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Mapper Performance
    router.get('/metrics/mapper/:mapperId', this.authenticateToken, async (req, res) => {
      try {
        const { mapperId } = req.params;
        const { timeRange } = req.query;
        
        if (!mapperId) {
          res.status(400).json({ error: 'Mapper ID is required' });
          return;
        }
        
        const timeRangeStr = timeRange as string;
        const startDate = timeRangeStr ? new Date(timeRangeStr.split(',')[0]!) : undefined;
        const endDate = timeRangeStr ? new Date(timeRangeStr.split(',')[1]!) : undefined;
        const timeRangeObj = startDate && endDate ? { start: startDate, end: endDate } : undefined;
        
        const pairs = await this.storage.getJudgmentPairsByMapper(mapperId, timeRangeObj);
        const performance = await this.analytics.evaluateMapperPerformance(mapperId, pairs, timeRangeObj);
        
        res.json(performance);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Comprehensive Performance Analysis
    router.get('/metrics/performance/:witnessId', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId } = req.params;
        const { timeRange } = req.query;
        
        if (!witnessId) {
          res.status(400).json({ error: 'Witness ID is required' });
          return;
        }
        
        const timeRangeStr = timeRange as string;
        const startDate = timeRangeStr ? new Date(timeRangeStr.split(',')[0]!) : undefined;
        const endDate = timeRangeStr ? new Date(timeRangeStr.split(',')[1]!) : undefined;
        const timeRangeObj = startDate && endDate ? { start: startDate, end: endDate } : undefined;
        
        let pairs;
        if (timeRangeObj) {
          pairs = await this.storage.getJudgmentPairs(timeRangeObj);
        } else {
          pairs = await this.storage.getPairsByWitness(witnessId);
        }
        
        const analysis = await this.analytics.analyzePerformance(witnessId, pairs);
        res.json(analysis);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get All Mappers Performance
    router.get('/metrics/mappers', this.authenticateToken, async (req, res) => {
      try {
        const { timeRange, context } = req.query;
        
        const timeRangeStr = timeRange as string;
        const startDate = timeRangeStr ? new Date(timeRangeStr.split(',')[0]!) : undefined;
        const endDate = timeRangeStr ? new Date(timeRangeStr.split(',')[1]!) : undefined;
        const timeRangeObj = startDate && endDate ? { start: startDate, end: endDate } : undefined;
        
        const pairs = await this.storage.getJudgmentPairs(timeRangeObj, context as string);
        
        // Get unique mapper IDs
        const mapperIds = [...new Set(pairs.map(p => p.decision.mapper_id).filter(Boolean))];
        
        const mappersPerformance = await Promise.all(
          mapperIds.map(async (mapperId) => {
            if (!mapperId) return null;
            const mapperPairs = pairs.filter(p => p.decision.mapper_id === mapperId);
            return await this.analytics.evaluateMapperPerformance(mapperId, mapperPairs, timeRangeObj);
          })
        );
        
        res.json({
          mappers: mappersPerformance.filter(Boolean),
          total: mappersPerformance.filter(Boolean).length,
          timeRange: timeRangeObj
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.use('/api', router);
  }

  private setupMLRoutes(): void {
    const router = express.Router();

    // Train ML Models
    router.post('/ml/train', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId, timeRange } = req.body;
        
        // Get judgment pairs for training
        const timeRangeObj = timeRange ? {
          start: new Date(timeRange.start),
          end: new Date(timeRange.end)
        } : undefined;
        
        const pairs = await this.storage.getJudgmentPairs(timeRangeObj, witnessId || '');
        
        if (pairs.length === 0) {
          return res.status(400).json({ error: 'No judgment pairs found for training' });
        }

        // Train models
        await this.mlEngine.trainModels(pairs);
        
        return res.json({
          message: 'ML models trained successfully',
          training_samples: pairs.length,
          models: this.mlEngine.getModels()
        });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

    // Generate Prediction
    router.post('/ml/predict', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId, judgment, predictionType, context } = req.body;
        
        if (!witnessId || !judgment || !predictionType) {
          return res.status(400).json({ 
            error: 'Missing required fields: witnessId, judgment, predictionType' 
          });
        }

        const prediction = await this.mlEngine.generatePrediction(
          witnessId,
          judgment,
          predictionType,
          context
        );
        
        return res.json(prediction);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

    // Get Predictions for Witness
    router.get('/ml/predictions/:witnessId', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId } = req.params;
        const predictions = this.mlEngine.getPredictions(witnessId || '');
        
        res.json({
          witness_id: witnessId,
          predictions,
          total: predictions.length
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Analyze Trends
    router.get('/ml/trends/:witnessId', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId } = req.params;
        const { timeRange } = req.query;
        
        // Get judgment pairs for trend analysis
        const timeRangeObj = timeRange ? {
          start: new Date((timeRange as string).split(',')[0]!),
          end: new Date((timeRange as string).split(',')[1]!)
        } : undefined;
        
        const pairs = await this.storage.getJudgmentPairs(timeRangeObj, witnessId || '');
        
        if (pairs.length < 2) {
          return res.status(400).json({ error: 'Insufficient data for trend analysis' });
        }

        const trendAnalysis = await this.mlEngine.analyzeTrends(pairs, witnessId || '');
        
        return res.json(trendAnalysis);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

    // Generate Alerts
    router.get('/ml/alerts/:witnessId', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId } = req.params;
        const { timeRange } = req.query;
        
        // Get judgment pairs for alert generation
        const timeRangeObj = timeRange ? {
          start: new Date((timeRange as string).split(',')[0]!),
          end: new Date((timeRange as string).split(',')[1]!)
        } : undefined;
        
        const pairs = await this.storage.getJudgmentPairs(timeRangeObj, witnessId || '');
        
        const alerts = await this.mlEngine.generateAlerts(pairs, witnessId || '');
        
        res.json({
          witness_id: witnessId,
          alerts,
          total: alerts.length
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get ML Models
    router.get('/ml/models', this.authenticateToken, async (_req, res) => {
      try {
        const models = this.mlEngine.getModels();
        res.json({
          models,
          total: models.length
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get All Alerts
    router.get('/ml/alerts', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId } = req.query;
        
        if (witnessId) {
          const alerts = this.mlEngine.getAlerts(witnessId as string);
          res.json({
            witness_id: witnessId,
            alerts,
            total: alerts.length
          });
        } else {
          // Get alerts for all witnesses
          const allAlerts = Array.from(this.mlEngine.getAlerts('')).concat(
            ...Array.from(this.witnesses.keys()).map(id => this.mlEngine.getAlerts(id))
          );
          
          res.json({
            alerts: allAlerts,
            total: allAlerts.length
          });
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.use('/api', router);
  }

  private setupDashboardRoutes(): void {
    const router = express.Router();

    // Get Dashboard Metrics
    router.get('/dashboard/metrics', this.authenticateToken, async (_req, res) => {
      try {
        const metrics = await this.dashboard.getCurrentMetrics();
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Dashboard Trends
    router.get('/dashboard/trends', this.authenticateToken, async (_req, res) => {
      try {
        const trends = this.dashboard.getPerformanceTrends();
        res.json(trends);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Generate Performance Report
    router.post('/dashboard/report', this.authenticateToken, async (_req, res) => {
      try {
        const report = await this.dashboard.generateReport();
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.use('/api', router);
  }

  private setupStorageRoutes(): void {
    const router = express.Router();

    // Get Storage Statistics
    router.get('/storage/stats', this.authenticateToken, async (_req, res) => {
      try {
        const stats = await this.storage.getStorageStats();
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Storage Pairs
    router.get('/storage/pairs', this.authenticateToken, async (req, res) => {
      try {
        const { witnessId, judgmentId } = req.query;
        
        if (!witnessId && !judgmentId) {
          res.status(400).json({
            error: 'At least one query parameter is required: witnessId or judgmentId'
          });
          return;
        }

        let pairs;
        if (witnessId) {
          pairs = await this.storage.getPairsByWitness(witnessId as string);
        } else if (judgmentId) {
          pairs = await this.storage.getPairsByJudgmentId(judgmentId as string);
        }

        res.json({
          pairs: pairs || [],
          total: pairs ? pairs.length : 0
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get Storage Pair by ID
    router.get('/storage/pairs/:judgmentId', this.authenticateToken, async (req, res) => {
      try {
        const judgmentId = req.params['judgmentId'];
        if (!judgmentId) {
          res.status(400).json({ error: 'Judgment ID is required' });
          return;
        }
        const pair = await this.storage.getPair(judgmentId);
        
        if (!pair) {
          res.status(404).json({
            error: `Judgment pair with ID '${judgmentId}' not found`
          });
          return;
        }

        res.json(pair);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.use('/api', router);
  }

  private setupSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'OpenTrust Protocol Witness API',
          version: '4.0.0',
          description: 'Production-ready REST API for Witness operations with Analytics and Dashboard',
        },
        servers: [
          {
            url: `http://localhost:${this.config.port}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      apis: ['./src/api/rest-server.ts'],
    };

    const specs = swaggerJsdoc(swaggerOptions);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, this.config.jwtSecret, (err: any, user: any) => {
      if (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }
      (req as any).user = user;
      next();
    });
  };
}