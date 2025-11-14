export interface TeamData<T> {
  h: T;
  a: T;
}

export interface PreMatchProbs {
    home: number;
    draw: number;
    away: number;
    margin: number;
}

export interface PreMatchOdds {
  h: number;
  d: number;
  a: number;
  probs: PreMatchProbs | null;
}

export interface HistoricalAverages {
  hgf: string;
  hgc: string;
  agf: string;
  agc: string;
}

export interface LiveStats {
  attacks: TeamData<number>;
  dangerousAttacks: TeamData<number>;
  onTarget: TeamData<number>;
  offTarget: TeamData<number>;
  corners: TeamData<number>;
  possession: TeamData<number>;
  yellowCards: TeamData<number>;
  redCards: TeamData<number>;
  score: TeamData<number>;
  minute: number;
}

export interface MostProbableResult {
    score: string;
    probability: number;
}

export interface PoissonPrediction {
    expectedGoalsHome: number;
    expectedGoalsAway: number;
    probHomeWin: number;

    probDraw: number;
    probAwayWin: number;
    probOver25: number;
    probBTTS: number;
    mostProbableResults: MostProbableResult[];
}

export interface LiveAnalysis {
    dominance: {
        home: number;
        away: number;
        difference: number;
        maxHome: number;
        maxAway: number;
        newMaxHome: boolean;
        newMaxAway: boolean;
    };
    momentum: TeamData<number>;
    ratios: {
        precisionHome: number;
        precisionAway: number;
    };
    history: {
        home: string[];
        away: string[];
    }
}

export interface DominancePoint {
    minute: number;
    difference: number;
}

export interface TradingSuggestion {
    title: string;
    reasoning: string;
}