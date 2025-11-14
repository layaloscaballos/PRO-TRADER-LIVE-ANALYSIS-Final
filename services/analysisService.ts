import { LiveStats, PreMatchOdds, PreMatchProbs, PoissonPrediction, LiveAnalysis, MostProbableResult } from '../types';

// ===================================
// Auto-fill Data Parser
// ===================================
export const parseScoreTrendText = (text: string): { preMatchOdds?: Partial<PreMatchOdds>, liveStats?: LiveStats } => {
    if (!text.trim()) throw new Error('Input text is empty.');
    
    const result: { preMatchOdds?: Partial<PreMatchOdds>, liveStats?: LiveStats } = {};
    const parsedLiveStats: Partial<LiveStats> = {};

    const oddsRegex = /(?:Pre-partido|Pre-match)[\s\S]*?1\s+X\s+2[^\n\r]*\n\s*(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/;
    const oddsMatch = text.match(oddsRegex);
    if (oddsMatch) {
        result.preMatchOdds = { h: parseFloat(oddsMatch[1]), d: parseFloat(oddsMatch[2]), a: parseFloat(oddsMatch[3]) };
    }
    
    const mainInfoRegex = /\s*(\d+):(\d+)\s*\n\s*\(.*?\)\n\s*(\d{1,2}):\d{2}/;
    const mainInfoMatch = text.match(mainInfoRegex);
    if (mainInfoMatch) {
        parsedLiveStats.score = { h: parseInt(mainInfoMatch[1]), a: parseInt(mainInfoMatch[2]) };
        parsedLiveStats.minute = parseInt(mainInfoMatch[3]);
    }

    const statsSectionIndex = text.search(/Estadísticas en vivo|Stats Live/i);
    if (statsSectionIndex > -1) {
        const statsSectionText = text.substring(statsSectionIndex);
        const lines = statsSectionText.split('\n').map(l => l.trim()).filter(Boolean);

        const statsMap: { [key: string]: keyof Omit<LiveStats, 'score' | 'minute'> } = {
            'Ataques Peligrosos': 'dangerousAttacks',
            'Dangerous Attacks': 'dangerousAttacks',
            'Ataques': 'attacks',
            'Attacks': 'attacks',
            'Tiros a Portería': 'onTarget',
            'Shots On Target': 'onTarget',
            'Tiros Fuera': 'offTarget',
            'Shots Off Target': 'offTarget',
            'Córners': 'corners',
            'Corners': 'corners',
            'Posesión del Balón': 'possession',
            'Ball Possession': 'possession',
            'Tarjetas Amarillas': 'yellowCards',
            'Yellow Cards': 'yellowCards',
            'Tarjetas Rojas': 'redCards',
            'Red Cards': 'redCards',
        };

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const valH_str = lines[i + 1];
            const valA_str = lines[i + 2];
            
            if (isNaN(parseFloat(currentLine)) && valH_str && !isNaN(parseFloat(valH_str)) && valA_str && !isNaN(parseFloat(valA_str))) {
                const statKey = Object.keys(statsMap).find(key => currentLine.includes(key));
                if (statKey) {
                    const mappedKey = statsMap[statKey];
                    // This logic prevents 'Attacks' from overwriting the more specific 'Dangerous Attacks' if it has already been parsed.
                    if (!(mappedKey === 'attacks' && parsedLiveStats.dangerousAttacks)) {
                         (parsedLiveStats as any)[mappedKey] = {
                            h: parseInt(valH_str),
                            a: parseInt(valA_str)
                        };
                    }
                }
                i += 2;
            }
        }
    }

    // Fallback logic if the main regex fails to find score or minute
    if (!parsedLiveStats.score || !parsedLiveStats.minute) {
        const fallbackScoreRegex = /Marcador\s*(\d+)\s*-\s*(\d+)/i;
        const fallbackMinuteRegex = /Minuto de Juego\s*(\d+)/i;
        const scoreMatch = text.match(fallbackScoreRegex) || text.match(/(\d+)\s*-\s*(\d+)(?!:)/);
        const minuteMatch = text.match(fallbackMinuteRegex) || text.match(/(\d{1,2}):\d{2}/) || text.match(/(\d{1,2})'/);

        if(scoreMatch && !parsedLiveStats.score) parsedLiveStats.score = { h: parseInt(scoreMatch[1]), a: parseInt(scoreMatch[2]) };
        if(minuteMatch && !parsedLiveStats.minute) parsedLiveStats.minute = parseInt(minuteMatch[1]);
    }
    
    // Define a complete default structure to merge with parsed data
    const defaults: LiveStats = {
        attacks: { h: 0, a: 0 },
        dangerousAttacks: { h: 0, a: 0 },
        onTarget: { h: 0, a: 0 },
        offTarget: { h: 0, a: 0 },
        corners: { h: 0, a: 0 },
        possession: { h: 0, a: 0 },
        yellowCards: { h: 0, a: 0 },
        redCards: { h: 0, a: 0 },
        score: { h: 0, a: 0 },
        minute: 0
    };

    // Merge parsed data over defaults to ensure a complete, valid LiveStats object
    result.liveStats = {
        attacks: parsedLiveStats.attacks ?? defaults.attacks,
        dangerousAttacks: parsedLiveStats.dangerousAttacks ?? defaults.dangerousAttacks,
        onTarget: parsedLiveStats.onTarget ?? defaults.onTarget,
        offTarget: parsedLiveStats.offTarget ?? defaults.offTarget,
        corners: parsedLiveStats.corners ?? defaults.corners,
        possession: parsedLiveStats.possession ?? defaults.possession,
        yellowCards: parsedLiveStats.yellowCards ?? defaults.yellowCards,
        redCards: parsedLiveStats.redCards ?? defaults.redCards,
        score: parsedLiveStats.score ?? defaults.score,
        minute: parsedLiveStats.minute ?? defaults.minute,
    };
    
    return result;
};


// ===================================
// Pre-Match Analysis
// ===================================
export const calculateProbabilities = (c1: number, cx: number, c2: number): PreMatchProbs => {
    const sumInv = (1 / c1) + (1 / cx) + (1 / c2);
    const margin = (sumInv - 1) * 100;
    return {
        home: (1 / c1) / sumInv,
        draw: (1 / cx) / sumInv,
        away: (1 / c2) / sumInv,
        margin
    };
};

const factorial = (n: number): number => {
    if (n < 0) return -1;
    if (n === 0) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
};

const poissonProbability = (lambda: number, k: number): number => {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

export const calculatePoissonPrediction = (hgf: number, hgc: number, agf: number, agc: number): PoissonPrediction => {
    const lambdaH = (hgf + agc) / 2;
    const lambdaA = (agf + hgc) / 2;
    let p1 = 0, pX = 0, p2 = 0, pO25 = 0, pBTTS = 0;
    const results: MostProbableResult[] = [];

    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const prob = poissonProbability(lambdaH, i) * poissonProbability(lambdaA, j);
            results.push({ score: `${i}-${j}`, probability: prob });
            if (i > j) p1 += prob;
            else if (i === j) pX += prob;
            else p2 += prob;
            if (i + j > 2.5) pO25 += prob;
            if (i > 0 && j > 0) pBTTS += prob;
        }
    }
    results.sort((a, b) => b.probability - a.probability);

    return {
        expectedGoalsHome: lambdaH,
        expectedGoalsAway: lambdaA,
        probHomeWin: p1,
        probDraw: pX,
        probAwayWin: p2,
        probOver25: pO25,
        probBTTS: pBTTS,
        mostProbableResults: results.slice(0, 5)
    };
};

// ===================================
// Live Analysis
// ===================================
export const calculateLiveRendimiento = (stats: LiveStats, prevAnalysis: LiveAnalysis | null): LiveAnalysis => {
    const weights = { onTarget: 3.0, offTarget: 0.5, corners: 1.0, attacks: 0.2, dangerousAttacks: 0.75 };
    
    // Improved attack points calculation: sum weighted non-dangerous and dangerous attacks
    const nonDangerousAttacksH = Math.max(0, stats.attacks.h - stats.dangerousAttacks.h);
    const nonDangerousAttacksA = Math.max(0, stats.attacks.a - stats.dangerousAttacks.a);
    
    const attackPointsH = (stats.dangerousAttacks.h * weights.dangerousAttacks) + (nonDangerousAttacksH * weights.attacks);
    const attackPointsA = (stats.dangerousAttacks.a * weights.dangerousAttacks) + (nonDangerousAttacksA * weights.attacks);

    let pL_raw = (stats.onTarget.h * weights.onTarget) + (stats.offTarget.h * weights.offTarget) + (stats.corners.h * weights.corners) + attackPointsH;
    let pV_raw = (stats.onTarget.a * weights.onTarget) + (stats.offTarget.a * weights.offTarget) + (stats.corners.a * weights.corners) + attackPointsA;

    // Normalization for overall dominance: Divide by minute to get "Intensity" or "Dominance per Minute"
    const minuteFactor = stats.minute > 0 ? stats.minute : 1;
    const pL = pL_raw / minuteFactor;
    const pV = pV_raw / minuteFactor;
    const dif = pL - pV;

    const totalShotsH = stats.onTarget.h + stats.offTarget.h;
    const totalShotsA = stats.onTarget.a + stats.offTarget.a;
    const precisionH = totalShotsH > 0 ? (stats.onTarget.h / totalShotsH) * 100 : 0;
    const precisionA = totalShotsA > 0 ? (stats.onTarget.a / totalShotsA) * 100 : 0;
    
    // REVERTED MOMENTUM CALCULATION: Change in average intensity
    const momentumH = prevAnalysis ? pL - prevAnalysis.dominance.home : 0;
    const momentumA = prevAnalysis ? pV - prevAnalysis.dominance.away : 0;
    
    let maxH = prevAnalysis?.dominance.maxHome ?? 0;
    let maxA = prevAnalysis?.dominance.maxAway ?? 0;
    let newMaxH = false, newMaxA = false;

    if (dif > 0 && dif > maxH) {
        maxH = dif;
        newMaxH = true;
    }
    if (dif < 0 && dif < maxA) {
        maxA = dif;
        newMaxA = true;
    }
    
    return {
        dominance: {
            home: pL, away: pV, difference: dif,
            maxHome: maxH, maxAway: maxA, newMaxHome: newMaxH, newMaxAway: newMaxA,
        },
        momentum: { h: momentumH, a: momentumA },
        ratios: { precisionHome: precisionH, precisionAway: precisionA },
        history: { home: [], away: [] }, // history logic is managed in App.tsx now
    };
};

// ===================================
// Text Generation for Display
// ===================================
export const generateAdvancedAnalysis = (stats: LiveStats, analysis: LiveAnalysis): string => {
    const { minute, score } = stats;
    const { dominance, momentum } = analysis;
    const text: string[] = [];
    
    const phase = minute < 15 ? "Initial" : minute < 45 ? "First Half" : minute < 75 ? "Decisive" : "Final Stretch";
    text.push(`▶ PHASE (Min ${minute}): ${phase}`);

    const domAbs = Math.abs(dominance.difference);
    // Recalibrated thresholds for the new normalized dominance "intensity" score
    let domDesc = "Balanced Match";
    if (domAbs > 0.4) domDesc = `CRUSHING DOMINANCE by ${dominance.difference > 0 ? 'Home' : 'Away'}`;
    else if (domAbs > 0.2) domDesc = `CLEAR DOMINANCE by ${dominance.difference > 0 ? 'Home' : 'Away'}`;
    else if (domAbs > 0.05) domDesc = `SLIGHT SUPERIORITY of ${dominance.difference > 0 ? 'Home' : 'Away'}`;
    text.push(`▶ DOMINANCE (Intensity/Min): ${domDesc}`);
    text.push(`  Scores: H ${dominance.home.toFixed(2)} | A ${dominance.away.toFixed(2)} | Diff: ${dominance.difference.toFixed(2)}`);
    
    // Recalibrated thresholds for momentum
    const momDescH = momentum.h > 0.1 ? 'Strong Rise' : momentum.h > 0.02 ? 'Improving' : 'Stable';
    const momDescA = momentum.a > 0.1 ? 'Strong Rise' : momentum.a > 0.02 ? 'Improving' : 'Stable';
    text.push(`▶ MOMENTUM: H ${momDescH} | A ${momDescA}`);

    text.push(`▶ SCORE vs STATS:`);
    if (score.h === score.a && domAbs > 0.2) {
        text.push(`  - MISMATCH: Score is level, but ${dominance.difference > 0 ? 'Home' : 'Away'} is dominating.`);
    } else if ((score.h > score.a && dominance.difference < -0.15) || (score.a > score.h && dominance.difference > 0.15)) {
        text.push(`  - SURPRISE: The losing team is statistically dominating.`);
    } else {
        text.push(`  - The score seems consistent with performance.`);
    }

    return text.join('\n');
};

export const generateComparativeAnalysis = (stats: LiveStats, analysis: LiveAnalysis, prediction: PoissonPrediction): string => {
    const { score, minute } = stats;
    const { dominance } = analysis;
    const text: string[] = [];

    const progress = Math.min(minute / 90, 1);
    const expectedScoreH = prediction.expectedGoalsHome * progress;
    const expectedScoreA = prediction.expectedGoalsAway * progress;
    
    text.push(`▶ GOAL PERFORMANCE (vs Expected for min ${minute})`);
    text.push(`  - HOME: Actual ${score.h} vs Exp ${expectedScoreH.toFixed(2)} (Diff: ${(score.h - expectedScoreH).toFixed(2)})`);
    text.push(`  - AWAY: Actual ${score.a} vs Exp ${expectedScoreA.toFixed(2)} (Diff: ${(score.a - expectedScoreA).toFixed(2)})`);
    if(score.h - expectedScoreH > 0.5) text.push(`    ↳ Home is overperforming goal expectation.`);
    if(score.a - expectedScoreA > 0.5) text.push(`    ↳ Away is overperforming goal expectation.`);
    
    text.push(`\n▶ MATCH SCRIPT ANALYSIS:`);
    const predFav = prediction.probHomeWin > prediction.probAwayWin + 0.15 ? 'Home' : (prediction.probAwayWin > prediction.probHomeWin + 0.15 ? 'Away' : 'Balanced');
    // Using recalibrated threshold for live dominance check
    const liveDom = dominance.difference > 0.1 ? 'Home' : (dominance.difference < -0.1 ? 'Away' : 'Balanced');
    
    if (predFav === liveDom && predFav !== 'Balanced') {
        text.push(`  - LOGIC CONFIRMED: The pre-match favorite (${predFav}) is dominating as expected.`);
    } else if (predFav !== 'Balanced' && liveDom !== predFav && liveDom !== 'Balanced') {
        text.push(`  - SCRIPT INVERTED: The underdog (${liveDom}) is controlling the game, against predictions.`);
    } else if (liveDom !== 'Balanced' && (liveDom === 'Home' ? score.h <= score.a : score.a <= score.h)) {
        text.push(`  - DOMINANCE W/O REWARD: ${liveDom} is dominating but failing to convert.`);
    } else {
        text.push(`  - OPEN MATCH: No clear pattern has emerged, or the match is balanced as predicted.`);
    }
    
    return text.join('\n');
};