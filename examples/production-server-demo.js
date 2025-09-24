/**
 * OpenTrust Protocol Witness - Production Server Demo
 * 
 * Complete demonstration of the production-ready Witness server
 * with PostgreSQL storage, REST API, WebSocket, and Docker.
 */

const { WitnessServer, createDefaultConfig } = require('../dist/server.js');
const jwt = require('jsonwebtoken');

async function productionServerDemo() {
  console.log('🚀 OpenTrust Protocol Witness - Production Server Demo\n');

  // Create server configuration
  const config = {
    api: {
      port: 3000,
      jwtSecret: 'demo-jwt-secret-key',
      corsOrigins: ['http://localhost:3000', 'http://localhost:8080'],
      rateLimitWindowMs: 900000, // 15 minutes
      rateLimitMax: 100,
      postgresConfig: {
        host: 'localhost',
        port: 5432,
        database: 'opentrust_witness_demo',
        username: 'demo_user',
        password: 'demo_password',
        ssl: false
      }
    },
    websocket: {
      port: 8080,
      jwtSecret: 'demo-jwt-secret-key',
      heartbeatInterval: 30000 // 30 seconds
    },
    postgres: {
      host: 'localhost',
      port: 5432,
      database: 'opentrust_witness_demo',
      username: 'demo_user',
      password: 'demo_password',
      ssl: false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  };

  console.log('📋 Server Configuration:');
  console.log(`   • API Port: ${config.api.port}`);
  console.log(`   • WebSocket Port: ${config.websocket.port}`);
  console.log(`   • Database: ${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`);
  console.log(`   • CORS Origins: ${config.api.corsOrigins.join(', ')}\n`);

  try {
    // Create and start the server
    const server = new WitnessServer(config);
    
    console.log('🔄 Starting Witness Server...');
    await server.start();

    // Wait a moment for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 Server Statistics:');
    const stats = server.getStats();
    console.log(`   • API Server: Port ${stats.api.port}, Uptime ${stats.api.uptime.toFixed(2)}s`);
    console.log(`   • WebSocket Server: Port ${stats.websocket.port}, Connections ${stats.websocket.connections}`);
    console.log(`   • PostgreSQL: ${stats.postgres.host}:${stats.postgres.port}/${stats.postgres.database}`);

    console.log('\n🔐 Authentication Demo:');
    const token = jwt.sign(
      { username: 'demo_user', role: 'admin' },
      config.api.jwtSecret,
      { expiresIn: '24h' }
    );
    console.log(`   • JWT Token: ${token.substring(0, 50)}...`);
    console.log(`   • WebSocket URL: ws://localhost:${config.websocket.port}?token=${token}`);

    console.log('\n📚 Available API Endpoints:');
    console.log('   • GET  /health - Health check');
    console.log('   • GET  /api-docs - API documentation');
    console.log('   • POST /api/witnesss - Create Witness');
    console.log('   • GET  /api/witnesss - List Witnesss');
    console.log('   • GET  /api/witnesss/:id/metrics - Get Witness metrics');
    console.log('   • POST /api/witnesss/:id/outcomes - Record outcome');
    console.log('   • GET  /api/dashboard/metrics - Dashboard metrics');
    console.log('   • GET  /api/storage/stats - Storage statistics');

    console.log('\n🔌 WebSocket Events:');
    console.log('   • subscribe - Subscribe to real-time updates');
    console.log('   • get_metrics - Get current dashboard metrics');
    console.log('   • get_witness_metrics - Get specific witness metrics');
    console.log('   • ping/pong - Connection health check');

    console.log('\n🐳 Docker Deployment:');
    console.log('   • docker-compose up - Start complete environment');
    console.log('   • docker-compose up --profile monitoring - With monitoring');
    console.log('   • docker-compose up --profile production - Production setup');

    console.log('\n📈 Production Features:');
    console.log('   ✅ PostgreSQL with connection pooling');
    console.log('   ✅ REST API with authentication & rate limiting');
    console.log('   ✅ WebSocket for real-time metrics');
    console.log('   ✅ Docker containerization');
    console.log('   ✅ Health checks and monitoring');
    console.log('   ✅ Graceful shutdown handling');
    console.log('   ✅ Swagger API documentation');
    console.log('   ✅ CORS and security headers');
    console.log('   ✅ Request logging and error handling');

    console.log('\n🎉 Production Server Demo Running Successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Set up PostgreSQL database');
    console.log('   2. Configure environment variables');
    console.log('   3. Run: docker-compose up');
    console.log('   4. Access: http://localhost:3000/api-docs');
    console.log('   5. Connect WebSocket: ws://localhost:8080?token=<jwt>');

    // Keep server running
    console.log('\n⏳ Server is running... Press Ctrl+C to stop');
    
    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
}

// Run the demo
productionServerDemo();
