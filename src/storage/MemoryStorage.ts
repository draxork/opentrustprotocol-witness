/**
 * OpenTrust Protocol Witness - Memory Storage
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
  private witnessIndex: Map<string, Set<string>> = new Map();

  async savePair(pair: JudgmentPair): Promise<void> {
    const key = pair.decision.judgment_id;
    this.storage.set(key, pair);
    
    // Update witness index
    const witnessId = pair.outcome.witness_source;
    if (!this.witnessIndex.has(witnessId)) {
      this.witnessIndex.set(witnessId, new Set());
    }
    this.witnessIndex.get(witnessId)!.add(key);
  }

  async getPair(judgmentId: string): Promise<JudgmentPair | null> {
    return this.storage.get(judgmentId) || null;
  }

  async getPairsByWitness(witnessId: string): Promise<JudgmentPair[]> {
    const judgmentIds = this.witnessIndex.get(witnessId);
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
    const witnessCount = this.witnessIndex.size;
    
    const timestamps = Array.from(this.storage.values())
      .map(pair => new Date(pair.decision.timestamp).getTime());
    
    const stats: StorageStats = {
      totalPairs,
      witnessCount,
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
        // Remove from witness index
        const witnessId = pair.outcome.witness_source;
        const witnessSet = this.witnessIndex.get(witnessId);
        if (witnessSet) {
          witnessSet.delete(key);
          if (witnessSet.size === 0) {
            this.witnessIndex.delete(witnessId);
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