'use client';

/**
 * REAL-TIME RFQ GENERATION HOOK
 * 
 * PURPOSE:
 * This hook manages the sequential execution of AI agents with real-time progress
 * updates. It replaces simulated progress with actual agent execution feedback,
 * providing a more authentic and responsive user experience.
 * 
 * FEATURES:
 * - Sequential agent execution with real progress updates
 * - Error handling for individual agent failures
 * - State management for each agent's progress and results
 * - Automatic progression through the agent pipeline
 * - Real-time UI feedback as each agent completes
 */

import { useState, useCallback } from 'react';
import { 
    executeDataAnalyzer,
    executeStrategicAnalyzer,
    executeStrategist,
    executeWriter,
    assembleFinalResponse
} from '@/lib/actions/rfq-actions';
import { 
    type AgentProgress, 
    type GeneratedRFQResponse,
    type DataAnalysisOutput,
    type AnalysisOutput,
    type StrategyOutput,
    type ProposalOutput
} from '@/lib/types';

export function useRealTimeRFQGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [finalResponse, setFinalResponse] = useState<GeneratedRFQResponse | null>(null);
    
    // Store intermediate results
    const [dataAnalysis, setDataAnalysis] = useState<DataAnalysisOutput | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
    const [strategy, setStrategy] = useState<StrategyOutput | null>(null);
    const [proposal, setProposal] = useState<ProposalOutput | null>(null);
    
    const [agentProgress, setAgentProgress] = useState<AgentProgress>({
        dataAnalyzer: { state: 'pending', message: 'Waiting to start data processing...' },
        analyzer: { state: 'pending', message: 'Waiting for data analysis...' },
        strategist: { state: 'pending', message: 'Waiting for strategic analysis...' },
        writer: { state: 'pending', message: 'Waiting for strategy...' },
    });

    const generateRFQResponse = useCallback(async () => {
        setIsGenerating(true);
        setError(null);
        setFinalResponse(null);
        
        // Reset all intermediate results
        setDataAnalysis(null);
        setAnalysis(null);
        setStrategy(null);
        setProposal(null);

        // Reset progress
        setAgentProgress({
            dataAnalyzer: { state: 'working', message: 'Processing raw contract and entity data...' },
            analyzer: { state: 'pending', message: 'Waiting for data processing...' },
            strategist: { state: 'pending', message: 'Waiting for strategic analysis...' },
            writer: { state: 'pending', message: 'Waiting for strategy...' },
        });

        try {
            // Step 1: Data Analyzer
            console.log('🔄 Starting Data Analyzer...');
            const dataResult = await executeDataAnalyzer();
            
            if (!dataResult.success || !dataResult.data) {
                throw new Error(dataResult.error || 'Data analysis failed');
            }
            
            setDataAnalysis(dataResult.data);
            setAgentProgress(prev => ({
                ...prev,
                dataAnalyzer: {
                    state: 'completed',
                    message: `Data processed - Contract type: ${dataResult.data?.contractInfo.type}`,
                    result: dataResult.data,
                },
                analyzer: {
                    state: 'working',
                    message: 'Analyzing strategic insights and gaps...',
                },
            }));

            // Step 2: Strategic Analyzer
            console.log('🔄 Starting Strategic Analyzer...');
            const analysisResult = await executeStrategicAnalyzer(dataResult.data);
            
            if (!analysisResult.success || !analysisResult.data) {
                throw new Error(analysisResult.error || 'Strategic analysis failed');
            }
            
            setAnalysis(analysisResult.data);
            setAgentProgress(prev => ({
                ...prev,
                analyzer: {
                    state: 'completed',
                    message: `Analysis complete - ${analysisResult.data?.gaps.length} gaps identified`,
                    result: analysisResult.data,
                },
                strategist: {
                    state: 'working',
                    message: 'Developing comprehensive bid strategy...',
                },
            }));

            // Step 3: Strategist
            console.log('🔄 Starting Strategist...');
            const strategyResult = await executeStrategist(dataResult.data, analysisResult.data);
            
            if (!strategyResult.success || !strategyResult.data) {
                throw new Error(strategyResult.error || 'Strategy development failed');
            }
            
            setStrategy(strategyResult.data);
            setAgentProgress(prev => ({
                ...prev,
                strategist: {
                    state: 'completed',
                    message: `Strategy developed - ${strategyResult.data?.winProbability}% win probability`,
                    result: strategyResult.data,
                },
                writer: {
                    state: 'working',
                    message: 'Generating comprehensive response blocks...',
                },
            }));

            // Step 4: Writer
            console.log('🔄 Starting Writer...');
            const proposalResult = await executeWriter(
                dataResult.data,
                analysisResult.data,
                strategyResult.data
            );
            
            if (!proposalResult.success || !proposalResult.data) {
                throw new Error(proposalResult.error || 'Response generation failed');
            }
            
            setProposal(proposalResult.data);
            setAgentProgress(prev => ({
                ...prev,
                writer: {
                    state: 'completed',
                    message: `Generated ${proposalResult.data?.responseBlocks.length} response blocks - READY FOR SUBMISSION`,
                    result: proposalResult.data,
                },
            }));

            // Step 5: Final Assembly
            console.log('🔄 Assembling final response...');
            const finalResult = await assembleFinalResponse(
                dataResult.data,
                analysisResult.data,
                strategyResult.data,
                proposalResult.data
            );
            
            if (!finalResult.success || !finalResult.data) {
                throw new Error(finalResult.error || 'Final assembly failed');
            }
            
            console.log('✅ RFQ Response generation completed!');
            setFinalResponse(finalResult.data);
            setIsGenerating(false);

        } catch (error) {
            console.error('❌ Generation failed:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
            
            // Mark current working agent as failed
            setAgentProgress(prev => {
                const workingAgent = Object.entries(prev).find(([_, agent]) => agent.state === 'working');
                if (workingAgent) {
                    return {
                        ...prev,
                        [workingAgent[0]]: {
                            state: 'pending',
                            message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        },
                    };
                }
                return prev;
            });
            
            setIsGenerating(false);
        }
    }, []);

    return {
        generateRFQResponse,
        isGenerating,
        error,
        agentProgress,
        finalResponse,
        // Expose intermediate results for debugging
        intermediateResults: {
            dataAnalysis,
            analysis,
            strategy,
            proposal,
        },
    };
} 