
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LiveAnalysis, DominancePoint, LiveStats } from '../types';
import { Section } from './Section';
import { Activity, Gauge, TrendingUp, Target } from 'lucide-react';

interface LiveAnalysisDisplayProps {
    analysis: LiveAnalysis | null;
    history: DominancePoint[];
    liveStats: LiveStats;
}

interface StatCardProps {
    title: string;
    value: string | number;
    valueColor: string;
    bgColor?: string;
    subValue?: string | number;
    intenseBg?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, valueColor, bgColor = 'bg-gray-800', subValue, intenseBg = false }) => {
    const titleColor = intenseBg ? 'text-gray-200' : 'text-gray-400';
    const subValueColor = intenseBg ? 'text-gray-300' : 'text-gray-500';

    return (
        <div className={`${bgColor} p-3 rounded-lg text-center transition-colors duration-300 ease-in-out`}>
            <p className={`text-xs ${titleColor}`}>{title}</p>
            <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
            {subValue && <p className={`text-xs ${subValueColor}`}>{subValue}</p>}
        </div>
    );
};

const LiveAnalysisDisplay: React.FC<LiveAnalysisDisplayProps> = ({ analysis, history, liveStats }) => {

    const renderEmptyState = () => (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center p-8">
            <Activity size={48} className="mb-4" />
            <h3 className="text-lg font-semibold">Live Analysis</h3>
            <p className="text-sm">Input live stats and click "Update Analysis" to see real-time data visualizations and metrics.</p>
        </div>
    );

    if (!analysis) {
        return (
            <Section title="Live Match Dynamics" icon={<Activity className="text-blue-400" />}>
                {renderEmptyState()}
            </Section>
        );
    }
    
    const getDominanceStyling = (difference: number) => {
        const absDiff = Math.abs(difference);
        if (absDiff > 0.4) {
            return { bgColor: difference > 0 ? 'bg-green-600' : 'bg-red-600', isIntense: true };
        }
        if (absDiff > 0.2) {
            return { bgColor: difference > 0 ? 'bg-green-700' : 'bg-red-700', isIntense: true };
        }
        if (absDiff > 0.05) {
            return { bgColor: difference > 0 ? 'bg-green-800/70' : 'bg-red-800/70', isIntense: false };
        }
        return { bgColor: 'bg-gray-800', isIntense: false };
    };

    const { bgColor: dominanceBgColor, isIntense: isDominanceBgIntense } = getDominanceStyling(analysis.dominance.difference);
    const isAlertActive = Math.abs(analysis.dominance.difference) > 0.5;

    const sectionTitle = (
        <div className="flex items-center gap-4">
            <span>{`Live Match Dynamics (Min ${liveStats.minute}')`}</span>
            {isAlertActive && (
                <span className="font-bold text-red-500 animate-pulse text-sm px-2 py-0.5 bg-red-500/10 rounded-md border border-red-500/30">
                    ALERTA!
                </span>
            )}
        </div>
    );
    
    return (
        <Section title={sectionTitle} icon={<Activity className="text-blue-400" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard 
                    title="Dominance Diff" 
                    value={analysis.dominance.difference.toFixed(2)} 
                    valueColor="text-yellow-400"
                    bgColor={dominanceBgColor}
                    intenseBg={isDominanceBgIntense}
                    subValue={analysis.dominance.difference > 0 ? "Home Lead" : "Away Lead"} 
                />
                <StatCard 
                    title="Momentum (H)" 
                    value={analysis.momentum.h.toFixed(2)} 
                    valueColor={analysis.momentum.h > 0 ? 'text-green-400' : 'text-red-400'} 
                    subValue={analysis.dominance.home.toFixed(2)}
                />
                <StatCard 
                    title="Momentum (A)" 
                    value={analysis.momentum.a.toFixed(2)} 
                    valueColor={analysis.momentum.a > 0 ? 'text-green-400' : 'text-red-400'} 
                    subValue={analysis.dominance.away.toFixed(2)}
                />
                <StatCard 
                    title="Score" 
                    value={`${liveStats.score.h} - ${liveStats.score.a}`} 
                    valueColor="text-white" 
                />
            </div>

            <div className="h-64 w-full bg-gray-800/50 p-2 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="minute" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#E2E8F0' }}
                        />
                        <ReferenceLine y={0} stroke="#A0AEC0" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="difference" name="Dominance (H - A)" stroke="#2DD4BF" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400"/> Max Dominance</h4>
                    <p>Home: <span className="font-mono text-cyan-400">{analysis.dominance.maxHome.toFixed(2)}</span> {analysis.dominance.newMaxHome && <span className="text-green-400 font-bold text-xs"> (NEW!)</span>}</p>
                    <p>Away: <span className="font-mono text-cyan-400">{Math.abs(analysis.dominance.maxAway).toFixed(2)}</span> {analysis.dominance.newMaxAway && <span className="text-green-400 font-bold text-xs"> (NEW!)</span>}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Target size={16} className="text-purple-400"/> Shooting Precision</h4>
                    <p>Home: <span className="font-mono text-purple-400">{analysis.ratios.precisionHome.toFixed(1)}%</span></p>
                    <p>Away: <span className="font-mono text-purple-400">{analysis.ratios.precisionAway.toFixed(1)}%</span></p>
                </div>
            </div>
        </Section>
    );
};

export default LiveAnalysisDisplay;
