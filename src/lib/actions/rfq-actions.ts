'use server';

/**
 * RFQ GENERATION SERVER ACTIONS
 * 
 * PURPOSE:
 * This file provides server actions for sequential agent execution, enabling
 * real-time progress updates as each agent completes its work. This replaces
 * the simulated progress with actual agent execution feedback.
 * 
 * APPROACH:
 * Instead of running all agents at once and simulating progress, we execute
 * agents sequentially and return results after each completion, allowing
 * the UI to update in real-time with actual progress.
 */

import { runDataAnalyzerAgent } from '../agents/data-analyzer';
import { runAnalyzerAgent } from '../agents/analyzer';
import { runStrategistAgent } from '../agents/strategist';
import { runWriterAgent } from '../agents/writer';
import { 
    type DataAnalysisOutput, 
    type AnalysisOutput, 
    type StrategyOutput, 
    type ProposalOutput,
    type GeneratedRFQResponse 
} from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

// Step 1: Data Analysis
export async function executeDataAnalyzer(): Promise<{
    success: boolean;
    data?: DataAnalysisOutput;
    error?: string;
}> {
    try {
        AgentLogger.logSystemEvent('Starting Data Analyzer execution');
        
        // Load raw JSON data
        const contractJson = require('../../../data/contract-data/contract.json');
        const documentsJson = require('../../../data/contract-data/documents.json');
        const entityJson = require('../../../data/entity-data/entity.json');
        
        const result = await runDataAnalyzerAgent(contractJson, entityJson, documentsJson);
        
        AgentLogger.logSystemEvent('Data Analyzer completed successfully', {
            contractType: result.contractInfo.type,
            requirementsCount: result.contractInfo.keyRequirements.length,
        });
        
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AgentLogger.logSystemEvent('Data Analyzer failed', { error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

// Step 2: Strategic Analysis
export async function executeStrategicAnalyzer(dataAnalysis: DataAnalysisOutput): Promise<{
    success: boolean;
    data?: AnalysisOutput;
    error?: string;
}> {
    try {
        AgentLogger.logSystemEvent('Starting Strategic Analyzer execution');
        
        const result = await runAnalyzerAgent(dataAnalysis);
        
        AgentLogger.logSystemEvent('Strategic Analyzer completed successfully', {
            requirementsCount: result.requirements.length,
            gapsCount: result.gaps.length,
        });
        
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AgentLogger.logSystemEvent('Strategic Analyzer failed', { error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

// Step 3: Strategy Development
export async function executeStrategist(
    dataAnalysis: DataAnalysisOutput, 
    analysis: AnalysisOutput
): Promise<{
    success: boolean;
    data?: StrategyOutput;
    error?: string;
}> {
    try {
        AgentLogger.logSystemEvent('Starting Strategist execution');
        
        const result = await runStrategistAgent(dataAnalysis, analysis);
        
        AgentLogger.logSystemEvent('Strategist completed successfully', {
            winProbability: result.winProbability,
            valuePropsCount: result.valuePropositions.length,
        });
        
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AgentLogger.logSystemEvent('Strategist failed', { error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

// Step 4: Response Generation
export async function executeWriter(
    dataAnalysis: DataAnalysisOutput,
    analysis: AnalysisOutput,
    strategy: StrategyOutput
): Promise<{
    success: boolean;
    data?: ProposalOutput;
    error?: string;
}> {
    try {
        AgentLogger.logSystemEvent('Starting Writer execution');
        
        // Load entity JSON for complete company information
        const entityJson = require('../../../data/entity-data/entity.json');
        
        const result = await runWriterAgent(dataAnalysis, analysis, strategy, entityJson);
        
        AgentLogger.logSystemEvent('Writer completed successfully', {
            responseBlocksCount: result.responseBlocks.length,
            formsGenerated: result.responseBlocks.filter(block => block.type === 'Form').length,
        });
        
        return { success: true, data: result };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AgentLogger.logSystemEvent('Writer failed', { error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

// Final Assembly
export async function assembleFinalResponse(
    dataAnalysis: DataAnalysisOutput,
    analysis: AnalysisOutput,
    strategy: StrategyOutput,
    proposal: ProposalOutput
): Promise<{
    success: boolean;
    data?: GeneratedRFQResponse;
    error?: string;
}> {
    try {
        AgentLogger.logSystemEvent('Assembling final RFQ response');
        
        // Load basic contract/entity info for metadata
        const contractJson = require('../../../data/contract-data/contract.json');
        const entityJson = require('../../../data/entity-data/entity.json');
        
        const finalResponse: GeneratedRFQResponse = {
            metadata: {
                rfqNumber: contractJson.solicitationNumber,
                companyName: entityJson.businessName,
                generatedAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                version: 1,
            },
            blocks: proposal.responseBlocks.map((block) => ({
                id: block.id,
                type: block.type as any,
                text: block.text,
                order: block.order,
                editable: block.editable,
                children: block.children || [],
                depth: block.depth || 0,
                metadata: {
                    ...block.metadata,
                    // For migration: preserve old structure if it exists
                    originalTitle: (block as any).title,
                    originalContent: (block as any).content,
                },
            })),
            agentInsights: {
                dataAnalysis,
                analysis,
                strategy,
                proposal,
                review: null,
            },
            submissionReady: true,
            confidenceScore: strategy.winProbability,
        };

        // Finalize detailed logging session
        detailedLogger.finalizeSession(finalResponse, true);
        
        AgentLogger.logSystemEvent('RFQ response assembled successfully', {
            contractType: dataAnalysis.contractInfo.type,
            finalScore: finalResponse.confidenceScore,
            blocksGenerated: finalResponse.blocks.length,
        });
        
        return { 
            success: true, 
            data: {
                ...finalResponse,
                logs: AgentLogger.getLogs(),
                summary: AgentLogger.getLogsSummary(),
            } as any
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        AgentLogger.logSystemEvent('Final assembly failed', { error: errorMessage });
        detailedLogger.finalizeSession(undefined, false);
        return { success: false, error: errorMessage };
    }
} 