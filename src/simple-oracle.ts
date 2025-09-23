/**
 * OpenTrust Protocol Oracle - Simplified Version
 * 
 * @version 1.0.0
 * @author OpenTrust Protocol Team
 */

export class SimpleOracle {
  private data: Map<string, any> = new Map();

  constructor(
    public readonly oracleId: string,
    public readonly version: string = '1.0.0'
  ) {}

  async recordOutcome(judgmentId: string, outcome: any): Promise<void> {
    this.data.set(judgmentId, {
      ...outcome,
      timestamp: new Date().toISOString(),
      oracleId: this.oracleId
    });
    console.log(`✅ Oracle ${this.oracleId} recorded outcome for judgment ${judgmentId}`);
  }

  async getOutcome(judgmentId: string): Promise<any> {
    return this.data.get(judgmentId);
  }

  getStatistics(): any {
    return {
      totalOutcomes: this.data.size,
      oracleId: this.oracleId,
      version: this.version,
      lastUpdated: new Date().toISOString()
    };
  }
}

export class TradingOracle extends SimpleOracle {
  constructor(oracleId: string) {
    super(oracleId, '1.0.0');
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

export class MedicalOracle extends SimpleOracle {
  constructor(oracleId: string) {
    super(oracleId, '1.0.0');
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

export function createTradingOracle(oracleId: string): TradingOracle {
  return new TradingOracle(oracleId);
}

export function createMedicalOracle(oracleId: string): MedicalOracle {
  return new MedicalOracle(oracleId);
}

export const VERSION = '1.0.0';

export default {
  SimpleOracle,
  TradingOracle,
  MedicalOracle,
  createTradingOracle,
  createMedicalOracle,
  VERSION
};
