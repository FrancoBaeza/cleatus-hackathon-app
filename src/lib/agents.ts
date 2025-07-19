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
  type ReviewOutput
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

// Agent 1: Analyzer - Deep RFQ and capability analysis
export async function runAnalyzerAgent(): Promise<AnalysisOutput> {
  const startTime = AgentLogger.logAgentStart('analyzer', 'RFQ Analysis & Gap Detection');
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const contractSummary = getContractSummary(contract);
    const entitySummary = getEntitySummary(entity);
    
    // Pre-analysis using our domain logic
    const baseRequirements = extractContractRequirements(contract);
    const baseGaps = identifyNAICSGaps(entity, contract.naicsId);
    
    const prompt = `You are a senior government contracting analyst with 20+ years of experience in federal procurement, specializing in NAICS compliance, set-aside programs, and contractor qualification assessment.

TASK: Analyze this RFQ against the contractor's capabilities and identify all gaps, risks, opportunities, and compliance requirements.

CONTRACT INFORMATION:
${contractSummary}

CONTRACTOR INFORMATION:
${entitySummary}

INITIAL ANALYSIS INSIGHTS:
- Base Requirements Identified: ${baseRequirements.length} items
- NAICS Gaps Detected: ${baseGaps.length} issues
- Set-Aside Type: Check RFQ for SDVOSB/Small Business requirements
- Manufacturing vs Construction: Key consideration for this RFQ

ANALYSIS FOCUS AREAS:
1. NAICS Code Alignment & Non-Manufacturer Rule implications
2. Geographic delivery challenges (Virginia company → Texas delivery)
3. Technical capability gaps (construction vs manufacturing)
4. Competitive advantages (federal experience, small business status)
5. Compliance requirements (SDVOSB, financial forms, technical specs)
6. Risk factors (timeline, competition, specialization)
7. Strategic opportunities (partnerships, delivery expertise)

Provide comprehensive analysis with specific, actionable insights for each category.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert government contracting analyst. Provide detailed, specific analysis based on real federal procurement knowledge. Be thorough and identify all gaps, opportunities, and compliance requirements.',
      prompt,
      schema: AnalysisOutputSchema,
    });

    AgentLogger.logAgentSuccess('analyzer', 'RFQ Analysis & Gap Detection', startTime, {
      requirementsCount: result.object.requirements.length,
      gapsCount: result.object.gaps.length,
      opportunitiesCount: result.object.opportunities.length,
      complianceItemsCount: result.object.complianceItems.length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('analyzer', 'RFQ Analysis & Gap Detection', startTime, error);
    throw new Error(`Analyzer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 2: Strategist - Develop winning bid strategy
export async function runStrategistAgent(analysis: AnalysisOutput): Promise<StrategyOutput> {
  const startTime = AgentLogger.logAgentStart('strategist', 'Bid Strategy Development', {
    inputGaps: analysis.gaps.length,
    inputOpportunities: analysis.opportunities.length
  });
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const prompt = `You are a senior bid strategy consultant specializing in government contracting with expertise in partnership development, competitive positioning, and win probability assessment.

TASK: Based on the analysis results, develop a comprehensive winning strategy that addresses all identified gaps while maximizing competitive advantages.

ANALYSIS RESULTS:
Requirements Identified: ${analysis.requirements.join('; ')}

Critical Gaps: ${analysis.gaps.join('; ')}

Risk Factors: ${analysis.riskFactors.join('; ')}

Opportunities: ${analysis.opportunities.join('; ')}

CONTRACT CONTEXT:
- RFQ: ${contract.solicitationNumber} - ${contract.title}
- Agency: ${contract.agencyName}
- Required NAICS: ${contract.naicsId} (Manufacturing)
- Company Primary NAICS: ${entity.naicsCodes[0]?.code} (${entity.naicsCodes[0]?.name})

STRATEGIC FOCUS AREAS:
1. Gap Mitigation Strategy (especially NAICS 337127 manufacturing requirement)
2. Partnership Approach (leverage manufacturing partnerships)
3. Value Proposition Development (construction + logistics expertise)
4. Competitive Positioning (Arlington location + federal experience)
5. Win Probability Assessment (realistic evaluation 0-100%)
6. Pricing Strategy (competitive but value-focused approach)

Develop specific, actionable strategies that transform challenges into competitive advantages. Consider the partnership model as a key differentiator.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert bid strategist. Develop realistic, actionable strategies that address gaps while leveraging strengths. Focus on partnership approaches and competitive differentiation.',
      prompt,
      schema: StrategyOutputSchema,
    });

    AgentLogger.logAgentSuccess('strategist', 'Bid Strategy Development', startTime, {
      winProbability: result.object.winProbability,
      valuePropsCount: result.object.valuePropositions.length,
      positioningLength: result.object.positioning.length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('strategist', 'Bid Strategy Development', startTime, error);
    throw new Error(`Strategist Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 3: Writer - Generate professional proposal content
export async function runWriterAgent(analysis: AnalysisOutput, strategy: StrategyOutput): Promise<ProposalOutput> {
  const startTime = AgentLogger.logAgentStart('writer', 'Proposal Content Generation', {
    strategyWinProb: strategy.winProbability,
    requirementsCount: analysis.requirements.length
  });
  
  try {
    const contract = getContractData();
    const entity = getEntityData();
    
    const prompt = `You are a senior government proposal writer with 20+ years of experience writing winning federal contract responses. You specialize in clear, compliant, professional writing that resonates with government evaluators.

TASK: Write comprehensive proposal content using the strategic approach and analysis results. Ensure professional government contracting tone and complete requirement coverage.

STRATEGIC APPROACH:
Positioning: ${strategy.positioning}
Gap Mitigation: ${strategy.gapMitigation}
Pricing Strategy: ${strategy.pricingStrategy}
Value Propositions: ${strategy.valuePropositions.join('; ')}

REQUIREMENTS TO ADDRESS:
${analysis.requirements.join('\n')}

COMPLIANCE ITEMS REQUIRED:
${analysis.complianceItems.join('\n')}

CONTRACT DETAILS:
RFQ: ${contract.solicitationNumber}
Title: ${contract.title}
Agency: ${contract.agencyName}
Deadline: ${new Date(contract.deadlineDate).toLocaleDateString()}

COMPANY INFORMATION:
${getEntitySummary(entity)}

WRITING REQUIREMENTS:
1. Company Information: Professional description emphasizing federal contracting experience
2. Technical Response: Address all RFQ requirements with specific details
3. Strategic Narrative: Explain partnership approach and competitive advantages  
4. Pricing Details: Competitive pricing with value justification
5. Submission Forms: List and describe required forms (Financial Release, etc.)

TONE & STYLE:
- Professional government contracting language
- Clear, direct communication style
- Emphasis on compliance and capability
- Avoid marketing fluff, focus on facts and qualifications
- Use specific details and quantifiable statements

Write content that demonstrates deep understanding of government requirements and positions the partnership approach as a strategic advantage.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert government proposal writer. Write clear, professional, compliant content that addresses all requirements. Use government contracting best practices and terminology.',
      prompt,
      schema: ProposalOutputSchema,
    });

    AgentLogger.logAgentSuccess('writer', 'Proposal Content Generation', startTime, {
      companyInfoLength: result.object.companyInfo.length,
      technicalResponseLength: result.object.technicalResponse.length,
      formsCount: result.object.submissionForms.length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('writer', 'Proposal Content Generation', startTime, error);
    throw new Error(`Writer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Agent 4: Reviewer - Final compliance check and submission package
export async function runReviewerAgent(
  analysis: AnalysisOutput, 
  strategy: StrategyOutput, 
  proposal: ProposalOutput
): Promise<ReviewOutput> {
  const startTime = AgentLogger.logAgentStart('reviewer', 'Compliance Review & Package Assembly', {
    proposalSections: 4,
    complianceItems: analysis.complianceItems.length
  });
  
  try {
    const contract = getContractData();
    
    const prompt = `You are a senior compliance reviewer and government contracting specialist responsible for final proposal review before submission. You ensure 100% compliance with RFQ requirements and professional submission standards.

TASK: Review the complete proposal for compliance, consistency, and submission readiness. Generate final submission package with confidence assessment.

CONTRACT REQUIREMENTS:
RFQ: ${contract.solicitationNumber}
Title: ${contract.title}
Agency: ${contract.agencyName}
Deadline: ${new Date(contract.deadlineDate).toLocaleDateString()}
Required NAICS: ${contract.naicsId}

SUBMISSION CONTACTS:
- Primary: parie.reynolds@us.af.mil (Contract Specialist)
- Secondary: lance.watters.1@us.af.mil (Contracting Officer)

ORIGINAL REQUIREMENTS:
${analysis.requirements.join('\n')}

COMPLIANCE CHECKLIST:
${analysis.complianceItems.join('\n')}

PROPOSAL CONTENT TO REVIEW:
Company Info: ${proposal.companyInfo.substring(0, 200)}...
Technical Response: ${proposal.technicalResponse.substring(0, 200)}...
Pricing: ${proposal.pricingDetails}
Forms: ${proposal.submissionForms.map(f => f.formName).join(', ')}

REVIEW FOCUS AREAS:
1. Requirement Coverage: Verify all RFQ requirements are addressed
2. NAICS Compliance: Confirm manufacturing partnership approach is documented
3. Technical Accuracy: Check specifications and delivery details
4. Professional Standards: Ensure government-appropriate tone and format
5. Form Completion: Verify all required forms are included
6. Email Template: Professional submission email with correct recipients
7. Submission Checklist: Complete pre-submission verification

SCORING CRITERIA:
- 95-100%: Submission ready, all requirements met, professional quality
- 85-94%: Minor revisions needed, mostly complete
- 75-84%: Moderate issues, requires revision
- Below 75%: Major issues, significant revision required

Provide detailed compliance assessment and final confidence score for submission readiness.`;

    const result = await generateObject({
      model: openai('gpt-4'),
      system: 'You are an expert compliance reviewer for government contracts. Ensure complete requirement coverage and professional submission standards. Be thorough and realistic in your assessment.',
      prompt,
      schema: ReviewOutputSchema,
    });

    AgentLogger.logAgentSuccess('reviewer', 'Compliance Review & Package Assembly', startTime, {
      finalScore: result.object.finalScore,
      complianceChecks: result.object.complianceCheck.length,
      attachmentsCount: result.object.submissionPackage.attachments.length
    });

    return result.object;
  } catch (error) {
    AgentLogger.logAgentError('reviewer', 'Compliance Review & Package Assembly', startTime, error);
    throw new Error(`Reviewer Agent failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main orchestrator function - runs all agents in sequence
export async function generateProposalResponse() {
  AgentLogger.logSystemEvent('Starting multi-agent proposal generation');
  AgentLogger.clearLogs(); // Start fresh for each generation
  
  try {
    // Agent 1: Analysis
    const analysis = await runAnalyzerAgent();
    
    // Agent 2: Strategy  
    const strategy = await runStrategistAgent(analysis);
    
    // Agent 3: Content
    const proposal = await runWriterAgent(analysis, strategy);
    
    // Agent 4: Review
    const review = await runReviewerAgent(analysis, strategy, proposal);
    
    AgentLogger.logSystemEvent('Multi-agent proposal generation completed successfully', {
      finalScore: review.finalScore,
      winProbability: strategy.winProbability,
      totalDuration: 'calculated_by_frontend'
    });

    return {
      analysis,
      strategy,
      proposal,
      review,
      logs: AgentLogger.getLogs(),
      summary: AgentLogger.getLogsSummary()
    };
  } catch (error) {
    AgentLogger.logSystemEvent('Multi-agent proposal generation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
} 