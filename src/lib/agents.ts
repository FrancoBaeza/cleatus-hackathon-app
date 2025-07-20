'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import {
    AnalysisOutputSchema,
    StrategyOutputSchema,
    ProposalOutputSchema,
    DataAnalysisOutputSchema,
    type AnalysisOutput,
    type StrategyOutput,
    type ProposalOutput,
    type DataAnalysisOutput,
    type GeneratedRFQResponse,
} from './types';
import { AgentLogger } from './logger';
import { detailedLogger } from './agent-logger';

// Use GPT-4 for better reasoning
const MODEL = "gpt-4.1";

// NEW: Data Analyzer Agent - Processes raw JSON data to extract structured information
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
   - Procurement type and scope
   - Key requirements and deliverables
   - Performance locations
   - Timeline and deadlines
   - Set-aside type if applicable
   - Special requirements

2. ENTITY ASSESSMENT:
   - Primary business capability
   - Relevant experience for this contract
   - Competitive advantages
   - Business classification

3. GAP ANALYSIS:
   - NAICS code alignment (required vs entity primary)
   - Capability gaps
   - Compliance gaps
   - Risk factors

4. OPPORTUNITY ASSESSMENT:
   - Win factors
   - Competitive positioning strategy
   - Value proposition
   - Estimated win probability

5. COMPLIANCE REQUIREMENTS:
   - Required forms for submission
   - Certifications needed
   - Submission method and deadlines

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

// Agent 1: Analyzer - Strategic insights based on structured data
export async function runAnalyzerAgent(dataAnalysis: DataAnalysisOutput): Promise<AnalysisOutput> {
    const startTime = AgentLogger.logAgentStart(
        'analyzer',
        'Strategic Analysis & Insights Generation',
    );

    const { executionId, startTime: detailedStartTime } = detailedLogger.logAgentStart('analyzer');

    try {
        const prompt = `You are conducting strategic analysis for an RFQ response. Based on the structured data analysis, provide strategic insights for the response team.

STRUCTURED DATA ANALYSIS:
Contract Type: ${dataAnalysis.contractInfo.type}
Scope: ${dataAnalysis.contractInfo.scope}
Key Requirements: ${dataAnalysis.contractInfo.keyRequirements.join('; ')}
Deliverables: ${dataAnalysis.contractInfo.deliverables.join('; ')}
Performance Locations: ${dataAnalysis.contractInfo.locations.join('; ')}
Timeline: ${dataAnalysis.contractInfo.timeline}
Set-Aside: ${dataAnalysis.contractInfo.setAsideType || 'Not specified'}

Entity Primary Capability: ${dataAnalysis.entityInfo.primaryCapability}
Relevant Experience: ${dataAnalysis.entityInfo.relevantExperience.join('; ')}
Business Type: ${dataAnalysis.entityInfo.businessType}

NAICS Alignment: Required ${dataAnalysis.gapAnalysis.naicsAlignment.required} vs Entity ${dataAnalysis.gapAnalysis.naicsAlignment.entityPrimary} (Match: ${dataAnalysis.gapAnalysis.naicsAlignment.isMatch})
Capability Gaps: ${dataAnalysis.gapAnalysis.capabilityGaps.join('; ')}
Risk Factors: ${dataAnalysis.gapAnalysis.riskFactors.join('; ')}

Win Factors: ${dataAnalysis.opportunityAssessment.winFactors.join('; ')}
Estimated Win Probability: ${dataAnalysis.opportunityAssessment.estimatedWinProbability}%

PROVIDE STRATEGIC ANALYSIS:

1. REQUIREMENTS: Comprehensive list of what the RFQ asks for
2. GAPS: Critical gaps between requirements and entity capabilities  
3. RISK FACTORS: Key risks that could impact bid success
4. OPPORTUNITIES: Strategic opportunities to leverage
5. COMPLIANCE ITEMS: All compliance requirements to address
6. STRATEGIC INSIGHTS:
   - NAICS Strategy: How to address NAICS alignment issues
   - Competitive Advantage: How to position entity strengths
   - Risk Mitigation: How to address key risks

Focus on actionable insights that enable the team to create a winning response.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert government contracting analyst. Provide strategic insights that enable your team to create a winning RFQ response based on structured data analysis.',
            prompt,
            schema: AnalysisOutputSchema,
        });

        AgentLogger.logAgentSuccess(
            'analyzer',
            'Strategic Analysis & Insights Generation',
            startTime,
            {
                requirementsCount: result.object.requirements.length,
                gapsCount: result.object.gaps.length,
                insightsGenerated: Object.keys(result.object.insights).length,
            },
        );

        detailedLogger.logAgentSuccess(
            'analyzer',
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
            'analyzer',
            'Strategic Analysis & Insights Generation',
            startTime,
            error,
        );

        detailedLogger.logAgentError(
            'analyzer',
            executionId,
            detailedStartTime,
            error,
            {
                modelUsed: MODEL,
                promptLength: 0
            }
        );

        throw new Error(
            `Analyzer Agent failed: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

// Agent 2: Strategist - Content strategy and positioning
export async function runStrategistAgent(
    dataAnalysis: DataAnalysisOutput,
    analysis: AnalysisOutput,
): Promise<StrategyOutput> {
    const startTime = AgentLogger.logAgentStart(
        'strategist',
        'Response Strategy & Content Guidelines',
        {
            inputGaps: analysis.gaps.length,
            winProbability: dataAnalysis.opportunityAssessment.estimatedWinProbability,
        },
    );

    const { executionId, startTime: detailedStartTime } = detailedLogger.logAgentStart(
        'strategist', 
        { dataAnalysisInput: dataAnalysis, analysisInput: analysis }
    );

    try {
        const prompt = `You are developing the bid strategy for this RFQ response. Based on the data analysis and strategic insights, create a comprehensive strategy.

DATA ANALYSIS CONTEXT:
Contract: ${dataAnalysis.contractInfo.type} - ${dataAnalysis.contractInfo.scope}
Entity: ${dataAnalysis.entityInfo.primaryCapability} (${dataAnalysis.entityInfo.businessType})
Value Proposition: ${dataAnalysis.opportunityAssessment.valueProposition}
Competitive Positioning: ${dataAnalysis.opportunityAssessment.competitivePositioning}
Win Probability: ${dataAnalysis.opportunityAssessment.estimatedWinProbability}%

STRATEGIC ANALYSIS:
Requirements: ${analysis.requirements.join('; ')}
Critical Gaps: ${analysis.gaps.join('; ')}
Opportunities: ${analysis.opportunities.join('; ')}
Risk Factors: ${analysis.riskFactors.join('; ')}

STRATEGIC INSIGHTS:
- NAICS Strategy: ${analysis.insights.naicsStrategy}
- Competitive Advantage: ${analysis.insights.competitiveAdvantage}
- Risk Mitigation: ${analysis.insights.riskMitigation}

DEVELOP COMPREHENSIVE STRATEGY:

1. POSITIONING: How to present the entity for this specific opportunity
2. GAP MITIGATION: Specific approach to address identified gaps
3. VALUE PROPOSITIONS: Key value propositions that differentiate from competitors
4. WIN PROBABILITY: Realistic assessment based on analysis
5. PRICING STRATEGY: High-level approach to pricing

CONTENT STRATEGY FOR WRITER:
- Key messages to emphasize throughout response
- Tone guidelines appropriate for this procurement type
- Structure recommendations for response organization

Your strategy should transform challenges into advantages and position the entity as the best choice for this contract.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert bid strategist. Develop winning positioning and detailed content strategy that maximizes the chance of RFQ success.',
            prompt,
            schema: StrategyOutputSchema,
        });

        AgentLogger.logAgentSuccess(
            'strategist',
            'Response Strategy & Content Guidelines',
            startTime,
            {
                winProbability: result.object.winProbability,
                valuePropsCount: result.object.valuePropositions.length,
                contentStrategyItems: Object.keys(result.object.contentStrategy).length,
            },
        );

        detailedLogger.logAgentSuccess(
            'strategist',
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
            'strategist',
            'Response Strategy & Content Guidelines',
            startTime,
            error,
        );

        detailedLogger.logAgentError(
            'strategist',
            executionId,
            detailedStartTime,
            error,
            {
                modelUsed: MODEL,
                promptLength: 0
            }
        );

        throw new Error(
            `Strategist Agent failed: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

// Agent 3: Writer - Generate the actual RFQ response blocks
export async function runWriterAgent(
    dataAnalysis: DataAnalysisOutput,
    analysis: AnalysisOutput,
    strategy: StrategyOutput,
): Promise<ProposalOutput> {
    const startTime = AgentLogger.logAgentStart(
        'writer',
        'RFQ Response Block Generation',
        {
            strategyWinProb: strategy.winProbability,
            requirementsCount: analysis.requirements.length,
        },
    );

    const { executionId, startTime: detailedStartTime } = detailedLogger.logAgentStart(
        'writer', 
        { dataAnalysisInput: dataAnalysis, analysisInput: analysis, strategyInput: strategy }
    );

    try {
        const prompt = `You are writing a comprehensive RFQ response. Generate detailed, professional response blocks based on the complete analysis and strategy.

CONTRACT INFORMATION:
Type: ${dataAnalysis.contractInfo.type}
Scope: ${dataAnalysis.contractInfo.scope}
Requirements: ${dataAnalysis.contractInfo.keyRequirements.join('; ')}
Deliverables: ${dataAnalysis.contractInfo.deliverables.join('; ')}
Locations: ${dataAnalysis.contractInfo.locations.join('; ')}
Timeline: ${dataAnalysis.contractInfo.timeline}
Submission Method: ${dataAnalysis.complianceRequirements.submissionMethod}

ENTITY INFORMATION:
Business Name: [Extract from data]
Primary Capability: ${dataAnalysis.entityInfo.primaryCapability}
Business Type: ${dataAnalysis.entityInfo.businessType}
Relevant Experience: ${dataAnalysis.entityInfo.relevantExperience.join('; ')}

STRATEGY CONTEXT:
Positioning: ${strategy.positioning}
Win Probability: ${strategy.winProbability}%
Key Messages: ${strategy.contentStrategy.keyMessages.join('; ')}
Value Propositions: ${strategy.valuePropositions.join('; ')}

REQUIRED FORMS (generate exactly as specified):
${dataAnalysis.complianceRequirements.requiredForms.map(form => `- ${form.name}: ${form.description} (${form.criticality})`).join('\n')}

CREATE COMPREHENSIVE RESPONSE BLOCKS:

1. H1 BLOCK: Professional title for the RFQ response
2. H2 BLOCK: "Company Information" - Detailed company overview
3. FORM BLOCKS: Generate forms exactly as specified in compliance requirements
4. H2 BLOCK: "Technical Approach" or equivalent for this contract type
5. TEXT BLOCK: Detailed technical response addressing all requirements and deliverables
6. H2 BLOCK: "Project Management" or "Delivery Approach"
7. TEXT BLOCK: Detailed project management and delivery methodology
8. TEXT BLOCK: Professional submission email template

REQUIREMENTS:
- Generate detailed, substantive content (not superficial)
- Address ALL contract requirements and deliverables
- Include specific methodologies, timelines, and approaches
- Pre-populate forms with known entity data
- Maintain professional government contracting tone
- Ensure response is submission-ready

Generate between 8-12 response blocks total, ensuring comprehensive coverage of all requirements.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert government proposal writer. Create detailed, comprehensive response blocks that form a complete, professional RFQ response ready for submission.',
            prompt,
            schema: ProposalOutputSchema,
        });

        AgentLogger.logAgentSuccess(
            'writer',
            'RFQ Response Block Generation',
            startTime,
            {
                responseBlocksCount: result.object.responseBlocks.length,
                formsGenerated: result.object.responseBlocks.filter(
                    (block) => block.type === 'Form',
                ).length,
                totalContentLength: result.object.responseBlocks.reduce(
                    (acc, block) => acc + block.content.length,
                    0,
                ),
            },
        );

        detailedLogger.logAgentSuccess(
            'writer',
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
            'writer',
            'RFQ Response Block Generation',
            startTime,
            error,
        );

        detailedLogger.logAgentError(
            'writer',
            executionId,
            detailedStartTime,
            error,
            {
                modelUsed: MODEL,
                promptLength: 0
            }
        );

        throw new Error(
            `Writer Agent failed: ${
                error instanceof Error ? error.message : 'Unknown error'
            }`,
        );
    }
}

// Main orchestrator - completely generic system
export async function generateProposalResponse(): Promise<GeneratedRFQResponse> {
    AgentLogger.logSystemEvent('Starting contract-agnostic multi-agent RFQ response generation');
    AgentLogger.clearLogs();

    try {
        // Load raw JSON data
        const contractJson = require('../../data/contract-data/contract.json');
        const entityJson = require('../../data/entity-data/entity.json');

        // Step 1: Data Analysis - Extract structured information from raw JSON
        const dataAnalysis = await runDataAnalyzerAgent(contractJson, entityJson);

        // Step 2: Strategic Analysis - Based on structured data
        const analysis = await runAnalyzerAgent(dataAnalysis);

        // Step 3: Strategy Development - Content strategy and positioning
        const strategy = await runStrategistAgent(dataAnalysis, analysis);

        // Step 4: Response Generation - Comprehensive RFQ response
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
                title: block.title,
                content: block.content,
                order: block.order,
                editable: block.editable,
                metadata: block.metadata,
            })),
            agentInsights: {
                analysis,
                strategy,
                proposal,
                review: null, // Using 3-agent system
            },
            submissionReady: true,
            confidenceScore: strategy.winProbability,
        };

        AgentLogger.logSystemEvent(
            'Contract-agnostic RFQ response generation completed',
            {
                contractType: dataAnalysis.contractInfo.type,
                finalScore: finalResponse.confidenceScore,
                blocksGenerated: finalResponse.blocks.length,
                submissionReady: finalResponse.submissionReady,
            },
        );

        // Finalize detailed logging session
        detailedLogger.finalizeSession(finalResponse, true);

        return {
            ...finalResponse,
            logs: AgentLogger.getLogs(),
            summary: AgentLogger.getLogsSummary(),
            dataAnalysis, // Include the structured data analysis in response
        } as any;
    } catch (error) {
        AgentLogger.logSystemEvent(
            'Contract-agnostic RFQ response generation failed',
            {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        );
        
        detailedLogger.finalizeSession(undefined, false);
        
        throw error;
    }
}
