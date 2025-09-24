/**
 * OpenTrust Protocol Witness - PostgreSQL Storage
 * 
 * Production-ready PostgreSQL storage implementation with connection pooling,
 * migrations, and advanced querying capabilities.
 * 
 * @version 4.0.0
 * @author OpenTrust Protocol Team
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { 
  JudgmentPair, 
  JudgmentPairStorage, 
  StorageStats 
} from '../types/index';

export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgreSQLStorage implements JudgmentPairStorage {
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor(config: PostgreSQLConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl || false,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    this.pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  /**
   * Initialize database tables and indexes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const client = await this.pool.connect();
    
    try {
      // Create judgment_pairs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS judgment_pairs (
          id SERIAL PRIMARY KEY,
          decision_judgment_id VARCHAR(255) NOT NULL,
          decision_t FLOAT NOT NULL,
          decision_i FLOAT NOT NULL,
          decision_f FLOAT NOT NULL,
          decision_timestamp TIMESTAMP NOT NULL,
          decision_context JSONB,
          decision_mapper_id VARCHAR(255),
          outcome_judgment_id VARCHAR(255) NOT NULL,
          outcome_links_to_judgment_id VARCHAR(255) NOT NULL,
          outcome_t FLOAT NOT NULL,
          outcome_i FLOAT NOT NULL,
          outcome_f FLOAT NOT NULL,
          outcome_type VARCHAR(50) NOT NULL,
          outcome_witness_source VARCHAR(255) NOT NULL,
          outcome_timestamp TIMESTAMP NOT NULL,
          outcome_provenance_chain JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_judgment_pairs_decision_id 
        ON judgment_pairs(decision_judgment_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_judgment_pairs_witness_source 
        ON judgment_pairs(outcome_witness_source)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_judgment_pairs_outcome_type 
        ON judgment_pairs(outcome_type)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_judgment_pairs_timestamps 
        ON judgment_pairs(decision_timestamp, outcome_timestamp)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_judgment_pairs_mapper_id 
        ON judgment_pairs(decision_mapper_id)
      `);

      // Create witness_stats table for caching
      await client.query(`
        CREATE TABLE IF NOT EXISTS witness_stats (
          witness_id VARCHAR(255) PRIMARY KEY,
          total_judgments INTEGER DEFAULT 0,
          successful_judgments INTEGER DEFAULT 0,
          average_confidence FLOAT DEFAULT 0,
          average_indeterminacy FLOAT DEFAULT 0,
          last_activity TIMESTAMP,
          performance_grade VARCHAR(10),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.isInitialized = true;
      console.log('✅ PostgreSQL storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL storage:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save a judgment pair to the database
   */
  async savePair(pair: JudgmentPair): Promise<void> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert judgment pair
      const insertQuery = `
        INSERT INTO judgment_pairs (
          decision_judgment_id, decision_t, decision_i, decision_f,
          decision_timestamp, decision_context, decision_mapper_id,
          outcome_judgment_id, outcome_links_to_judgment_id,
          outcome_t, outcome_i, outcome_f, outcome_type,
          outcome_witness_source, outcome_timestamp, outcome_provenance_chain
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (decision_judgment_id) DO UPDATE SET
          decision_t = EXCLUDED.decision_t,
          decision_i = EXCLUDED.decision_i,
          decision_f = EXCLUDED.decision_f,
          decision_timestamp = EXCLUDED.decision_timestamp,
          decision_context = EXCLUDED.decision_context,
          decision_mapper_id = EXCLUDED.decision_mapper_id,
          outcome_judgment_id = EXCLUDED.outcome_judgment_id,
          outcome_links_to_judgment_id = EXCLUDED.outcome_links_to_judgment_id,
          outcome_t = EXCLUDED.outcome_t,
          outcome_i = EXCLUDED.outcome_i,
          outcome_f = EXCLUDED.outcome_f,
          outcome_type = EXCLUDED.outcome_type,
          outcome_witness_source = EXCLUDED.outcome_witness_source,
          outcome_timestamp = EXCLUDED.outcome_timestamp,
          outcome_provenance_chain = EXCLUDED.outcome_provenance_chain,
          updated_at = CURRENT_TIMESTAMP
      `;

      const values = [
        pair.decision.judgment_id,
        pair.decision.judgment.T,
        pair.decision.judgment.I,
        pair.decision.judgment.F,
        new Date(pair.decision.timestamp),
        JSON.stringify(pair.decision.context),
        pair.decision.mapper_id || null,
        pair.outcome.judgment_id,
        pair.outcome.outcome_judgment.links_to_judgment_id,
        pair.outcome.outcome_judgment.T,
        pair.outcome.outcome_judgment.I,
        pair.outcome.outcome_judgment.F,
        pair.outcome.outcome_judgment.outcome_type,
        pair.outcome.witness_source,
        new Date(pair.outcome.timestamp),
        JSON.stringify(pair.outcome.outcome_judgment.provenance_chain)
      ];

      await client.query(insertQuery, values);

      // Update witness stats
      await this.updateWitnessStats(client, pair.outcome.witness_source);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to save judgment pair:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a judgment pair by decision ID
   */
  async getPair(judgmentId: string): Promise<JudgmentPair | null> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM judgment_pairs 
        WHERE decision_judgment_id = $1
      `;

      const result: QueryResult = await client.query(query, [judgmentId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToJudgmentPair(result.rows[0]);
    } catch (error) {
      console.error('Failed to get judgment pair:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all judgment pairs for a specific witness
   */
  async getPairsByWitness(witnessId: string): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM judgment_pairs 
        WHERE outcome_witness_source = $1
        ORDER BY decision_timestamp DESC
      `;

      const result: QueryResult = await client.query(query, [witnessId]);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get pairs by witness:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get judgment pairs by judgment ID (can be decision or outcome)
   */
  async getPairsByJudgmentId(judgmentId: string): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM judgment_pairs 
        WHERE decision_judgment_id = $1 OR outcome_judgment_id = $1
        ORDER BY decision_timestamp DESC
      `;

      const result: QueryResult = await client.query(query, [judgmentId]);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get pairs by judgment ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get judgment pairs with optional time range and context filtering
   */
  async getJudgmentPairs(
    timeRange?: { start: Date; end: Date },
    context?: string
  ): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT * FROM judgment_pairs 
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (timeRange) {
        query += ` AND decision_timestamp >= $${paramIndex} AND decision_timestamp <= $${paramIndex + 1}`;
        params.push(timeRange.start, timeRange.end);
        paramIndex += 2;
      }

      if (context) {
        query += ` AND decision_context->>'context' = $${paramIndex}`;
        params.push(context);
        paramIndex += 1;
      }

      query += ` ORDER BY decision_timestamp DESC`;

      const result: QueryResult = await client.query(query, params);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get judgment pairs:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get judgment pairs by mapper ID
   */
  async getJudgmentPairsByMapper(
    mapperId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT * FROM judgment_pairs 
        WHERE decision_mapper_id = $1
      `;
      const params: any[] = [mapperId];
      let paramIndex = 2;

      if (timeRange) {
        query += ` AND decision_timestamp >= $${paramIndex} AND decision_timestamp <= $${paramIndex + 1}`;
        params.push(timeRange.start, timeRange.end);
        paramIndex += 2;
      }

      query += ` ORDER BY decision_timestamp DESC`;

      const result: QueryResult = await client.query(query, params);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get pairs by mapper:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      // Get total pairs
      const totalResult = await client.query('SELECT COUNT(*) as count FROM judgment_pairs');
      const totalPairs = parseInt(totalResult.rows[0].count);

      // Get witness count
      const witnessResult = await client.query(`
        SELECT COUNT(DISTINCT outcome_witness_source) as count 
        FROM judgment_pairs
      `);
      const witnessCount = parseInt(witnessResult.rows[0].count);

      // Get timestamp range
      const timestampResult = await client.query(`
        SELECT 
          MIN(decision_timestamp) as oldest,
          MAX(decision_timestamp) as newest,
          COUNT(decision_timestamp) as count
        FROM judgment_pairs
      `);

      const oldestTimestamp = timestampResult.rows[0].oldest ? 
        new Date(timestampResult.rows[0].oldest) : undefined;
      const newestTimestamp = timestampResult.rows[0].newest ? 
        new Date(timestampResult.rows[0].newest) : undefined;
      const timestampCount = parseInt(timestampResult.rows[0].count);

      // Estimate memory usage (rough calculation)
      const memoryUsage = totalPairs * 2000; // ~2KB per pair

      const result: StorageStats = {
        totalPairs,
        witnessCount,
        timestampCount,
        memoryUsage,
        ...(oldestTimestamp && { oldestTimestamp }),
        ...(newestTimestamp && { newestTimestamp })
      };
      
      return result;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup old data
   */
  async cleanup(olderThanMs: number): Promise<number> {
    await this.initialize();

    const client = await this.pool.connect();
    const cutoffDate = new Date(Date.now() - olderThanMs);
    
    try {
      const result = await client.query(`
        DELETE FROM judgment_pairs 
        WHERE decision_timestamp < $1
      `, [cutoffDate]);

      const deletedCount = result.rowCount || 0;
      console.log(`🧹 Cleaned up ${deletedCount} old judgment pairs`);
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Advanced querying methods
   */
  async getPairsByDateRange(startDate: Date, endDate: Date): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM judgment_pairs 
        WHERE decision_timestamp BETWEEN $1 AND $2
        ORDER BY decision_timestamp DESC
      `;

      const result: QueryResult = await client.query(query, [startDate, endDate]);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get pairs by date range:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPairsByOutcomeType(outcomeType: string): Promise<JudgmentPair[]> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT * FROM judgment_pairs 
        WHERE outcome_type = $1
        ORDER BY decision_timestamp DESC
      `;

      const result: QueryResult = await client.query(query, [outcomeType]);
      
      return result.rows.map(row => this.mapRowToJudgmentPair(row));
    } catch (error) {
      console.error('Failed to get pairs by outcome type:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getWitnessPerformanceStats(witnessId: string): Promise<any> {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_judgments,
          COUNT(CASE WHEN outcome_type IN ('success', 'trading_success', 'medical_success') THEN 1 END) as successful_judgments,
          AVG(decision_t) as average_confidence,
          AVG(decision_i) as average_indeterminacy,
          AVG(decision_f) as average_falsity,
          MIN(decision_timestamp) as first_activity,
          MAX(decision_timestamp) as last_activity
        FROM judgment_pairs 
        WHERE outcome_witness_source = $1
      `;

      const result: QueryResult = await client.query(query, [witnessId]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Failed to get witness performance stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 PostgreSQL connection pool closed');
  }

  // Private helper methods

  private async updateWitnessStats(client: PoolClient, witnessId: string): Promise<void> {
    try {
      const stats = await this.getWitnessPerformanceStats(witnessId);
      
      if (!stats) {
        console.warn(`No stats available for witness ${witnessId}`);
        return;
      }
      
      await client.query(`
        INSERT INTO witness_stats (
          witness_id, total_judgments, successful_judgments,
          average_confidence, average_indeterminacy, last_activity,
          performance_grade, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (witness_id) DO UPDATE SET
          total_judgments = EXCLUDED.total_judgments,
          successful_judgments = EXCLUDED.successful_judgments,
          average_confidence = EXCLUDED.average_confidence,
          average_indeterminacy = EXCLUDED.average_indeterminacy,
          last_activity = EXCLUDED.last_activity,
          performance_grade = EXCLUDED.performance_grade,
          updated_at = CURRENT_TIMESTAMP
      `, [
        witnessId,
        parseInt(stats.total_judgments),
        parseInt(stats.successful_judgments),
        parseFloat(stats.average_confidence),
        parseFloat(stats.average_indeterminacy),
        stats.last_activity,
        this.calculatePerformanceGrade(parseFloat(stats.successful_judgments) / parseFloat(stats.total_judgments))
      ]);
    } catch (error) {
      console.warn('Failed to update witness stats:', error);
    }
  }

  private mapRowToJudgmentPair(row: any): JudgmentPair {
    return {
      decision: {
        judgment_id: row.decision_judgment_id,
        judgment: {
          T: parseFloat(row.decision_t),
          I: parseFloat(row.decision_i),
          F: parseFloat(row.decision_f),
          provenance_chain: []
        } as any,
        timestamp: row.decision_timestamp.toISOString(),
        context: row.decision_context || {},
        mapper_id: row.decision_mapper_id
      },
      outcome: {
        judgment_id: row.outcome_judgment_id,
        outcome_judgment: {
          judgment_id: row.outcome_judgment_id,
          links_to_judgment_id: row.outcome_links_to_judgment_id,
          T: parseFloat(row.outcome_t),
          I: parseFloat(row.outcome_i),
          F: parseFloat(row.outcome_f),
          outcome_type: row.outcome_type,
          witness_source: row.outcome_witness_source,
          provenance_chain: row.outcome_provenance_chain || []
        },
        timestamp: row.outcome_timestamp.toISOString(),
        witness_source: row.outcome_witness_source
      }
    };
  }

  private calculatePerformanceGrade(successRate: number): string {
    if (successRate >= 0.95) return 'A+';
    if (successRate >= 0.85) return 'A';
    if (successRate >= 0.70) return 'B';
    if (successRate >= 0.55) return 'C';
    return 'D';
  }
}
