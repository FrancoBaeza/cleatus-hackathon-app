'use server';

/**
 * STRATEGIC ANALYZER AGENT
 * 
 * PURPOSE:
 * This agent performs strategic analysis of government contracting opportunities
 * based on structured data extracted by the Data Analyzer. It identifies strategic
 * insights, gaps, risks, and opportunities to guide the response strategy.
 * 
 * RESPONSIBILITIES:
 * 1. Analyze contract requirements and translate into actionable insights
 * 2. Identify critical capability and compliance gaps that must be addressed
 * 3. Assess risk factors that could impact bid success or contract performance
 * 4. Discover strategic opportunities to leverage entity strengths
 * 5. Provide strategic recommendations for NAICS compliance, competitive advantage, and risk mitigation
 * 
 * INPUT:
 * - dataAnalysis: Structured data analysis output from the Data Analyzer Agent
 * 
 * OUTPUT:
 * - AnalysisOutput with requirements list, gaps, risk factors, opportunities,
 *   compliance items, and strategic insights for the strategy team
 * 
 * STRATEGIC FOCUS:
 * - Requirements: What exactly must be delivered to win and perform
 * - Gaps: What's missing between requirements and current entity capabilities
 * - Risks: What could go wrong and impact success
 * - Opportunities: How to turn challenges into competitive advantages
 * - Compliance: What regulatory/procedural requirements must be met
 * 
 * WHY THIS MATTERS:
 * This agent bridges raw data analysis and strategic planning, ensuring the
 * strategy team has clear, actionable insights to develop a winning approach.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { AnalysisOutputSchema, type AnalysisOutput, type DataAnalysisOutput } from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

const MODEL = "gpt-4.1";

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

        DOCUMENT ANALYSIS:
        Documents Processed: ${dataAnalysis.documentAnalysis.documentsProcessed.length} documents analyzed for context

        PROVIDE STRATEGIC ANALYSIS:

        1. REQUIREMENTS: Comprehensive list of what the RFQ asks for
        - Break down ALL contract requirements into specific deliverables
        - Include performance standards, delivery locations, timeline requirements
        - Identify any special or unique requirements that differentiate this contract

        2. GAPS: Critical gaps between requirements and entity capabilities  
        - Capability gaps: What skills/experience are missing
        - Resource gaps: What resources/equipment are needed
        - Compliance gaps: What certifications/registrations are missing
        - Experience gaps: What past performance is lacking

        3. RISK FACTORS: Key risks that could impact bid success
        - Technical risks: Ability to meet specifications
        - Schedule risks: Timeline challenges
        - Compliance risks: Regulatory or procedural issues
        - Competitive risks: Strong competition or disadvantages

        4. OPPORTUNITIES: Strategic opportunities to leverage
        - Entity strengths that align with contract needs
        - Market advantages (location, relationships, certifications)
        - Competitive positioning opportunities
        - Partnership or teaming opportunities

        5. COMPLIANCE ITEMS: All compliance requirements to address
        - Required forms and documentation
        - Certifications and registrations needed
        - Set-aside compliance requirements
        - Submission requirements and deadlines

        6. STRATEGIC INSIGHTS:
        - NAICS Strategy: Specific approach to address NAICS alignment issues
        - Competitive Advantage: How to position entity strengths effectively
        - Risk Mitigation: How to address key risks and gaps

        Focus on actionable insights that enable the team to create a winning response strategy.`;

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