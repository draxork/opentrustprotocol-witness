/**
 * OpenTrust Protocol Witness - Production Server
 * 
 * Complete production server integrating REST API, WebSocket,
 * PostgreSQL storage, and all Witness components.
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

import { WitnessAPIServer, APIConfig } from './api/rest-server';
import { WitnessWebSocketServer, WebSocketConfig } from './api/websocket-server';
import { PostgreSQLConfig } from './storage/PostgreSQLStorage';

export interface ServerConfig {
  api: APIConfig;
  websocket: WebSocketConfig;
  postgres: PostgreSQLConfig;
}

export class WitnessServer {
  private apiServer: WitnessAPIServer;
  private wsServer: WitnessWebSocketServer;
  private config: ServerConfig;
  private isShuttingDown: boolean = false;

  constructor(config: ServerConfig) {
    this.config = config;
    this.apiServer = new WitnessAPIServer(config.api);
    
    // Initialize WebSocket server with shared components
    this.wsServer = new WitnessWebSocketServer(
      config.websocket,
      (this.apiServer as any).dashboard,
      (this.apiServer as any).witnesses
    );
  }

  /**
   * Start the complete Witness server
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting OpenTrust Protocol Witness Server v4.0.0...\n');

      // Start API server
      await this.apiServer.start();
      
      // Start WebSocket server
      this.wsServer.start();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('\n✅ Witness Server started successfully!');
      console.log('📊 Available Services:');
      console.log(`   • REST API: http://localhost:${this.config.api.port}`);
      console.log(`   • WebSocket: ws://localhost:${this.config.websocket.port}`);
      console.log(`   • API Docs: http://localhost:${this.config.api.port}/api-docs`);
      console.log(`   • Health: http://localhost:${this.config.api.port}/health`);
      console.log(`   • Database: ${this.config.postgres.host}:${this.config.postgres.port}/${this.config.postgres.database}\n`);

    } catch (error) {
      console.error('❌ Failed to start Witness Server:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the Witness server gracefully
   */
  async stop(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('\n🛑 Shutting down Witness Server...');

    try {
      // Stop WebSocket server
      this.wsServer.stop();

      // Stop API server
      await this.apiServer.stop();

      console.log('✅ Witness Server stopped gracefully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n📡 Received ${signal}, initiating graceful shutdown...`);
        await this.stop();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught Exception:', error);
      await this.stop();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      await this.stop();
      process.exit(1);
    });
  }

  /**
   * Get server statistics
   */
  getStats(): {
    api: {
      port: number;
      uptime: number;
    };
    websocket: {
      port: number;
      connections: number;
      uptime: number;
    };
    postgres: {
      host: string;
      port: number;
      database: string;
    };
  } {
    return {
      api: {
        port: this.config.api.port,
        uptime: process.uptime()
      },
      websocket: {
        port: this.config.websocket.port,
        connections: this.wsServer.getStats().authenticatedConnections,
        uptime: process.uptime()
      },
      postgres: {
        host: this.config.postgres.host,
        port: this.config.postgres.port,
        database: this.config.postgres.database
      }
    };
  }
}

/**
 * Create default server configuration from environment variables
 */
export function createDefaultConfig(): ServerConfig {
  return {
    api: {
      port: parseInt(process.env['API_PORT'] || '3000'),
      jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
      corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
      rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
      rateLimitMax: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
      postgresConfig: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: process.env['DB_NAME'] || 'opentrust_witness',
        username: process.env['DB_USER'] || 'witness_user',
        password: process.env['DB_PASSWORD'] || 'witness_password',
        ssl: process.env['DB_SSL'] === 'true'
      }
    },
    websocket: {
      port: parseInt(process.env['WS_PORT'] || '8080'),
      jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
      heartbeatInterval: parseInt(process.env['HEARTBEAT_INTERVAL'] || '30000') // 30 seconds
    },
    postgres: {
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'opentrust_witness',
      username: process.env['DB_USER'] || 'witness_user',
      password: process.env['DB_PASSWORD'] || 'witness_password',
      ssl: process.env['DB_SSL'] === 'true',
      max: parseInt(process.env['DB_POOL_MAX'] || '20'),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
      connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '2000')
    }
  };
}

/**
 * Main entry point
 */
async function main() {
  try {
    const config = createDefaultConfig();
    const server = new WitnessServer(config);
    
    await server.start();

    // Keep the process alive
    process.on('SIGTERM', async () => {
      console.log('📡 SIGTERM received, shutting down gracefully...');
      await server.stop();
    });

    process.on('SIGINT', async () => {
      console.log('📡 SIGINT received, shutting down gracefully...');
      await server.stop();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  main();
}
