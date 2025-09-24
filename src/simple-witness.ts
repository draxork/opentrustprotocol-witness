/**
 * OpenTrust Protocol Witness - Simplified Version
 * 
 * @version 1.0.0
 * @author OpenTrust Protocol Team
 */

export class SimpleWitness {
  private data: Map<string, any> = new Map();

  constructor(
    public readonly witnessId: string,
    public readonly version: string = '1.0.0'
  ) {}

  async recordOutcome(judgmentId: string, outcome: any): Promise<void> {
    this.data.set(judgmentId, {
      ...outcome,
      timestamp: new Date().toISOString(),
      witnessId: this.witnessId
    });
    console.log(`✅ Witness ${this.witnessId} recorded outcome for judgment ${judgmentId}`);
  }

  async getOutcome(judgmentId: string): Promise<any> {
    return this.data.get(judgmentId);
  }

  getStatistics(): any {
    return {
      totalOutcomes: this.data.size,
      witnessId: this.witnessId,
      version: this.version,
      lastUpdated: new Date().toISOString()
    };
  }
}

export class TradingWitness extends SimpleWitness {
  constructor(witnessId: string) {
    super(witnessId, '1.0.0');
  }

  async recordTrade(judgmentId: string, pair: string, profit: number): Promise<void> {
    const outcome = {
      type: 'trading',
      pair,
      profit,
      success: profit > 0
    };
    await this.recordOutcome(judgmentId, outcome);
  }
}

export class MedicalWitness extends SimpleWitness {
  constructor(witnessId: string) {
    super(witnessId, '1.0.0');
  }

  async recordTreatment(judgmentId: string, condition: string, success: boolean): Promise<void> {
    const outcome = {
      type: 'medical',
      condition,
      success,
      recoveryTime: success ? 14 : 0
    };
    await this.recordOutcome(judgmentId, outcome);
  }
}

export function createTradingWitness(witnessId: string): TradingWitness {
  return new TradingWitness(witnessId);
}

export function createMedicalWitness(witnessId: string): MedicalWitness {
  return new MedicalWitness(witnessId);
}

export const VERSION = '1.0.0';

export default {
  SimpleWitness,
  TradingWitness,
  MedicalWitness,
  createTradingWitness,
  createMedicalWitness,
  VERSION
};
