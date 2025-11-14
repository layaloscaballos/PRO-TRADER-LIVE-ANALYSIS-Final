
import React from 'react';
import { PoissonPrediction, PreMatchProbs } from '../types';
import { Section } from './Section';
import { TestTube2, Brain } from 'lucide-react';

interface PredictionDisplayProps {
    prediction: PoissonPrediction | null;
    preMatchProbs: PreMatchProbs | null;
    advancedAnalysisText: string;
}

const PredictionDisplay: React.FC<PredictionDisplayProps> = ({ prediction, preMatchProbs, advancedAnalysisText }) => {

    const renderPredictionContent = () => {
        if (!prediction) {
            return <div className="text-gray-500 text-center p-4">Generate a prediction to see results.</div>;
        }

        const formatPercent = (val: number) => (val * 100).toFixed(1);

        const valueDiff1 = preMatchProbs ? formatPercent(prediction.probHomeWin - preMatchProbs.home) : null;
        const valueDiffX = preMatchProbs ? formatPercent(prediction.probDraw - preMatchProbs.draw) : null;
        const valueDiff2 = preMatchProbs ? formatPercent(prediction.probAwayWin - preMatchProbs.away) : null;

        return (
            <div className="text-xs font-mono space-y-2 p-2">
                <div>
                    <p className="font-bold text-cyan-400">Expected Goals:</p>
                    <p>Home: {prediction.expectedGoalsHome.toFixed(2)} | Away: {prediction.expectedGoalsAway.toFixed(2)}</p>
                </div>
                <div>
                    <p className="font-bold text-cyan-400">1X2 Probabilities (Model):</p>
                    <p>Home (1): {formatPercent(prediction.probHomeWin)}%</p>
                    <p>Draw (X): {formatPercent(prediction.probDraw)}%</p>
                    <p>Away (2): {formatPercent(prediction.probAwayWin)}%</p>
                </div>
                {preMatchProbs && (
                    <div>
                        <p className="font-bold text-cyan-400">Model vs Market (Value):</p>
                        <p>Home (1): {valueDiff1}%</p>
                        <p>Draw (X): {valueDiffX}%</p>
                        <p>Away (2): {valueDiff2}%</p>
                    </div>
                )}
                 <div>
                    <p className="font-bold text-cyan-400">Top Scores:</p>
                    {prediction.mostProbableResults.map(r => (
                        <p key={r.score}>{r.score} ({(r.probability * 100).toFixed(2)}%)</p>
                    ))}
                </div>
                 <div>
                    <p className="font-bold text-cyan-400">Goal Markets:</p>
                    <p>Over 2.5: {formatPercent(prediction.probOver25)}%</p>
                    <p>BTTS: {formatPercent(prediction.probBTTS)}%</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <Section title="Poisson Prediction" icon={<TestTube2 className="text-yellow-400" />}>
                <div className="bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto">
                    {renderPredictionContent()}
                </div>
            </Section>
            <Section title="Advanced Analysis" icon={<Brain className="text-green-400" />}>
                <div className="bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto">
                    <pre className="text-xs font-mono p-3 whitespace-pre-wrap">{advancedAnalysisText}</pre>
                </div>
            </Section>
        </div>
    );
};

export default PredictionDisplay;
