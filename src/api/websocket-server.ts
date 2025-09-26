/**
 * OpenTrust Protocol Witness - WebSocket Server
 * 
 * Real-time WebSocket server for live metrics streaming,
 * dashboard updates, and Witness performance monitoring.
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { PerformanceDashboard } from '../dashboard/PerformanceDashboard';
import { EnhancedWitness } from '../witness/EnhancedWitness';

export interface WebSocketConfig {
  port: number;
  jwtSecret: string;
  heartbeatInterval: number;
}

export interface AuthenticatedWebSocket extends WebSocket {
  isAlive: boolean;
  user: {
    username: string;
    role: string;
  };
}

export class WitnessWebSocketServer {
  private wss: WebSocketServer;
  private config: WebSocketConfig;
  private dashboard: PerformanceDashboard;
  private witnesses: Map<string, EnhancedWitness>;
  private clients: Set<AuthenticatedWebSocket> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsBroadcastInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig, dashboard: PerformanceDashboard, witnesses: Map<string, EnhancedWitness>) {
    this.config = config;
    this.dashboard = dashboard;
    this.witnesses = witnesses;
    this.wss = new WebSocketServer({ port: config.port });
    
    this.setupWebSocketServer();
  }

  /**
   * Start the WebSocket server
   */
  start(): void {
    console.log(`🔌 WebSocket Server running on port ${this.config.port}`);
    this.startHeartbeat();
    this.startMetricsBroadcast();
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsBroadcastInterval) {
      clearInterval(this.metricsBroadcastInterval);
    }
    
    this.wss.close();
    console.log('🔌 WebSocket Server stopped');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('📡 New WebSocket connection attempt');
      
      // Authenticate the connection
      this.authenticateConnection(ws, request).then(authenticated => {
        if (authenticated) {
          this.handleAuthenticatedConnection(ws as AuthenticatedWebSocket);
        } else {
          ws.close(1008, 'Authentication failed');
        }
      }).catch(error => {
        console.error('Authentication error:', error);
        ws.close(1011, 'Authentication error');
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket Server error:', error);
    });
  }

  private async authenticateConnection(ws: WebSocket, request: any): Promise<boolean> {
    try {
      const url = new URL(request.url || '', 'ws://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, this.config.jwtSecret) as any;
      (ws as AuthenticatedWebSocket).user = {
        username: decoded.username,
        role: decoded.role
      };
      
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  private handleAuthenticatedConnection(ws: AuthenticatedWebSocket): void {
    ws.isAlive = true;
    this.clients.add(ws);
    
    console.log(`✅ Authenticated WebSocket connection for user: ${ws.user.username}`);

    // Send welcome message
    this.sendToClient(ws, {
      type: 'welcome',
      message: 'Connected to OpenTrust Protocol Witness WebSocket',
      user: ws.user,
      timestamp: new Date().toISOString()
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Invalid message format:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`👋 WebSocket client disconnected: ${ws.user.username}`);
    });

    // Handle ping/pong for connection health
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send initial dashboard metrics
    this.sendDashboardMetrics(ws);
  }

  private async handleClientMessage(ws: AuthenticatedWebSocket, message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'subscribe':
          await this.handleSubscription(ws, message);
          break;
          
        case 'unsubscribe':
          await this.handleUnsubscription(ws, message);
          break;
          
        case 'get_metrics':
          await this.sendDashboardMetrics(ws);
          break;
          
        case 'get_witness_metrics':
          await this.sendWitnessMetrics(ws, message.witnessId);
          break;
          
        case 'get_witness_analysis':
          await this.sendWitnessAnalysis(ws, message.witnessId);
          break;
          
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error: any) {
      console.error('Error handling client message:', error);
      this.sendError(ws, error.message);
    }
  }

  private async handleSubscription(ws: AuthenticatedWebSocket, message: any): Promise<void> {
    const { channel } = message;
    
    // Store subscription (simplified - in production use proper subscription management)
    (ws as any).subscriptions = (ws as any).subscriptions || new Set();
    (ws as any).subscriptions.add(channel);
    
    this.sendToClient(ws, {
      type: 'subscription_confirmed',
      channel,
      timestamp: new Date().toISOString()
    });

    // Send current data for the subscribed channel
    switch (channel) {
      case 'dashboard_metrics':
        await this.sendDashboardMetrics(ws);
        break;
      case 'all_witness_metrics':
        await this.sendAllWitnessMetrics(ws);
        break;
    }
  }

  private async handleUnsubscription(ws: AuthenticatedWebSocket, message: any): Promise<void> {
    const { channel } = message;
    
    (ws as any).subscriptions = (ws as any).subscriptions || new Set();
    (ws as any).subscriptions.delete(channel);
    
    this.sendToClient(ws, {
      type: 'unsubscription_confirmed',
      channel,
      timestamp: new Date().toISOString()
    });
  }

  private async sendDashboardMetrics(ws: AuthenticatedWebSocket): Promise<void> {
    try {
      const metrics = await this.dashboard.getCurrentMetrics();
      this.sendToClient(ws, {
        type: 'dashboard_metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to get dashboard metrics: ${error.message}`);
    }
  }

  private async sendWitnessMetrics(ws: AuthenticatedWebSocket, witnessId: string): Promise<void> {
    try {
      const witness = this.witnesses.get(witnessId);
      if (!witness) {
        this.sendError(ws, `Witness '${witnessId}' not found`);
        return;
      }

      const metrics = await witness.getRealTimeMetrics();
      this.sendToClient(ws, {
        type: 'witness_metrics',
        witnessId,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to get witness metrics: ${error.message}`);
    }
  }

  private async sendWitnessAnalysis(ws: AuthenticatedWebSocket, witnessId: string): Promise<void> {
    try {
      const witness = this.witnesses.get(witnessId);
      if (!witness) {
        this.sendError(ws, `Witness '${witnessId}' not found`);
        return;
      }

      const analysis = await witness.getPerformanceAnalysis();
      this.sendToClient(ws, {
        type: 'witness_analysis',
        witnessId,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to get witness analysis: ${error.message}`);
    }
  }

  private async sendAllWitnessMetrics(ws: AuthenticatedWebSocket): Promise<void> {
    try {
      const allMetrics = {};
      
      for (const [witnessId, witness] of this.witnesses) {
        try {
          const metrics = await witness.getRealTimeMetrics();
          (allMetrics as any)[witnessId] = metrics;
        } catch (error) {
          console.warn(`Failed to get metrics for witness ${witnessId}:`, error);
        }
      }

      this.sendToClient(ws, {
        type: 'all_witness_metrics',
        data: allMetrics,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to get all witness metrics: ${error.message}`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(ws => {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          console.log(`💔 Terminated dead WebSocket connection: ${ws.user.username}`);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.heartbeatInterval);
  }

  private startMetricsBroadcast(): void {
    this.metricsBroadcastInterval = setInterval(async () => {
      if (this.clients.size === 0) return;

      try {
        const metrics = await this.dashboard.getCurrentMetrics();
        
        this.broadcastToSubscribers('dashboard_metrics', {
          type: 'dashboard_metrics_update',
          data: metrics,
          timestamp: new Date().toISOString()
        });

        // Broadcast individual witness metrics
        for (const [witnessId, witness] of this.witnesses) {
          try {
            const witnessMetrics = await witness.getRealTimeMetrics();
            
            this.broadcastToSubscribers(`witness_${witnessId}_metrics`, {
              type: 'witness_metrics_update',
              witnessId,
              data: witnessMetrics,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.warn(`Failed to broadcast metrics for witness ${witnessId}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to broadcast metrics:', error);
      }
    }, 5000); // Broadcast every 5 seconds
  }

  private broadcastToSubscribers(channel: string, message: any): void {
    this.clients.forEach(ws => {
      const subscriptions = (ws as any).subscriptions || new Set();
      
      if (subscriptions.has(channel) || subscriptions.has('all')) {
        this.sendToClient(ws, message);
      }
    });
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to client:', error);
        this.clients.delete(ws);
      }
    }
  }

  private sendError(ws: AuthenticatedWebSocket, message: string): void {
    this.sendToClient(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast a custom message to all connected clients
   */
  public broadcast(message: any): void {
    this.clients.forEach(ws => {
      this.sendToClient(ws, {
        ...message,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    uptime: number;
  } {
    return {
      totalConnections: this.clients.size,
      authenticatedConnections: this.clients.size,
      uptime: process.uptime()
    };
  }
}
