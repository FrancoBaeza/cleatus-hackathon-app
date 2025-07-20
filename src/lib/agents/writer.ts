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
    entityJson?: any,
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
        const prompt = `
        You are an expert government contracting assistant. Based on the extracted requirements from the RFQ document, your task is to write a complete, compliant, and professional quote response for submission to a U.S. Government RFQ.

        The response must:

        - Include all mandatory company information, pricing details, and required documents.
        - Clearly address all technical specifications and requirements outlined in the Statement of Work (SOW).
        - Be formatted in a clear, formal, and concise manner suitable for federal acquisition officers.
        - Be ready to send via email to the specified contracting officers.

        Do not include unnecessary background or marketing language. Focus on compliance and completeness.
        Use neutral, business-professional language and ensure it aligns with FAR/DFARS standards.

        IMPORTANT: 
        You must include all the compliance requirements from the data analysis. If the information is not in the response, the government will not accept the response.
        This information should have its own block in the response and be clear and ordered. 
        Use the complete entity JSON data to extract all the company information and fill the form fields with the specific information you have extracted.
        Use explicit information from the entity JSON, do not use generic information like [Redacted for Privacy] placeholders.
        Use the actual company name, CAGE code, address, NAICS codes, and other specific details from the entity JSON.


        CONTRACT INFORMATION:
        Type: ${dataAnalysis.contractInfo.type}
        Scope: ${dataAnalysis.contractInfo.scope}
        Requirements: ${dataAnalysis.contractInfo.keyRequirements.join('; ')}
        Deliverables: ${dataAnalysis.contractInfo.deliverables.join('; ')}
        Locations: ${dataAnalysis.contractInfo.locations.join('; ')}
        Timeline: ${dataAnalysis.contractInfo.timeline}
        Submission Method: ${dataAnalysis.complianceRequirements.submissionMethod}

        TECHNICAL REQUIREMENTS:
        Specifications: ${dataAnalysis.technicalRequirements?.specifications?.join('; ') || 'Not specified'}
        Quality Standards: ${dataAnalysis.technicalRequirements?.qualityStandards?.join('; ') || 'Not specified'}
        Delivery Requirements: ${dataAnalysis.technicalRequirements?.deliveryRequirements?.join('; ') || 'Not specified'}
        Warranty Requirements: ${dataAnalysis.technicalRequirements?.warrantyRequirements?.join('; ') || 'Not specified'}

        PRICING AND TERMS:
        Payment Terms: ${dataAnalysis.pricingAndTerms?.paymentTerms?.join('; ') || 'Not specified'}
        Delivery Timeline: ${dataAnalysis.pricingAndTerms?.deliveryTimeline?.join('; ') || 'Not specified'}
        Warranty Terms: ${dataAnalysis.pricingAndTerms?.warrantyTerms?.join('; ') || 'Not specified'}

        ENTITY INFORMATION (FROM ANALYSIS):
        Primary Capability: ${dataAnalysis.entityInfo.primaryCapability}
        Business Type: ${dataAnalysis.entityInfo.businessType}
        Relevant Experience: ${dataAnalysis.entityInfo.relevantExperience.join('; ')}
        Competitive Advantages: ${dataAnalysis.entityInfo.competitiveAdvantages.join('; ')}

        COMPLETE ENTITY DATA (JSON):
        ${entityJson ? JSON.stringify(entityJson, null, 2) : 'Entity JSON not provided'}

        STRATEGY CONTEXT:
        Positioning: ${strategy.positioning}
        Win Probability: ${strategy.winProbability}%
        Key Messages: ${strategy.contentStrategy.keyMessages.join('; ')}
        Value Propositions: ${strategy.valuePropositions.join('; ')}
        Gap Mitigation: ${strategy.gapMitigation}

        REQUIRED FORMS TO GENERATE:
        ${dataAnalysis.complianceRequirements.requiredForms.map(form => {
            const formFieldsInfo = form.formFields && form.formFields.length > 0 
                ? `\n  Fields: ${form.formFields.map(field => `${field.name} (${field.type}, ${field.required ? 'required' : 'optional'})`).join(', ')}`
                : '';
            return `- ${form.name}: ${form.description} (${form.criticality})${formFieldsInfo}`;
        }).join('\n')}

        CONTACT INFORMATION FOR SUBMISSION:
        Primary Contact: ${dataAnalysis.complianceRequirements.contactInformation?.primaryContact?.name || 'Not specified'} (${dataAnalysis.complianceRequirements.contactInformation?.primaryContact?.email || 'No email'})
        Secondary Contact: ${dataAnalysis.complianceRequirements.contactInformation?.secondaryContact?.name || 'Not specified'} (${dataAnalysis.complianceRequirements.contactInformation?.secondaryContact?.email || 'No email'})
        Submission Emails: ${dataAnalysis.complianceRequirements.contactInformation?.submissionEmail?.join(', ') || 'Not specified'}
        Submission Instructions: ${dataAnalysis.complianceRequirements.contactInformation?.submissionInstructions || 'Not specified'}
        Office Address: ${dataAnalysis.complianceRequirements.contactInformation?.officeAddress ? `${dataAnalysis.complianceRequirements.contactInformation.officeAddress.city}, ${dataAnalysis.complianceRequirements.contactInformation.officeAddress.state} ${dataAnalysis.complianceRequirements.contactInformation.officeAddress.zipCode}` : 'Not specified'}

        CREATE HIERARCHICAL RESPONSE STRUCTURE:

        IMPORTANT: Generate a hierarchical structure where content is properly nested under headers.
        Each block should only contain ONE element - either a header OR content text, never both.
        Headers (H1, H2, H3) create sections that contain their child content.

        CREATIVE FREEDOM WITH CONTRACT FOCUS:

        You have complete creative freedom to structure the response, but you MUST include the following contract-specific elements:

        REQUIRED CONTRACT ELEMENTS (be creative in how you present these):
        1. Executive Summary - Address specific contract requirements and entity capabilities
        2. Company Information - Show how entity capabilities align with this specific contract
        3. Technical Approach - Address each deliverable and technical specification from the contract
        4. Project Management - Show understanding of contract timeline and requirements
        5. Pricing and Terms - Address contract payment terms and delivery requirements
        6. Submission Information - Include complete contact information and submission instructions

        CREATIVE STRUCTURE GUIDELINES:
        - Use creative, engaging section titles that reflect the specific contract
        - Organize content in a logical flow that tells a compelling story
        - Vary the depth and structure based on the contract complexity
        - Include relevant subsections that address specific contract requirements
        - Be creative with how you present technical specifications and methodology
        - Adapt the structure to highlight the entity's strengths for this specific opportunity

        CONTENT REQUIREMENTS:
        - Make every section SPECIFIC to this contract's requirements
        - Address each deliverable mentioned in the contract
        - Include technical specifications relevant to this procurement
        - Show understanding of the contract's quality standards and testing requirements
        - Demonstrate compliance with contract terms and conditions
        - Highlight competitive advantages for this specific opportunity

        FORMS: Generate one FORM block for each required form with the specific fields identified in the analysis. Each form should include:
        - Form title and description
        - All required fields with proper types (text, email, tel, date, textarea, select)
        - Pre-populated values where available from entity data
        - Required field indicators
        - Proper field validation and formatting

        STRUCTURE EXAMPLE (but be creative):
        - H1: Creative title that reflects the contract
        - H2: Company Information (creative subsection titles)
        - H2: Technical Approach (creative subsection titles)
        - H2: Project Management (creative subsection titles)
        - H2: Pricing and Terms (creative subsection titles)

        CRITICAL REQUIREMENTS FOR HIERARCHICAL STRUCTURE:
        - Each block contains ONLY text content (no mixing of titles and content)
        - Headers (H1, H2, H3) are separate blocks that contain children
        - Text blocks contain substantive content (150-600 words for major sections)
        - Maintain proper parent-child relationships in the hierarchy
        - Use appropriate depth levels (H1=0, H2=1, H3=2)
        - Address ALL contract requirements across the hierarchical structure
        - Follow strategic positioning throughout all content blocks
        - Generate forms as separate blocks with proper field structures
        - Make content SPECIFIC to the contract requirements, not generic
        - Include technical specifications, delivery details, and compliance information
        - Be creative and engaging while maintaining professionalism
        - Vary content length based on importance and complexity

        FORM GENERATION REQUIREMENTS:
        - Use the exact form fields identified in the analysis
        - Pre-populate fields with specific entity data from the JSON:
          * Company Name: Use businessName from entity JSON
          * CAGE Code: Use cageCode from entity JSON
          * Address: Use physicalAddress from entity JSON
          * NAICS Codes: Use naicsCodes array from entity JSON
          * UEI Code: Use ueiCode from entity JSON
          * Entity Start Date: Use entityStartDate from entity JSON
        - Include all required fields with proper validation
        - Structure forms as FORM blocks with metadata containing field definitions
        - Ensure forms are submission-ready and compliant
        - Use real, specific data, never placeholder text

        SUBMISSION INFORMATION REQUIREMENTS:
        - Include a dedicated section with complete contact information
        - List all submission email addresses clearly
        - Include specific submission instructions and deadlines
        - Provide office address and contact details
        - Make submission information easily accessible for automated sending
        - Include any special submission requirements or formatting instructions

        Generate a complete hierarchical structure with approximately 15-30 total blocks (including all headers and content). Adapt the structure to the contract complexity and entity strengths. This atomized approach allows for better content organization and editing flexibility.`;

        const result = await generateObject({
            model: openai(MODEL),
            system: 'You are a creative and experienced government proposal writer who specializes in crafting compelling, unique RFQ responses. You have a talent for presenting technical information in engaging ways while maintaining the professional tone required for government contracting. You adapt your writing style and structure to highlight the specific strengths of each company for each unique opportunity. Your responses are always contract-specific, creative, and designed to win.',
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
        
        // Use hierarchical blocks directly (no form auto-completion)
        console.log('📝 Using generated response blocks directly');
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