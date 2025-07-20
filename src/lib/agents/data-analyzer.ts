'use server';

/**
 * DATA ANALYZER AGENT
 * 
 * PURPOSE:
 * This agent serves as the foundation of our contract-agnostic RFQ response system.
 * It processes raw JSON data from any contract and entity, extracting structured
 * information using AI to understand the opportunity without hardcoded logic.
 * 
 * RESPONSIBILITIES:
 * 1. Process raw contract JSON data to extract procurement type, scope, requirements
 * 2. Analyze entity JSON data to identify capabilities and business classification
 * 3. Perform gap analysis between contract requirements and entity capabilities
 * 4. Assess opportunity potential and estimate win probability
 * 5. Identify compliance requirements and required forms dynamically
 * 
 * INPUT:
 * - contractJson: Raw contract data from any government RFQ/RFP
 * - entityJson: Raw entity/company data with capabilities and classifications
 * 
 * OUTPUT:
 * - Structured DataAnalysisOutput with contract info, entity assessment, 
 *   gap analysis, opportunity assessment, and compliance requirements
 * 
 * WHY THIS MATTERS:
 * This agent eliminates hardcoding by using AI to understand any contract type,
 * making the system truly universal for government contracting opportunities.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { DataAnalysisOutputSchema, type DataAnalysisOutput } from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

const MODEL = "gpt-4.1";

export async function runDataAnalyzerAgent(contractJson: any, entityJson: any): Promise<DataAnalysisOutput> {
    const startTime = AgentLogger.logAgentStart(
        'data-analyzer',
        'Raw Data Processing & Structure Extraction',
    );

    const { executionId, startTime: detailedStartTime } = detailedLogger.logAgentStart('data-analyzer');

    try {
        const prompt = `You are analyzing raw contract and entity data to extract structured information for RFQ response generation. Process the data thoroughly and extract key insights.

RAW CONTRACT DATA:
${JSON.stringify(contractJson, null, 2)}

RAW ENTITY DATA:
${JSON.stringify(entityJson, null, 2)}

EXTRACT AND STRUCTURE THE FOLLOWING:

1. CONTRACT ANALYSIS:
   - Procurement type and scope (Manufacturing, Services, Construction, etc.)
   - Key requirements and deliverables (what exactly needs to be done)
   - Performance locations (where work will be performed)
   - Timeline and critical deadlines
   - Set-aside type if applicable (SDVOSB, Small Business, 8(a), etc.)
   - Special requirements (certifications, security clearances, etc.)

2. ENTITY ASSESSMENT:
   - Primary business capability and industry focus
   - Relevant experience for this specific contract type
   - Key competitive advantages
   - Business classification (size, certifications, specializations)

3. GAP ANALYSIS:
   - NAICS code alignment between required and entity primary
   - Capability gaps that need to be addressed
   - Compliance gaps (certifications, registrations)
   - Risk factors that could impact bid success

4. OPPORTUNITY ASSESSMENT:
   - Factors that increase win probability for this entity
   - How to position competitively against likely competitors
   - Core value proposition for this opportunity
   - Realistic win probability estimate (0-100%)

5. COMPLIANCE REQUIREMENTS:
   - Required forms for submission (extract from contract documents)
   - Certifications needed for compliance
   - Submission method and key deadlines
   - Critical deadlines to track

IMPORTANT: Base your analysis entirely on the provided data. Do not make assumptions beyond what's explicitly stated or reasonably inferred from the contract and entity information.

Be thorough and extract ALL relevant information from the raw data. This structured output will be used by other agents to generate the RFQ response.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert data analyst specializing in government contracts. Extract comprehensive, structured information from raw contract and entity data to enable automated RFQ response generation.',
            prompt,
            schema: DataAnalysisOutputSchema,
        });

        AgentLogger.logAgentSuccess(
            'data-analyzer',
            'Raw Data Processing & Structure Extraction',
            startTime,
            {
                contractType: result.object.contractInfo.type,
                requirementsCount: result.object.contractInfo.keyRequirements.length,
                naicsMatch: result.object.gapAnalysis.naicsAlignment.isMatch,
                winProbability: result.object.opportunityAssessment.estimatedWinProbability,
            },
        );

        detailedLogger.logAgentSuccess(
            'data-analyzer',
            executionId,
            detailedStartTime,
            result.object,
            {
                modelUsed: MODEL,
                promptLength: prompt.length
            }
        );

        return result.object;
    } catch (error) {
        AgentLogger.logAgentError(
            'data-analyzer',
            'Raw Data Processing & Structure Extraction',
            startTime,
            error,
        );

        detailedLogger.logAgentError(
            'data-analyzer',
            executionId,
            detailedStartTime,
            error,
            {
                modelUsed: MODEL,
                promptLength: 0
            }
        );

        throw new Error(
            `Data Analyzer Agent failed: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
} 