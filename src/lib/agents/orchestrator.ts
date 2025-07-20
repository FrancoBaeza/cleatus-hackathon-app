'use server';

/**
 * ORCHESTRATOR
 * 
 * PURPOSE:
 * This orchestrator coordinates the sequential execution of all AI agents to generate
 * a comprehensive RFQ response. It manages the flow of data between agents and ensures
 * each agent receives the proper context from previous agents.
 * 
 * RESPONSIBILITIES:
 * 1. Load raw contract and entity data from JSON files
 * 2. Execute agents in proper sequence with appropriate data flow
 * 3. Manage error handling and logging across all agent executions
 * 4. Assemble final response with all agent outputs and insights
 * 5. Ensure system remains contract-agnostic and universally applicable
 * 
 * AGENT EXECUTION FLOW:
 * 1. Data Analyzer: Process raw JSON → structured data analysis
 * 2. Strategic Analyzer: Structured data → strategic insights and gaps
 * 3. Strategist: Analysis + insights → comprehensive bid strategy
 * 4. Writer: All previous outputs → final RFQ response blocks
 * 
 * ERROR HANDLING:
 * - Each agent failure is logged and propagated appropriately
 * - System attempts to provide meaningful error context
 * - Detailed logging captures execution metadata for debugging
 * 
 * WHY THIS MATTERS:
 * The orchestrator ensures proper agent coordination and data flow,
 * making the multi-agent system reliable and maintainable.
 */

import { type GeneratedRFQResponse } from '../types';
import { runDataAnalyzerAgent } from './data-analyzer';
import { runAnalyzerAgent } from './analyzer';
import { runStrategistAgent } from './strategist';
import { runWriterAgent } from './writer';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

export async function generateProposalResponse(): Promise<GeneratedRFQResponse> {
    AgentLogger.logSystemEvent('Starting contract-agnostic multi-agent RFQ response generation');
    AgentLogger.clearLogs();

    try {
        // Load raw JSON data (contract-agnostic approach)
        const contractJson = require('../../../../data/contract-data/contract.json');
        const entityJson = require('../../../../data/entity-data/entity.json');

        // Step 1: Data Analysis - Extract structured information from raw JSON
        AgentLogger.logSystemEvent('Step 1: Processing raw contract and entity data');
        const dataAnalysis = await runDataAnalyzerAgent(contractJson, entityJson);

        // Step 2: Strategic Analysis - Based on structured data
        AgentLogger.logSystemEvent('Step 2: Performing strategic analysis and gap identification');
        const analysis = await runAnalyzerAgent(dataAnalysis);

        // Step 3: Strategy Development - Content strategy and positioning
        AgentLogger.logSystemEvent('Step 3: Developing bid strategy and positioning');
        const strategy = await runStrategistAgent(dataAnalysis, analysis);

        // Step 4: Response Generation - Comprehensive RFQ response
        AgentLogger.logSystemEvent('Step 4: Generating comprehensive RFQ response blocks');
        const proposal = await runWriterAgent(dataAnalysis, analysis, strategy);

        // Assemble final response
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
                review: null, // Using 4-agent system (no reviewer)
            },
            submissionReady: true,
            confidenceScore: strategy.winProbability,
        };

        AgentLogger.logSystemEvent(
            'Contract-agnostic RFQ response generation completed successfully',
            {
                contractType: dataAnalysis.contractInfo.type,
                finalScore: finalResponse.confidenceScore,
                blocksGenerated: finalResponse.blocks.length,
                submissionReady: finalResponse.submissionReady,
                totalAgents: 4,
            },
        );

        // Finalize detailed logging session
        detailedLogger.finalizeSession(finalResponse, true);

        return {
            ...finalResponse,
            logs: AgentLogger.getLogs(),
            summary: AgentLogger.getLogsSummary(),
        } as any;

    } catch (error) {
        AgentLogger.logSystemEvent(
            'Contract-agnostic RFQ response generation failed',
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                stage: 'Agent execution',
            },
        );
        
        detailedLogger.finalizeSession(undefined, false);
        
        throw error;
    }
} 