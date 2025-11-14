import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';

import { LiveStats, PreMatchOdds, HistoricalAverages, PoissonPrediction, LiveAnalysis, DominancePoint, TradingSuggestion } from './types';
import { parseScoreTrendText, calculateProbabilities, calculatePoissonPrediction, calculateLiveRendimiento, generateAdvancedAnalysis, generateComparativeAnalysis } from './services/analysisService';

import DataInput from './components/DataInput';
import LiveAnalysisDisplay from './components/LiveAnalysisDisplay';
import PredictionDisplay from './components/PredictionDisplay';
import AiAnalysisDisplay from './components/AiAnalysisDisplay';
import ConfirmDialog from './components/ConfirmDialog';
import { Toaster, toast } from './components/Toaster';
import TradingSuggestions from './components/TradingSuggestions';

const initialLiveStats: LiveStats = {
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

const App: React.FC = () => {
    const [scoreTrendText, setScoreTrendText] = useState<string>('');
    const [preMatchOdds, setPreMatchOdds] = useState<PreMatchOdds>({ h: 0, d: 0, a: 0, probs: null });
    const [historicalAverages, setHistoricalAverages] = useState<HistoricalAverages>({ hgf: '', hgc: '', agf: '', agc: '' });
    const [liveStats, setLiveStats] = useState<LiveStats>(initialLiveStats);

    const [prediction, setPrediction] = useState<PoissonPrediction | null>(null);
    const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysis | null>(null);
    const [dominanceHistory, setDominanceHistory] = useState<DominancePoint[]>([]);

    const [geminiAnalysis, setGeminiAnalysis] = useState<string>('');
    const [latestSuggestions, setLatestSuggestions] = useState<TradingSuggestion[]>([]);
    const [previousSuggestions, setPreviousSuggestions] = useState<TradingSuggestion[]>([]);
    const [isGeminiLoading, setIsGeminiLoading] = useState<boolean>(false);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
    
    const handleAutoFill = () => {
        try {
            const parsedData = parseScoreTrendText(scoreTrendText);
            if(parsedData.preMatchOdds) setPreMatchOdds(prev => ({ ...prev, ...parsedData.preMatchOdds }));
            if(parsedData.liveStats) {
                setLiveStats(parsedData.liveStats);
                setLiveAnalysis(null);
            }
            toast.success('Data auto-filled successfully!');
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to parse data.');
        }
    };

    const handleCalcProbs = () => {
        if (!preMatchOdds.h || !preMatchOdds.d || !preMatchOdds.a) {
            toast.error('Please enter valid odds for Home, Draw, and Away.');
            return;
        }
        const result = calculateProbabilities(preMatchOdds.h, preMatchOdds.d, preMatchOdds.a);
        setPreMatchOdds(prev => ({...prev, probs: result}));
        toast.success('Pre-match probabilities calculated.');
    }

    const handleGeneratePrediction = () => {
        const { hgf, hgc, agf, agc } = historicalAverages;
        
        const hgfNum = parseFloat(String(hgf).replace(',', '.')) || 0;
        const hgcNum = parseFloat(String(hgc).replace(',', '.')) || 0;
        const agfNum = parseFloat(String(agf).replace(',', '.')) || 0;
        const agcNum = parseFloat(String(agc).replace(',', '.')) || 0;

        if ([hgfNum, hgcNum, agfNum, agcNum].some(val => val === 0 || isNaN(val))) {
             toast.error('Please enter all four historical average values.');
             return;
        }
        const pred = calculatePoissonPrediction(hgfNum, hgcNum, agfNum, agcNum);
        setPrediction(pred);
        toast.success('Advanced prediction generated.');
    };

    const handleUpdateAnalysis = () => {
        const newAnalysis = calculateLiveRendimiento(liveStats, liveAnalysis);
        setLiveAnalysis(newAnalysis);

        if (liveStats.minute > 0) {
            setDominanceHistory(prev => {
                const newHistory = [...prev, { minute: liveStats.minute, difference: newAnalysis.dominance.difference }];
                return newHistory.reverse().filter((point, index, self) => 
                    index === self.findIndex((t) => (t.minute === point.minute))
                ).reverse();
            });
        }
        
        // Clear the detailed analysis text, as it's now outdated, but keep the suggestions.
        setGeminiAnalysis('');
        toast.success(`Live analysis updated for minute ${liveStats.minute}.`);
    };

    const executeReset = useCallback(() => {
        setScoreTrendText('');
        setPreMatchOdds({ h: 0, d: 0, a: 0, probs: null });
        setHistoricalAverages({ hgf: '', hgc: '', agf: '', agc: '' });
        setLiveStats(initialLiveStats);
        setPrediction(null);
        setLiveAnalysis(null);
        setDominanceHistory([]);
        setGeminiAnalysis('');
        setLatestSuggestions([]);
        setPreviousSuggestions([]);
        setIsGeminiLoading(false);
        setShowResetConfirm(false);
        toast.info('Session has been reset.');
    }, []);

    const handleResetRequest = () => {
        setShowResetConfirm(true);
    };

    const cancelReset = () => {
        setShowResetConfirm(false);
    };

    const handleGeminiAnalysis = useCallback(async () => {
        if (!liveAnalysis) {
            toast.error('Please run a live analysis first.');
            return;
        }

        // Capture the current suggestions to prevent stale state issues.
        const currentSuggestions = latestSuggestions;
        
        setIsGeminiLoading(true);
        setGeminiAnalysis('');
        
        // Move the captured suggestions to 'previous' and clear 'latest' for the loading state.
        setPreviousSuggestions(currentSuggestions);
        setLatestSuggestions([]);

        const prompt = `
Eres un analista profesional de trading deportivo. Tu objetivo es proporcionar información precisa y procesable basada en datos estadísticos. Responde siempre en español.

Analiza los siguientes datos de un partido de fútbol y proporciona un análisis de trading profesional.

**CONTEXTO GENERAL:**
- El análisis debe ser estructurado, perspicaz y orientado a un trader profesional que busca oportunidades durante el partido.
- Céntrate en las discrepancias entre las expectativas del mercado (cuotas), el modelo de Poisson y el rendimiento en vivo.
- Destaca los cambios de impulso (momentum), los períodos de dominio estéril y las señales de finalización clínica o de defensa deficiente.
- Concluye con posibles ángulos de trading, mencionando mercados específicos (p. ej., Próximo Gol, Hándicap Asiático, Total de Goles Más/Menos) y el razonamiento detrás de ellos. Sé específico sobre qué equipo favorece cada ángulo.

**EXPECTATIVAS DEL MERCADO (CUOTAS PRE-PARTIDO):**
${preMatchOdds.probs ? `
- Cuotas (1X2): Local ${preMatchOdds.h} - Empate ${preMatchOdds.d} - Visitante ${preMatchOdds.a}
- Probabilidades Implícitas (sin margen): Local ${(preMatchOdds.probs.home * 100).toFixed(1)}% - Empate ${(preMatchOdds.probs.draw * 100).toFixed(1)}% - Visitante ${(preMatchOdds.probs.away * 100).toFixed(1)}%
- Margen de la Casa de Apuestas: ${preMatchOdds.probs.margin.toFixed(2)}%` : "No se calcularon las probabilidades pre-partido."}

**PREDICCIÓN PRE-PARTIDO (MODELO DE POISSON):**
${prediction ? JSON.stringify(prediction, null, 2) : "No se generó una predicción pre-partido."}

**DATOS DEL PARTIDO EN VIVO:**
- Minuto: ${liveStats.minute}
- Marcador: Local ${liveStats.score.h} - Visitante ${liveStats.score.a}
- Posesión de Balón: Local ${liveStats.possession.h}% - Visitante ${liveStats.possession.a}%
- Utiliza la posesión para contextualizar el dominio. Una alta posesión con pocos ataques peligrosos o tiros a puerta indica un "dominio estéril". Una posesión más baja pero con alta efectividad en los ataques puede señalar un estilo de contraataque peligroso.

**CONTEXTO DISCIPLINARIO:**
${(liveStats.redCards.h > 0 || liveStats.redCards.a > 0) ? `
- ¡ALERTA DE TARJETA ROJA!
  - Rojas Local: ${liveStats.redCards.h}
  - Rojas Visitante: ${liveStats.redCards.a}
- Esto cambia drásticamente el partido. El equipo con ventaja numérica tiene una oportunidad significativa. Tenlo muy en cuenta en tu análisis de dominio y oportunidades de gol.` : ''}
- Tarjetas Amarillas: Local ${liveStats.yellowCards.h} - Visitante ${liveStats.yellowCards.a}
- Considera si un equipo está forzando muchas tarjetas al rival, lo que indica presión y desgaste en la defensa contraria.

**ANÁLISIS DE DOMINIO Y MOMENTUM EN VIVO (PROMEDIO POR MINUTO):**
- La "Puntuación de Dominio" es un índice de la intensidad promedio del dominio a lo largo de todo el partido.
- Guía de Interpretación de la Diferencia:
  - ~0.05: Superioridad Ligera
  - ~0.20: Dominio Claro
  - ~0.40+: Dominio Aplastante
- Puntuación de Dominio (Local vs Visitante): ${liveAnalysis.dominance.home.toFixed(2)} vs ${liveAnalysis.dominance.away.toFixed(2)}
- Diferencia Acumulada: ${liveAnalysis.dominance.difference.toFixed(2)} (${liveAnalysis.dominance.difference > 0 ? 'a favor del Local' : 'a favor del Visitante'})
- "Momentum" representa el cambio en la puntuación de dominio promedio desde la última actualización. Un valor positivo indica que el equipo está mejorando su rendimiento relativo y ganando control.
- Momentum (Local vs Visitante): ${liveAnalysis.momentum.h.toFixed(2)} vs ${liveAnalysis.momentum.a.toFixed(2)}

**ANÁLISIS DE EFECTIVIDAD:**
- Precisión de Tiro: Local ${liveAnalysis.ratios.precisionHome.toFixed(1)}%, Visitante ${liveAnalysis.ratios.precisionAway.toFixed(1)}%
- Estadísticas en Vivo (Ataques, Ataques Peligrosos, Tiros a Puerta, Tiros Fuera, Córners):
  - Local: ${liveStats.attacks.h}, ${liveStats.dangerousAttacks.h}, ${liveStats.onTarget.h}, ${liveStats.offTarget.h}, ${liveStats.corners.h}
  - Visitante: ${liveStats.attacks.a}, ${liveStats.dangerousAttacks.a}, ${liveStats.onTarget.a}, ${liveStats.offTarget.a}, ${liveStats.corners.a}

**INSTRUCCIONES DE RESPUESTA:**
Quiero que generes DOS cosas en tu respuesta, en un formato JSON específico.
1.  **fullAnalysis**: Un string que contenga tu análisis completo y detallado, estructurado en las siguientes secciones: "Sinopsis del Partido", "Observaciones Clave" y "Posibles Ángulos de Trading". Este es el análisis principal.
2.  **tradingSuggestions**: Un array de objetos, donde cada objeto representa una sugerencia de trading resumida. Cada objeto debe tener dos claves: "title" (ej. "Próximo Gol: Equipo Local") y "reasoning" (un resumen muy breve de por qué).

Genera el JSON ahora.
`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                fullAnalysis: { type: Type.STRING },
                tradingSuggestions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            reasoning: { type: Type.STRING },
                        },
                        required: ["title", "reasoning"],
                    },
                },
            },
            required: ["fullAnalysis", "tradingSuggestions"],
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });
            
            const rawText = response.text;
            if (rawText && rawText.trim()) {
                const parsedResponse = JSON.parse(rawText);
                setGeminiAnalysis(parsedResponse.fullAnalysis || "Gemini did not provide a full analysis text.");
                setLatestSuggestions(parsedResponse.tradingSuggestions || []);
            } else {
                setGeminiAnalysis("Gemini returned an empty response. This could be due to content filters or a temporary issue. Please try again.");
                setLatestSuggestions([]);
                toast.warning("Gemini returned an empty or filtered response.");
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            toast.error("Failed to get analysis from Gemini. Check console for details.");
            setGeminiAnalysis("An error occurred while fetching the AI analysis.");
            // On failure, restore the suggestions that were present before this attempt.
            setLatestSuggestions(currentSuggestions);
            // And clear the 'previous' column, as this attempt failed.
            setPreviousSuggestions([]);
        } finally {
            setIsGeminiLoading(false);
        }
    }, [liveAnalysis, prediction, liveStats, preMatchOdds, latestSuggestions]);

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
            <Toaster />
            <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 tracking-wide">Pro Trader Live Analysis</h1>
                        <p className="text-gray-400 text-sm">AI-Powered Statistical Edge for In-Play Trading</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                   <DataInput
                        scoreTrendText={scoreTrendText}
                        setScoreTrendText={setScoreTrendText}
                        preMatchOdds={preMatchOdds}
                        setPreMatchOdds={setPreMatchOdds}
                        historicalAverages={historicalAverages}
                        setHistoricalAverages={setHistoricalAverages}
                        liveStats={liveStats}
                        setLiveStats={setLiveStats}
                        onAutoFill={handleAutoFill}
                        onCalcProbs={handleCalcProbs}
                        onGeneratePrediction={handleGeneratePrediction}
                        onUpdateAnalysis={handleUpdateAnalysis}
                        onReset={handleResetRequest}
                    />
                </div>
                
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <LiveAnalysisDisplay
                        analysis={liveAnalysis}
                        history={dominanceHistory}
                        liveStats={liveStats}
                    />
                    <TradingSuggestions
                        latest={latestSuggestions}
                        previous={previousSuggestions}
                        isLoading={isGeminiLoading}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PredictionDisplay
                            prediction={prediction}
                            preMatchProbs={preMatchOdds.probs}
                            advancedAnalysisText={liveAnalysis ? generateAdvancedAnalysis(liveStats, liveAnalysis) : 'Update live analysis to generate.'}
                        />
                        <AiAnalysisDisplay
                            prediction={prediction}
                            liveAnalysis={liveAnalysis}
                            comparativeAnalysisText={prediction && liveAnalysis ? generateComparativeAnalysis(liveStats, liveAnalysis, prediction) : 'Generate a prediction and update live analysis to see comparison.'}
                            geminiAnalysis={geminiAnalysis}
                            isGeminiLoading={isGeminiLoading}
                            onGetGeminiAnalysis={handleGeminiAnalysis}
                        />
                    </div>
                </div>
            </main>
            <ConfirmDialog
                isOpen={showResetConfirm}
                onConfirm={executeReset}
                onCancel={cancelReset}
                title="Reset Session"
            >
                Are you sure you want to reset all data and analysis for a new match? This action cannot be undone.
            </ConfirmDialog>
        </div>
    );
};

export default App;