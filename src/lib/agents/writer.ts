'use server';

/**
 * WRITER AGENT
 * 
 * PURPOSE:
 * This agent generates the actual RFQ response content by transforming strategic
 * insights and content guidelines into comprehensive, professional response blocks.
 * It creates submission-ready content that addresses all requirements and positions
 * the entity for maximum competitive advantage.
 * 
 * RESPONSIBILITIES:
 * 1. Generate comprehensive response blocks following strategic content guidelines
 * 2. Create detailed technical responses that address all contract requirements
 * 3. Develop professional company information that positions entity strengths
 * 4. Build required forms with appropriate field structures and pre-populated data
 * 5. Ensure consistent tone, messaging, and positioning throughout response
 * 
 * INPUT:
 * - dataAnalysis: Structured contract and entity data from Data Analyzer
 * - analysis: Strategic insights from Strategic Analyzer
 * - strategy: Positioning and content guidelines from Strategist
 * 
 * OUTPUT:
 * - ProposalOutput with complete response blocks, company info, technical response,
 *   narrative, pricing details, and submission forms ready for contracting officer review
 * 
 * CONTENT GENERATION APPROACH:
 * - Comprehensive: Address ALL contract requirements and deliverables
 * - Strategic: Follow positioning and messaging guidelines precisely
 * - Professional: Maintain appropriate government contracting tone
 * - Substantive: Generate detailed, meaningful content (not superficial)
 * - Submission-Ready: Include all required forms and compliance elements
 * 
 * WHY THIS MATTERS:
 * This agent transforms all strategic planning into the actual deliverable that
 * will be submitted to the government, determining the success of the entire process.
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { 
    ProposalOutputSchema, 
    type ProposalOutput, 
    type DataAnalysisOutput, 
    type AnalysisOutput,
    type StrategyOutput 
} from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

const MODEL = "gpt-4.1";

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
        const prompt = `You are writing a comprehensive RFQ response that will be submitted to government contracting officers. Generate detailed, professional response blocks based on the complete analysis and strategy.

CONTRACT INFORMATION:
Type: ${dataAnalysis.contractInfo.type}
Scope: ${dataAnalysis.contractInfo.scope}
Requirements: ${dataAnalysis.contractInfo.keyRequirements.join('; ')}
Deliverables: ${dataAnalysis.contractInfo.deliverables.join('; ')}
Locations: ${dataAnalysis.contractInfo.locations.join('; ')}
Timeline: ${dataAnalysis.contractInfo.timeline}
Submission Method: ${dataAnalysis.complianceRequirements.submissionMethod}

ENTITY INFORMATION:
Primary Capability: ${dataAnalysis.entityInfo.primaryCapability}
Business Type: ${dataAnalysis.entityInfo.businessType}
Relevant Experience: ${dataAnalysis.entityInfo.relevantExperience.join('; ')}
Competitive Advantages: ${dataAnalysis.entityInfo.competitiveAdvantages.join('; ')}

STRATEGY CONTEXT:
Positioning: ${strategy.positioning}
Win Probability: ${strategy.winProbability}%
Key Messages: ${strategy.contentStrategy.keyMessages.join('; ')}
Value Propositions: ${strategy.valuePropositions.join('; ')}
Gap Mitigation: ${strategy.gapMitigation}

REQUIRED FORMS TO GENERATE:
${dataAnalysis.complianceRequirements.requiredForms.map(form => `- ${form.name}: ${form.description} (${form.criticality})`).join('\n')}

CREATE COMPREHENSIVE RESPONSE BLOCKS:

1. H1 BLOCK: Professional title for the RFQ response
   - Use formal government contracting language
   - Include contract/solicitation number and brief scope

2. H2 BLOCK: "Company Information" 
   - Comprehensive company overview following strategic positioning
   - Highlight relevant capabilities and competitive advantages
   - Address business classification and certifications
   - Demonstrate understanding of contract requirements

3. FORM BLOCKS: Generate forms exactly as specified in compliance requirements
   - Create appropriate field structures for each required form
   - Pre-populate known entity data where appropriate
   - Leave user-specific fields empty for completion
   - Include clear instructions for completion

4. H2 BLOCK: "Technical Approach" or equivalent for this contract type
   - Professional section header appropriate for procurement type

5. TEXT BLOCK: Detailed technical response addressing all requirements and deliverables
   - Address EVERY contract requirement and deliverable specifically
   - Include methodology, approach, and implementation details
   - Demonstrate capability to meet performance standards
   - Address timeline and delivery requirements
   - Include gap mitigation strategies (partnerships, certifications, etc.)
   - Follow strategic messaging and positioning guidelines

6. H2 BLOCK: "Project Management" or "Delivery Approach"
   - Professional section header for implementation methodology

7. TEXT BLOCK: Detailed project management and delivery methodology
   - Comprehensive project management approach
   - Quality assurance and control measures
   - Risk management and mitigation strategies
   - Communication and coordination plans
   - Performance monitoring and reporting

8. TEXT BLOCK: Professional submission email template
   - Address appropriate contracting officers
   - Professional government contracting language
   - Include all required submission elements

CRITICAL REQUIREMENTS:
- Generate detailed, substantive content (minimum 200-500 words per major text block)
- Address ALL contract requirements and deliverables specifically
- Include specific methodologies, timelines, and approaches
- Pre-populate forms with known entity data
- Maintain professional government contracting tone throughout
- Follow strategic positioning and messaging guidelines precisely
- Ensure response demonstrates capability and inspires confidence
- Make the response submission-ready for government evaluation

Generate 8-12 response blocks total, ensuring comprehensive coverage of all requirements. This response will be evaluated by government contracting professionals, so ensure it meets the highest standards of completeness, professionalism, and compliance.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert government proposal writer with extensive experience creating winning RFQ responses. Generate comprehensive, detailed response blocks that demonstrate capability and inspire confidence in government evaluators.',
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