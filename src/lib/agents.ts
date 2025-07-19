'use server';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { 
  AnalysisOutputSchema, 
  StrategyOutputSchema, 
  ProposalOutputSchema, 
  ReviewOutputSchema,
  type AnalysisOutput,
  type StrategyOutput,
  type ProposalOutput,
  type ReviewOutput,
  type GeneratedRFQResponse,
  createBlock,
  createFormBlock
} from './types';
import { 
  getContractData, 
  getEntityData, 
  getContractSummary, 
  getEntitySummary,
  extractContractRequirements,
  identifyNAICSGaps
} from './data';
import { AgentLogger } from './logger';

// Agent 1: Analyzer - Strategic insights for team collaboration
export async function runAnalyzerAgent(): Promise<AnalysisOutput> {
  const startTime = AgentLogger.logAgentStart('analyzer', 'RFQ Analysis & Strategic Insights Generation');
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const contractSummary = getContractSummary(contract);
    const entitySummary = getEntitySummary(entity);
    
    // Pre-analysis using our domain logic
    const baseRequirements = extractContractRequirements(contract);
    const baseGaps = identifyNAICSGaps(entity, contract.naicsId);
    
    const prompt = `You are the lead analyst for a government contracting team. Your job is to analyze this RFQ and provide strategic insights that your teammates (Strategist, Writer, and Reviewer) will use to create a winning RFQ response.

CONTRACT TO ANALYZE:
${contractSummary}

BIDDING COMPANY:
${entitySummary}

INITIAL FINDINGS:
- Requirements Identified: ${baseRequirements.join('; ')}
- NAICS Gaps Found: ${baseGaps.join('; ')}

YOUR ANALYSIS MUST PROVIDE:
1. Complete requirements list (what the RFQ asks for)
2. Critical gaps (especially NAICS 236220 vs 337127 mismatch)
3. Risk factors (timeline, competition, delivery challenges)
4. Strategic opportunities (small business set-aside, delivery expertise)
5. Compliance requirements (forms, certifications needed)

STRATEGIC INSIGHTS FOR YOUR TEAM:
- NAICS Strategy: How should we handle the construction vs manufacturing gap?
- Competitive Advantage: What makes us uniquely qualified despite the gaps?
- Risk Mitigation: How do we address the biggest concerns?

FOCUS: This is an Air Force RFQ for 8 bleacher systems. We need 100% SDVOSB compliance, and delivery to Texas. The deadline is July 21, 2025.

Provide analysis that helps your team create a professional, compliant, winning RFQ response.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert government contracting analyst leading a response team. Provide strategic insights that enable your teammates to create a winning RFQ response. Focus on actionable intelligence.',
      prompt,
      schema: AnalysisOutputSchema,
    });

    AgentLogger.logAgentSuccess('analyzer', 'RFQ Analysis & Strategic Insights Generation', startTime, {
      requirementsCount: result.object.requirements.length,
      gapsCount: result.object.gaps.length,
      insightsGenerated: Object.keys(result.object.insights).length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('analyzer', 'RFQ Analysis & Strategic Insights Generation', startTime, error);
    throw new Error(`Analyzer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 2: Strategist - Content strategy and positioning for Writer
export async function runStrategistAgent(analysis: AnalysisOutput): Promise<StrategyOutput> {
  const startTime = AgentLogger.logAgentStart('strategist', 'Response Strategy & Content Guidelines', {
    inputGaps: analysis.gaps.length,
    inputInsights: Object.keys(analysis.insights).length
  });
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const prompt = `You are the bid strategist working with your team to create a winning RFQ response. The Analyzer has provided insights, and now you need to develop the strategy and content guidelines for the Writer.

ANALYST'S FINDINGS:
Requirements: ${analysis.requirements.join('; ')}
Critical Gaps: ${analysis.gaps.join('; ')}
Opportunities: ${analysis.opportunities.join('; ')}

ANALYST'S STRATEGIC INSIGHTS:
- NAICS Strategy: ${analysis.insights.naicsStrategy}
- Competitive Advantage: ${analysis.insights.competitiveAdvantage}
- Risk Mitigation: ${analysis.insights.riskMitigation}

CONTRACT CONTEXT:
RFQ: ${contract.solicitationNumber} - ${contract.title}
Agency: ${contract.agencyName}
Company: ${entity.businessName}

YOUR STRATEGY DELIVERABLES:
1. Positioning statement (how we present ourselves)
2. Gap mitigation approach (especially NAICS manufacturing issue)
3. Value propositions (why choose us over competitors)
4. Win probability assessment (realistic 0-100%)
5. Pricing strategy approach

CONTENT STRATEGY FOR WRITER:
- Key messages to emphasize throughout response
- Tone guidelines (professional government contracting style)
- Structure recommendations (how to organize the response blocks)

REMEMBER: This RFQ requires:
- Basic company information form
- Technical specifications with pictures/drawings
- Two financial forms (Attachments 2 & 3)
- Email submission to two Air Force contacts

Your strategy should position us as the best choice despite the NAICS gap, leveraging our construction expertise and partnership approach.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert bid strategist. Develop winning positioning and detailed content strategy that transforms challenges into advantages. Your output guides the Writer in creating the actual RFQ response.',
      prompt,
      schema: StrategyOutputSchema,
    });

    AgentLogger.logAgentSuccess('strategist', 'Response Strategy & Content Guidelines', startTime, {
      winProbability: result.object.winProbability,
      valuePropsCount: result.object.valuePropositions.length,
      contentStrategyItems: Object.keys(result.object.contentStrategy).length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('strategist', 'Response Strategy & Content Guidelines', startTime, error);
    throw new Error(`Strategist Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 3: Writer - Generate the actual RFQ response blocks
export async function runWriterAgent(analysis: AnalysisOutput, strategy: StrategyOutput): Promise<ProposalOutput> {
  const startTime = AgentLogger.logAgentStart('writer', 'RFQ Response Block Generation', {
    strategyWinProb: strategy.winProbability,
    requirementsCount: analysis.requirements.length
  });
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const prompt = `You are the response writer creating the actual RFQ submission. Your teammates have analyzed the requirements and developed strategy. Now you must create the structured response blocks.

REQUIREMENTS TO ADDRESS:
${analysis.requirements.join('\n')}

STRATEGIC GUIDANCE:
Positioning: ${strategy.positioning}
Gap Mitigation: ${strategy.gapMitigation}
Key Messages: ${strategy.contentStrategy.keyMessages.join('; ')}
Tone Guidelines: ${strategy.contentStrategy.toneGuidelines}

CONTRACT DETAILS:
RFQ: ${contract.solicitationNumber} - ${contract.title}
Agency: ${contract.agencyName}
Deadline: ${new Date(contract.deadlineDate).toLocaleDateString()}
Required NAICS: ${contract.naicsId}

COMPANY INFORMATION:
${getEntitySummary(entity)}

CREATE STRUCTURED RESPONSE BLOCKS FOR:

1. H1 BLOCK: "RFQ Response - FA301625Q0050 Bleacher Seating Systems"

2. H2 BLOCK: "Company Information"

3. FORM BLOCK: Basic Quote Information (per RFQ requirements)
   Fields needed:
   - Company Name: ${entity.businessName}
   - CAGE/SAM Unique Entity ID: ${entity.cageCode}
   - Payment Terms
   - Delivery Date (Estimated)
   - Point of Contact & Telephone
   - Email Address & Tax ID
   - Warranty Information
   - Electronic invoicing capability (WAWF)

4. H2 BLOCK: "Technical Specifications"

5. TEXT BLOCK: Technical response addressing all requirements using strategic positioning

6. H2 BLOCK: "Partnership Approach" (addresses NAICS gap)

7. TEXT BLOCK: Explanation of manufacturing partnership strategy

8. H2 BLOCK: "Required Documentation"

9. FORM BLOCK: Attachment 2 - Contractor Release of Financial Information

10. FORM BLOCK: Attachment 3 - Financial Information Questionnaire

11. H2 BLOCK: "Submission Details"

12. TEXT BLOCK: Email template for submission

CRITICAL REQUIREMENTS:
- Address the NAICS gap through partnership approach
- Include all required forms and information
- Use professional government contracting tone
- Position company strengths while mitigating weaknesses
- Ensure compliance with all RFQ requirements

Generate both the legacy format (for insights) AND the new responseBlocks array with proper structure, order, and form fields.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert government proposal writer. Create structured response blocks that form a complete, professional RFQ response. Follow the strategic guidance while ensuring full compliance.',
      prompt,
      schema: ProposalOutputSchema,
    });

    AgentLogger.logAgentSuccess('writer', 'RFQ Response Block Generation', startTime, {
      responseBlocksCount: result.object.responseBlocks.length,
      formsGenerated: result.object.responseBlocks.filter(block => block.type === 'Form').length,
      totalContentLength: result.object.responseBlocks.reduce((acc, block) => acc + block.content.length, 0)
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('writer', 'RFQ Response Block Generation', startTime, error);
    throw new Error(`Writer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 4: Reviewer - Final compliance and block optimization
export async function runReviewerAgent(
  analysis: AnalysisOutput, 
  strategy: StrategyOutput, 
  proposal: ProposalOutput
): Promise<ReviewOutput> {
  const startTime = AgentLogger.logAgentStart('reviewer', 'Response Review & Final Block Assembly', {
    responseBlocksToReview: proposal.responseBlocks.length,
    complianceItems: analysis.complianceItems.length
  });
  
  try {
    const contract = getContractData();
    
    const prompt = `You are the final reviewer ensuring our RFQ response is submission-ready. Review the response blocks created by the Writer and make any necessary adjustments.

CONTRACT REQUIREMENTS:
RFQ: ${contract.solicitationNumber} - ${contract.title}
Agency: ${contract.agencyName}
Deadline: ${new Date(contract.deadlineDate).toLocaleDateString()}
Submission emails: parie.reynolds@us.af.mil; lance.watters.1@us.af.mil

ORIGINAL REQUIREMENTS CHECKLIST:
${analysis.requirements.join('\n')}

COMPLIANCE REQUIREMENTS:
${analysis.complianceItems.join('\n')}

GENERATED RESPONSE BLOCKS TO REVIEW:
${proposal.responseBlocks.map(block => `${block.type}: ${block.title} (${block.content.length} chars)`).join('\n')}

REVIEW CHECKLIST:
1. All RFQ requirements addressed
2. Required forms included and properly structured
3. Technical specifications complete
4. NAICS gap properly addressed
5. Professional tone maintained
6. Contact information correct
7. Submission method compliant

FINAL DELIVERABLES:
1. Compliance check results
2. Submission package details (email template, attachments, checklist)
3. Final confidence score (0-100%)
4. Final response blocks (with any necessary adjustments)

Ensure the response is professional, compliant, and ready for submission to the Air Force contracting officers.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert compliance reviewer for government contracts. Ensure complete accuracy and compliance. Provide final confidence assessment and submission-ready package.',
      prompt,
      schema: ReviewOutputSchema,
    });

    AgentLogger.logAgentSuccess('reviewer', 'Response Review & Final Block Assembly', startTime, {
      finalScore: result.object.finalScore,
      complianceChecks: result.object.complianceCheck.length,
      finalBlocksCount: result.object.finalResponseBlocks.length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('reviewer', 'Response Review & Final Block Assembly', startTime, error);
    throw new Error(`Reviewer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main orchestrator - now returns complete RFQ response
export async function generateProposalResponse(): Promise<GeneratedRFQResponse> {
  AgentLogger.logSystemEvent('Starting multi-agent RFQ response generation');
  AgentLogger.clearLogs();
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    // Agent 1: Analysis & Strategic Insights
    const analysis = await runAnalyzerAgent();
    
    // Agent 2: Strategy & Content Guidelines  
    const strategy = await runStrategistAgent(analysis);
    
    // Agent 3: Response Block Generation
    const proposal = await runWriterAgent(analysis, strategy);
    
    // Agent 4: Final Review & Assembly
    const review = await runReviewerAgent(analysis, strategy, proposal);
    
    // Assemble final response
    const finalResponse: GeneratedRFQResponse = {
      metadata: {
        rfqNumber: contract.solicitationNumber,
        companyName: entity.businessName,
        generatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1,
      },
      blocks: review.finalResponseBlocks.map(block => ({
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
        review,
      },
      submissionReady: review.finalScore >= 90,
      confidenceScore: review.finalScore,
    };

    AgentLogger.logSystemEvent('Multi-agent RFQ response generation completed', {
      finalScore: review.finalScore,
      blocksGenerated: finalResponse.blocks.length,
      submissionReady: finalResponse.submissionReady
    });

    return {
      ...finalResponse,
      logs: AgentLogger.getLogs(),
      summary: AgentLogger.getLogsSummary()
    } as any;
  } catch (error) {
    AgentLogger.logSystemEvent('Multi-agent RFQ response generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
} 