'use server';

/**
 * STRATEGIST AGENT
 * 
 * PURPOSE:
 * This agent develops comprehensive bid strategy and content guidelines based on
 * data analysis and strategic insights. It transforms analytical findings into
 * actionable strategy that maximizes win probability and competitive positioning.
 * 
 * RESPONSIBILITIES:
 * 1. Develop positioning strategy that leverages entity strengths while addressing gaps
 * 2. Create gap mitigation approaches that turn weaknesses into competitive advantages
 * 3. Formulate value propositions that differentiate from competitors
 * 4. Assess realistic win probability based on comprehensive analysis
 * 5. Design content strategy with key messages, tone, and structure guidelines for the Writer
 * 
 * INPUT:
 * - dataAnalysis: Structured data from Data Analyzer Agent
 * - analysis: Strategic insights from Strategic Analyzer Agent
 * 
 * OUTPUT:
 * - StrategyOutput with positioning, gap mitigation, value propositions,
 *   win probability, pricing strategy, and detailed content guidelines
 * 
 * STRATEGIC APPROACH:
 * - Positioning: How to present the entity as the ideal choice
 * - Gap Mitigation: Convert challenges into competitive advantages
 * - Value Props: Clear differentiation from competitors
 * - Content Strategy: Detailed guidelines for response generation
 * - Win Optimization: Maximize probability of selection
 * 
 * WHY THIS MATTERS:
 * This agent ensures the RFQ response has a coherent, persuasive strategy
 * that positions the entity for maximum competitive advantage and win probability.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { 
    StrategyOutputSchema, 
    type StrategyOutput, 
    type DataAnalysisOutput, 
    type AnalysisOutput 
} from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

const MODEL = "gpt-4.1";

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
        const prompt = `You are developing the bid strategy for this RFQ response. Based on the data analysis and strategic insights, create a comprehensive strategy that maximizes win probability.

DATA ANALYSIS CONTEXT:
Contract: ${dataAnalysis.contractInfo.type} - ${dataAnalysis.contractInfo.scope}
Entity: ${dataAnalysis.entityInfo.primaryCapability} (${dataAnalysis.entityInfo.businessType})
Value Proposition: ${dataAnalysis.opportunityAssessment.valueProposition}
Competitive Positioning: ${dataAnalysis.opportunityAssessment.competitivePositioning}
Win Probability: ${dataAnalysis.opportunityAssessment.estimatedWinProbability}%

DOCUMENT CONTEXT:
Documents Processed: ${dataAnalysis.documentAnalysis.documentsProcessed.length} documents available for context

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
   - Craft a compelling positioning statement that highlights unique value
   - Address the entity's core strengths relative to contract requirements
   - Position any gaps as opportunities for partnership or innovation
   - Frame the entity as the logical choice for this contract

2. GAP MITIGATION: Specific approach to address identified gaps
   - For each gap, develop a mitigation strategy that turns weakness into strength
   - Create partnership strategies for capability gaps
   - Develop compliance approaches for regulatory gaps
   - Design risk management approaches for identified risks

3. VALUE PROPOSITIONS: Key value propositions that differentiate from competitors
   - Identify 3-5 unique value propositions that resonate with this procurement
   - Focus on entity strengths that align with contract priorities
   - Emphasize competitive advantages in relevant areas
   - Address how the entity delivers superior value

4. WIN PROBABILITY: Realistic assessment based on comprehensive analysis
   - Provide updated win probability considering strategy implementation
   - Identify key factors that could increase/decrease win probability
   - Outline specific actions to optimize chances of selection

5. PRICING STRATEGY: High-level approach to competitive pricing
   - Recommend pricing approach (competitive, value-based, cost-plus)
   - Consider set-aside advantages and market positioning
   - Balance competitiveness with profitability

CONTENT STRATEGY FOR WRITER:
- Key Messages: 3-5 core messages to emphasize throughout response
- Tone Guidelines: Appropriate professional tone for this procurement type
- Structure Recommendations: How to organize response for maximum impact
- Evidence Requirements: What proof points and examples to include

Your strategy should transform challenges into advantages and position the entity as the best choice for this contract. Be specific and actionable - the Writer will use these guidelines to create the actual response.`;

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