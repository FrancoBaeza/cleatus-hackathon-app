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
    type StrategyOutput,
    type ResponseBlock,
    createHierarchicalBlock 
} from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';

const MODEL = "gpt-4.1";

/**
 * Helper function to create hierarchical response blocks structure
 * Converts AI-generated flat blocks into proper hierarchical structure
 */
function buildHierarchicalStructure(flatBlocks: any[]): ResponseBlock[] {
    const hierarchicalBlocks: ResponseBlock[] = [];
    let currentOrder = 0;
    
    // Find the root H1 block or create one if missing
    let rootBlock: ResponseBlock;
    const h1Block = flatBlocks.find(b => b.type === 'H1');
    
    if (h1Block) {
        rootBlock = createHierarchicalBlock(
            'H1',
            h1Block.text,
            currentOrder++,
            [],
            0
        );
        rootBlock.id = h1Block.id || crypto.randomUUID();
        rootBlock.metadata = h1Block.metadata;
    } else {
        // Create default root if no H1 found
        rootBlock = createHierarchicalBlock(
            'H1',
            'RFQ Response',
            currentOrder++,
            [],
            0
        );
    }
    
    // Process remaining blocks and organize into hierarchy
    let currentH2: ResponseBlock | null = null;
    let currentH3: ResponseBlock | null = null;
    
    for (const block of flatBlocks) {
        if (block.type === 'H1') continue; // Already processed
        
        const newBlock: ResponseBlock = {
            id: block.id || crypto.randomUUID(),
            type: block.type,
            text: block.text,
            order: currentOrder++,
            editable: block.editable !== false,
            children: [],
            depth: 0,
            metadata: block.metadata,
        };
        
        if (block.type === 'H2') {
            // Add previous H2 to root if exists
            if (currentH2) {
                if (!rootBlock.children) rootBlock.children = [];
                rootBlock.children.push(currentH2);
            }
            // Start new H2 section
            currentH2 = { ...newBlock, depth: 1, children: [] };
            currentH3 = null;
        } else if (block.type === 'H3') {
            // Add previous H3 to current H2 if exists
            if (currentH3 && currentH2) {
                if (!currentH2.children) currentH2.children = [];
                currentH2.children.push(currentH3);
            }
            // Start new H3 section
            currentH3 = { ...newBlock, depth: 2, children: [] };
        } else if (block.type === 'Text') {
            // Add text to appropriate parent
            const textBlock = { ...newBlock };
            
            if (currentH3) {
                textBlock.depth = 3;
                if (!currentH3.children) currentH3.children = [];
                currentH3.children.push(textBlock);
            } else if (currentH2) {
                textBlock.depth = 2;
                if (!currentH2.children) currentH2.children = [];
                currentH2.children.push(textBlock);
            } else {
                textBlock.depth = 1;
                if (!rootBlock.children) rootBlock.children = [];
                rootBlock.children.push(textBlock);
            }
        } else if (block.type === 'Form') {
            // Forms are direct children of root
            const formBlock = { ...newBlock, depth: 1 };
            if (!rootBlock.children) rootBlock.children = [];
            rootBlock.children.push(formBlock);
        }
    }
    
    // Add final H3 to H2 if exists
    if (currentH3 && currentH2) {
        if (!currentH2.children) currentH2.children = [];
        currentH2.children.push(currentH3);
    }
    
    // Add final H2 to root if exists
    if (currentH2) {
        if (!rootBlock.children) rootBlock.children = [];
        rootBlock.children.push(currentH2);
    }
    
    hierarchicalBlocks.push(rootBlock);
    return hierarchicalBlocks;
}

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

CREATE HIERARCHICAL RESPONSE STRUCTURE:

IMPORTANT: Generate a hierarchical structure where content is properly nested under headers.
Each block should only contain ONE element - either a header OR content text, never both.
Headers (H1, H2, H3) create sections that contain their child content.

GENERATE EXACTLY THE FOLLOWING BLOCKS IN ORDER:

BLOCK 1: H1 - "Response to ${dataAnalysis.contractInfo.type} - Solicitation [Number]"
BLOCK 2: TEXT - "Executive Summary: [2-3 paragraph overview of your response and capability]"

BLOCK 3: H2 - "Company Information"
BLOCK 4: H3 - "Company Overview"  
BLOCK 5: TEXT - "[Comprehensive 200+ word company overview, positioning, capabilities]"
BLOCK 6: H3 - "Business Classification and Certifications"
BLOCK 7: TEXT - "[Business type, certifications, NAICS alignment details]"
BLOCK 8: H3 - "Core Competencies"
BLOCK 9: TEXT - "[Relevant experience and competitive advantages, 150+ words]"

BLOCK 10: H2 - "Technical Approach"
BLOCK 11: H3 - "Understanding of Requirements"
BLOCK 12: TEXT - "[Demonstration of requirement comprehension, 200+ words]"
BLOCK 13: H3 - "Methodology and Implementation"
BLOCK 14: TEXT - "[Detailed technical approach and implementation, 300+ words]"
BLOCK 15: H3 - "Deliverables and Quality Assurance"
BLOCK 16: TEXT - "[How each deliverable will be addressed with QA measures, 200+ words]"

BLOCK 17: H2 - "Project Management and Delivery"
BLOCK 18: H3 - "Project Organization"
BLOCK 19: TEXT - "[Team structure and management approach, 150+ words]"
BLOCK 20: H3 - "Timeline and Risk Management"
BLOCK 21: TEXT - "[Project timeline, milestones, and risk mitigation, 200+ words]"

FORMS: Generate one FORM block for each required form with appropriate fields.

CRITICAL REQUIREMENTS FOR HIERARCHICAL STRUCTURE:
- Each block contains ONLY text content (no mixing of titles and content)
- Headers (H1, H2, H3) are separate blocks that contain children
- Text blocks contain substantive content (200-500 words for major sections)
- Maintain proper parent-child relationships in the hierarchy
- Use appropriate depth levels (H1=0, H2=1, H3=2)
- Address ALL contract requirements across the hierarchical structure
- Follow strategic positioning throughout all content blocks
- Generate forms as separate blocks with proper field structures

Generate a complete hierarchical structure with approximately 15-20 total blocks (including all headers and content). This atomized approach allows for better content organization and editing flexibility.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are an expert government proposal writer with extensive experience creating winning RFQ responses. Generate comprehensive, detailed response blocks that demonstrate capability and inspire confidence in government evaluators.',
            prompt,
            schema: ProposalOutputSchema,
        });

        // Build hierarchical structure from flat blocks
        console.log('🔍 Original flat blocks:', result.object.responseBlocks.length, 'blocks');
        console.log('🔍 Block types:', result.object.responseBlocks.map(b => `${b.type}: "${b.text.substring(0, 50)}..."`));
        
        const hierarchicalBlocks = buildHierarchicalStructure(result.object.responseBlocks);
        
        console.log('🏗️ Hierarchical structure created:');
        console.log('- Root blocks:', hierarchicalBlocks.length);
        if (hierarchicalBlocks[0]) {
            console.log('- Root children:', hierarchicalBlocks[0].children?.length || 0);
            hierarchicalBlocks[0].children?.forEach((child, i) => {
                console.log(`  - Child ${i}: ${child.type} - "${child.text.substring(0, 30)}..." (${child.children?.length || 0} children)`);
            });
        }
        
        // Update the result with hierarchical structure
        result.object.responseBlocks = hierarchicalBlocks;

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
                    (acc, block) => acc + block.text.length,
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