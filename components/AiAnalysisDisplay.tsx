import React from 'react';
import { Section } from './Section';
import { Scale, WandSparkles } from 'lucide-react';
import { PoissonPrediction, LiveAnalysis } from '../types';

interface AiAnalysisDisplayProps {
    prediction: PoissonPrediction | null;
    liveAnalysis: LiveAnalysis | null;
    comparativeAnalysisText: string;
    geminiAnalysis: string;
    isGeminiLoading: boolean;
    onGetGeminiAnalysis: () => void;
}

const AiAnalysisDisplay: React.FC<AiAnalysisDisplayProps> = ({
    prediction,
    liveAnalysis,
    comparativeAnalysisText,
    geminiAnalysis,
    isGeminiLoading,
    onGetGeminiAnalysis
}) => {
    return (
        <div className="flex flex-col gap-6">
            <Section title="Prediction vs. Reality" icon={<Scale className="text-orange-400" />}>
                <div className="bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto">
                    <pre className="text-xs font-mono p-3 whitespace-pre-wrap">{comparativeAnalysisText}</pre>
                </div>
            </Section>
            <Section title="Gemini AI Trading Analysis" icon={<WandSparkles className="text-purple-400" />}>
                <button 
                    onClick={onGetGeminiAnalysis}
                    disabled={isGeminiLoading || !liveAnalysis}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <WandSparkles size={16}/> {isGeminiLoading ? 'Analyzing...' : 'Get AI Insight'}
                </button>
                <div className="mt-2 bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto">
                    {isGeminiLoading && (
                        <div className="p-4 flex items-center justify-center text-gray-400">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Gemini is thinking...
                        </div>
                    )}
                    {geminiAnalysis && (
                         <pre className="text-xs font-mono p-3 whitespace-pre-wrap">{geminiAnalysis}</pre>
                    )}
                    {!isGeminiLoading && !geminiAnalysis && (
                        <div className="p-3 text-gray-400 text-xs space-y-3">
                            <h4 className="font-bold text-sm text-gray-300">When to Ask Gemini for Insight?</h4>
                            <p>For best results, request analysis during key phases of the match:</p>
                            <ul className="list-disc list-inside space-y-2 pl-1">
                                <li>
                                    <span className="font-semibold text-gray-300">First Solid Read (20-25'):</span> 
                                    Initial patterns are stable.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-300">Halftime (45'):</span> 
                                    Analyze 1st half & predict 2nd half adjustments.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-300">Post-Halftime Check (60-65'):</span> 
                                    See if tactical changes are effective.
                                </li>
                                <li>
                                    <span className="font-semibold text-gray-300">Decisive Zone (70-75'):</span> 
                                    Fatigue sets in, spaces open up, opportunities emerge.
                                </li>
                            </ul>
                            <p className="font-semibold text-gray-300 border-t border-gray-700 pt-3 mt-2">Also, ask immediately after critical events:</p>
                            <ul className="list-disc list-inside space-y-1 pl-1">
                                <li>After a <span className="font-bold text-yellow-400">Goal</span>.</li>
                                <li>After a <span className="font-bold text-red-500">Red Card</span>.</li>
                            </ul>
                        </div>
                    )}
                </div>
            </Section>
        </div>
    );
};

export default AiAnalysisDisplay;