/**
 * OpenTrust Protocol Oracle - Memory Storage
 * 
 * In-memory storage implementation for judgment pairs.
 * 
 * @version 2.0.0
 */

import {
  JudgmentPair,
  JudgmentPairStorage,
  StorageStats
} from '../types/index';

export class MemoryStorage implements JudgmentPairStorage {
  private storage: Map<string, JudgmentPair> = new Map();
  private oracleIndex: Map<string, Set<string>> = new Map();

  async savePair(pair: JudgmentPair): Promise<void> {
    const key = pair.decision.judgment_id;
    this.storage.set(key, pair);
    
    // Update oracle index
    const oracleId = pair.outcome.oracle_source;
    if (!this.oracleIndex.has(oracleId)) {
      this.oracleIndex.set(oracleId, new Set());
    }
    this.oracleIndex.get(oracleId)!.add(key);
  }

  async getPair(judgmentId: string): Promise<JudgmentPair | null> {
    return this.storage.get(judgmentId) || null;
  }

  async getPairsByOracle(oracleId: string): Promise<JudgmentPair[]> {
    const judgmentIds = this.oracleIndex.get(oracleId);
    if (!judgmentIds) return [];
    
    return Array.from(judgmentIds)
      .map(id => this.storage.get(id))
      .filter((pair): pair is JudgmentPair => pair !== undefined);
  }

  async getPairsByJudgmentId(judgmentId: string): Promise<JudgmentPair[]> {
    const pair = await this.getPair(judgmentId);
    return pair ? [pair] : [];
  }

  async getJudgmentPairs(
    timeRange?: { start: Date; end: Date },
    context?: string
  ): Promise<JudgmentPair[]> {
    let pairs = Array.from(this.storage.values());
    
    if (timeRange) {
      pairs = pairs.filter(pair => {
        const timestamp = new Date(pair.decision.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }
    
    if (context) {
      pairs = pairs.filter(pair => 
        pair.decision.context && pair.decision.context['context'] === context
      );
    }
    
    return pairs.sort((a, b) => 
      new Date(b.decision.timestamp).getTime() - new Date(a.decision.timestamp).getTime()
    );
  }

  async getJudgmentPairsByMapper(
    mapperId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<JudgmentPair[]> {
    let pairs = Array.from(this.storage.values())
      .filter(pair => pair.decision.mapper_id === mapperId);
    
    if (timeRange) {
      pairs = pairs.filter(pair => {
        const timestamp = new Date(pair.decision.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      });
    }
    
    return pairs.sort((a, b) => 
      new Date(b.decision.timestamp).getTime() - new Date(a.decision.timestamp).getTime()
    );
  }

  async getStorageStats(): Promise<StorageStats> {
    const totalPairs = this.storage.size;
    const oracleCount = this.oracleIndex.size;
    
    const timestamps = Array.from(this.storage.values())
      .map(pair => new Date(pair.decision.timestamp).getTime());
    
    const stats: StorageStats = {
      totalPairs,
      oracleCount,
      timestampCount: timestamps.length,
      memoryUsage: this.estimateMemoryUsage()
    };

    if (timestamps.length > 0) {
      stats.oldestTimestamp = new Date(Math.min(...timestamps));
      stats.newestTimestamp = new Date(Math.max(...timestamps));
    }

    return stats;
  }

  async cleanup(olderThanMs: number): Promise<number> {
    const cutoffTime = Date.now() - olderThanMs;
    let cleanedCount = 0;

    for (const [key, pair] of this.storage.entries()) {
      const pairTime = new Date(pair.decision.timestamp).getTime();
      if (pairTime < cutoffTime) {
        // Remove from oracle index
        const oracleId = pair.outcome.oracle_source;
        const oracleSet = this.oracleIndex.get(oracleId);
        if (oracleSet) {
          oracleSet.delete(key);
          if (oracleSet.size === 0) {
            this.oracleIndex.delete(oracleId);
          }
        }
        
        // Remove from storage
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    const avgPairSize = 1000; // bytes
    return this.storage.size * avgPairSize;
  }
}