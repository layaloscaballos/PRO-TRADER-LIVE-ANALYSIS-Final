import React from 'react';
import { Section } from './Section';
import { Lightbulb, History } from 'lucide-react';
import { TradingSuggestion } from '../types';

interface TradingSuggestionsProps {
    latest: TradingSuggestion[];
    previous: TradingSuggestion[];
    isLoading: boolean;
}

const SuggestionColumn: React.FC<{ title: string; suggestions: TradingSuggestion[]; icon: React.ReactNode }> = ({ title, suggestions, icon }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg flex-1">
        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-gray-300">
            {icon}
            {title}
        </h4>
        {suggestions.length > 0 ? (
            <div className="space-y-3">
                {suggestions.map((s, index) => (
                    <div key={index} className="text-xs border-l-2 border-cyan-500 pl-2">
                        <p className="font-bold text-gray-100">{s.title}</p>
                        <p className="text-gray-400">{s.reasoning}</p>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-xs text-gray-500 italic text-center py-4">No suggestions available.</p>
        )}
    </div>
);


const TradingSuggestions: React.FC<TradingSuggestionsProps> = ({ latest, previous, isLoading }) => {

    const renderContent = () => {
        if (isLoading && latest.length === 0) {
            return (
                <div className="p-4 flex items-center justify-center text-gray-400">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating new trading angles...
                </div>
            );
        }
        
        if (!isLoading && latest.length === 0 && previous.length === 0) {
            return (
                 <div className="text-center text-gray-500 py-4 px-2 text-sm">
                    <p>Actionable trading angles from Gemini will appear here once you request an AI Insight.</p>
                </div>
            )
        }
        
        return (
             <div className="flex flex-col md:flex-row gap-4">
                <SuggestionColumn title="Latest Suggestions" suggestions={latest} icon={<Lightbulb size={16} className="text-yellow-400"/>} />
                <SuggestionColumn title="Previous Suggestions" suggestions={previous} icon={<History size={16} className="text-gray-400"/>} />
            </div>
        )
    }

    return (
        <Section title="AI Trading Angles" icon={<Lightbulb className="text-yellow-400" />}>
           {renderContent()}
        </Section>
    );
};

export default TradingSuggestions;
