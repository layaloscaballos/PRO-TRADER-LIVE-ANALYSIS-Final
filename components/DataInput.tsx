import React from 'react';
import { LiveStats, PreMatchOdds, HistoricalAverages } from '../types';
import { FileText, Calculator, BrainCircuit, BarChart, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { Section } from './Section';

interface DataInputProps {
    scoreTrendText: string;
    setScoreTrendText: (text: string) => void;
    preMatchOdds: PreMatchOdds;
    setPreMatchOdds: React.Dispatch<React.SetStateAction<PreMatchOdds>>;
    historicalAverages: HistoricalAverages;
    setHistoricalAverages: React.Dispatch<React.SetStateAction<HistoricalAverages>>;
    liveStats: LiveStats;
    setLiveStats: React.Dispatch<React.SetStateAction<LiveStats>>;
    onAutoFill: () => void;
    onCalcProbs: () => void;
    onGeneratePrediction: () => void;
    onUpdateAnalysis: () => void;
    onReset: () => void;
}

const DataInput: React.FC<DataInputProps> = ({
    scoreTrendText, setScoreTrendText,
    preMatchOdds, setPreMatchOdds,
    historicalAverages, setHistoricalAverages,
    liveStats, setLiveStats,
    onAutoFill, onCalcProbs, onGeneratePrediction, onUpdateAnalysis, onReset
}) => {

    const handleStatChange = (team: 'h' | 'a', stat: keyof Omit<LiveStats, 'score' | 'minute'>, value: string) => {
        setLiveStats(prev => ({
            ...prev,
            [stat]: { ...prev[stat], [team]: parseInt(value) || 0 }
        }));
    };

    const handleScoreChange = (team: 'h' | 'a', value: string) => {
        setLiveStats(prev => ({
            ...prev,
            score: { ...prev.score, [team]: parseInt(value) || 0 }
        }));
    };
    
    const handleHistoricalChange = (field: keyof HistoricalAverages, value: string) => {
        if (value === '') {
            setHistoricalAverages(p => ({ ...p, [field]: '' }));
            return;
        }
        const sanitizedValue = value.replace(',', '.');
        if (/^[0-9]*\.?[0-9]*$/.test(sanitizedValue) && sanitizedValue.split('.').length <= 2) {
            setHistoricalAverages(p => ({ ...p, [field]: sanitizedValue }));
        }
    };


    return (
        <div className="flex flex-col gap-6">
            <Section title="Step 0: Auto-Load Data" icon={<FileText className="text-cyan-400" />}>
                 <textarea
                    id="scoretrend-input"
                    className="w-full h-32 p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-gray-500 text-sm text-white"
                    placeholder="Paste full text from ScoreTrend here..."
                    value={scoreTrendText}
                    onChange={(e) => setScoreTrendText(e.target.value)}
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={onAutoFill} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm">
                        <ArrowRight size={16}/> Auto-Fill Fields
                    </button>
                    <button onClick={() => setScoreTrendText('')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm">
                        <Trash2 size={16}/> Clear
                    </button>
                </div>
                <button onClick={onUpdateAnalysis} className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm"><RefreshCw size={16}/> Update Analysis</button>
            </Section>

            <Section title="Step 1: Pre-Match & Prediction" icon={<BrainCircuit className="text-purple-400" />}>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Pre-Match Odds (1X2)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" placeholder="Home" value={preMatchOdds.h || ''} onChange={(e) => setPreMatchOdds(p => ({...p, h: parseFloat(e.target.value) || 0}))} className="input-field" />
                            <input type="number" placeholder="Draw" value={preMatchOdds.d || ''} onChange={(e) => setPreMatchOdds(p => ({...p, d: parseFloat(e.target.value) || 0}))} className="input-field" />
                            <input type="number" placeholder="Away" value={preMatchOdds.a || ''} onChange={(e) => setPreMatchOdds(p => ({...p, a: parseFloat(e.target.value) || 0}))} className="input-field" />
                        </div>
                        <button onClick={onCalcProbs} className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-black font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm"><Calculator size={16}/> Calculate Probabilities</button>
                        {preMatchOdds.probs && (
                            <div className="mt-3 p-2 bg-gray-700/50 rounded-md space-y-1">
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-gray-400">Home Prob:</span>
                                    <span className="font-bold text-cyan-300">{(preMatchOdds.probs.home * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-gray-400">Draw Prob:</span>
                                    <span className="font-bold text-cyan-300">{(preMatchOdds.probs.draw * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                    <span className="text-gray-400">Away Prob:</span>
                                    <span className="font-bold text-cyan-300">{(preMatchOdds.probs.away * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono mt-1 pt-1 border-t border-gray-600">
                                    <span className="text-gray-400">Bookie Margin:</span>
                                    <span className="font-bold text-yellow-400">{preMatchOdds.probs.margin.toFixed(2)}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold mb-2 text-gray-400">Historical Averages (Goals)</h4>
                         <div className="grid grid-cols-2 gap-2">
                            <input type="text" inputMode="decimal" placeholder="Home GF" value={historicalAverages.hgf} onChange={(e) => handleHistoricalChange('hgf', e.target.value)} className="input-field" />
                            <input type="text" inputMode="decimal" placeholder="Home GC" value={historicalAverages.hgc} onChange={(e) => handleHistoricalChange('hgc', e.target.value)} className="input-field" />
                            <input type="text" inputMode="decimal" placeholder="Away GF" value={historicalAverages.agf} onChange={(e) => handleHistoricalChange('agf', e.target.value)} className="input-field" />
                            <input type="text" inputMode="decimal" placeholder="Away GC" value={historicalAverages.agc} onChange={(e) => handleHistoricalChange('agc', e.target.value)} className="input-field" />
                        </div>
                        <button onClick={onGeneratePrediction} className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm"><BrainCircuit size={16}/> Generate Prediction</button>
                    </div>
                </div>
            </Section>

             <Section title="Step 2: Live Match Stats" icon={<BarChart className="text-green-400" />}>
                <div className="grid grid-cols-3 gap-x-2 gap-y-3 items-center text-center">
                    <div/> <div className="font-bold text-sm">Home</div> <div className="font-bold text-sm">Away</div>
                    
                    <label className="text-sm text-left">Attacks</label>
                    <input type="number" value={liveStats.attacks.h} onChange={e => handleStatChange('h', 'attacks', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.attacks.a} onChange={e => handleStatChange('a', 'attacks', e.target.value)} className="input-field"/>
                    
                    <label className="text-sm text-left">D. Attacks</label>
                    <input type="number" value={liveStats.dangerousAttacks.h} onChange={e => handleStatChange('h', 'dangerousAttacks', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.dangerousAttacks.a} onChange={e => handleStatChange('a', 'dangerousAttacks', e.target.value)} className="input-field"/>

                    <label className="text-sm text-left">On Target</label>
                    <input type="number" value={liveStats.onTarget.h} onChange={e => handleStatChange('h', 'onTarget', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.onTarget.a} onChange={e => handleStatChange('a', 'onTarget', e.target.value)} className="input-field"/>
                    
                    <label className="text-sm text-left">Off Target</label>
                    <input type="number" value={liveStats.offTarget.h} onChange={e => handleStatChange('h', 'offTarget', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.offTarget.a} onChange={e => handleStatChange('a', 'offTarget', e.target.value)} className="input-field"/>
                    
                    <label className="text-sm text-left">Corners</label>
                    <input type="number" value={liveStats.corners.h} onChange={e => handleStatChange('h', 'corners', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.corners.a} onChange={e => handleStatChange('a', 'corners', e.target.value)} className="input-field"/>

                    <label className="text-sm text-left">Possession %</label>
                    <input type="number" value={liveStats.possession.h} onChange={e => handleStatChange('h', 'possession', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.possession.a} onChange={e => handleStatChange('a', 'possession', e.target.value)} className="input-field"/>
                    
                    <label className="text-sm text-left">Yellow Cards</label>
                    <input type="number" value={liveStats.yellowCards.h} onChange={e => handleStatChange('h', 'yellowCards', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.yellowCards.a} onChange={e => handleStatChange('a', 'yellowCards', e.target.value)} className="input-field"/>

                    <label className="text-sm text-left">Red Cards</label>
                    <input type="number" value={liveStats.redCards.h} onChange={e => handleStatChange('h', 'redCards', e.target.value)} className="input-field"/>
                    <input type="number" value={liveStats.redCards.a} onChange={e => handleStatChange('a', 'redCards', e.target.value)} className="input-field"/>
                </div>
                 <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-4">
                     <label className="text-sm">Score:</label>
                     <input type="number" value={liveStats.score.h} onChange={e => handleScoreChange('h', e.target.value)} className="input-field w-16"/>
                     <span>-</span>
                     <input type="number" value={liveStats.score.a} onChange={e => handleScoreChange('a', e.target.value)} className="input-field w-16"/>
                     <label className="text-sm ml-auto">Min:</label>
                     <input type="number" value={liveStats.minute} onChange={e => setLiveStats(p => ({...p, minute: parseInt(e.target.value) || 0}))} className="input-field w-20"/>
                 </div>
                 <div className="mt-4 flex gap-2">
                     <button onClick={onReset} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm"><Trash2 size={16}/> Reset Session</button>
                 </div>
            </Section>
        </div>
    );
};

export default DataInput;