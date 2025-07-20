import { z } from 'zod';

// Response Block System (Core Product Output) - Hierarchical Structure
export type BlockType = 'H1' | 'H2' | 'H3' | 'Text' | 'Form';

export interface ResponseBlock {
    id: string;
    type: BlockType;
    text: string; // Simplified: only text, no separate title/content
    order: number;
    editable: boolean;
    children?: ResponseBlock[]; // NEW: Hierarchical structure
    depth?: number; // NEW: Track nesting level for UI rendering
    metadata?: {
        formFields?: FormField[];
        required?: boolean;
        instructions?: string;
        // NEW: For migration compatibility
        originalTitle?: string;
        originalContent?: string;
    };
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select';
    value: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
}

// Updated Agent Output Schemas - Now generate blocks
export const AnalysisOutputSchema = z.object({
    requirements: z.array(z.string()),
    gaps: z.array(z.string()),
    riskFactors: z.array(z.string()),
    opportunities: z.array(z.string()),
    complianceItems: z.array(z.string()),
    // New: Strategic insights for other agents
    insights: z.object({
        naicsStrategy: z.string(),
        competitiveAdvantage: z.string(),
        riskMitigation: z.string(),
    }),
});

export const StrategyOutputSchema = z.object({
    positioning: z.string(),
    gapMitigation: z.string(),
    valuePropositions: z.array(z.string()),
    winProbability: z.number(),
    pricingStrategy: z.string(),
    // New: Content strategy for writer
    contentStrategy: z.object({
        keyMessages: z.array(z.string()),
        toneGuidelines: z.string(),
        structureRecommendations: z.string(),
    }),
});

export const ProposalOutputSchema = z.object({
    // Old fields for insights display
    companyInfo: z.string(),
    technicalResponse: z.string(),
    narrative: z.string(),
    pricingDetails: z.string(),
    submissionForms: z.array(
        z.object({
            formName: z.string(),
            formContent: z.string(),
        }),
    ),
    // NEW: Hierarchical response blocks structure
    responseBlocks: z.array(
        z.object({
            id: z.string(),
            type: z.enum(['H1', 'H2', 'H3', 'Text', 'Form']),
            text: z.string(), // Simplified: only text
            order: z.number(),
            editable: z.boolean(),
            children: z.array(z.lazy(() => z.any())).optional(), // Recursive children
            depth: z.number().optional(),
            metadata: z
                .object({
                    formFields: z
                        .array(
                            z.object({
                                id: z.string(),
                                label: z.string(),
                                type: z.enum([
                                    'text',
                                    'email',
                                    'tel',
                                    'date',
                                    'textarea',
                                    'select',
                                ]),
                                value: z.string(),
                                required: z.boolean(),
                                options: z.array(z.string()).optional(),
                                placeholder: z.string().optional(),
                            }),
                        )
                        .optional(),
                    required: z.boolean().optional(),
                    instructions: z.string().optional(),
                    // For migration compatibility
                    originalTitle: z.string().optional(),
                    originalContent: z.string().optional(),
                })
                .optional(),
        }),
    ),
});

export const ReviewOutputSchema = z.object({
    complianceCheck: z.array(z.string()),
    submissionPackage: z.object({
        emailTemplate: z.string(),
        attachments: z.array(z.string()),
        submissionChecklist: z.array(z.string()),
    }),
    finalScore: z.number(),
    // NEW: Final hierarchical response blocks with adjustments
    finalResponseBlocks: z.array(
        z.object({
            id: z.string(),
            type: z.enum(['H1', 'H2', 'H3', 'Text', 'Form']),
            text: z.string(), // Simplified: only text
            order: z.number(),
            editable: z.boolean(),
            children: z.array(z.lazy(() => z.any())).optional(), // Recursive children
            depth: z.number().optional(),
            metadata: z
                .object({
                    formFields: z
                        .array(
                            z.object({
                                id: z.string(),
                                label: z.string(),
                                type: z.enum([
                                    'text',
                                    'email',
                                    'tel',
                                    'date',
                                    'textarea',
                                    'select',
                                ]),
                                value: z.string(),
                                required: z.boolean(),
                                options: z.array(z.string()).optional(),
                                placeholder: z.string().optional(),
                            }),
                        )
                        .optional(),
                    required: z.boolean().optional(),
                    instructions: z.string().optional(),
                    // For migration compatibility
                    originalTitle: z.string().optional(),
                    originalContent: z.string().optional(),
                })
                .optional(),
        }),
    ),
});

// NEW: Data Analysis Output - Generic structure for any contract/entity
export const DataAnalysisOutputSchema = z.object({
    contractInfo: z.object({
        type: z.string().describe('Type of procurement (e.g., "Manufacturing", "Services", "Construction")'),
        scope: z.string().describe('Brief scope description'),
        keyRequirements: z.array(z.string()).describe('List of key requirements extracted from contract'),
        deliverables: z.array(z.string()).describe('What needs to be delivered'),
        locations: z.array(z.string()).describe('Delivery or performance locations'),
        timeline: z.string().describe('Key dates and deadlines'),
        setAsideType: z.string().optional().describe('Set-aside type if applicable (SDVOSB, Small Business, etc.)'),
        specialRequirements: z.array(z.string()).describe('Special certifications, compliance, or unique requirements'),
    }),
    
    entityInfo: z.object({
        primaryCapability: z.string().describe('Primary business capability or industry focus'),
        relevantExperience: z.array(z.string()).describe('Relevant capabilities for this contract'),
        competitiveAdvantages: z.array(z.string()).describe('Key competitive advantages'),
        businessType: z.string().describe('Business classification (Small, Large, SDVOSB, etc.)'),
    }),
    
    gapAnalysis: z.object({
        naicsAlignment: z.object({
            required: z.string().describe('Required NAICS code'),
            entityPrimary: z.string().describe('Entity primary NAICS code'),
            isMatch: z.boolean().describe('Whether NAICS codes match'),
            complianceApproach: z.string().describe('How to address NAICS gap if exists'),
        }),
        capabilityGaps: z.array(z.string()).describe('Capability or experience gaps'),
        complianceGaps: z.array(z.string()).describe('Regulatory or certification gaps'),
        riskFactors: z.array(z.string()).describe('Key risk factors for this bid'),
    }),
    
    opportunityAssessment: z.object({
        winFactors: z.array(z.string()).describe('Factors that increase win probability'),
        competitivePositioning: z.string().describe('How to position against competitors'),
        valueProposition: z.string().describe('Core value proposition for this opportunity'),
        estimatedWinProbability: z.number().min(0).max(100).describe('Estimated win probability percentage'),
    }),
    
    complianceRequirements: z.object({
        requiredForms: z.array(z.object({
            name: z.string(),
            description: z.string(),
            criticality: z.enum(['Required', 'Optional', 'Conditional']),
        })).describe('Forms required for submission'),
        certifications: z.array(z.string()).describe('Required certifications or registrations'),
        submissionMethod: z.string().describe('How and where to submit the response'),
        keyDeadlines: z.array(z.string()).describe('Critical deadlines to track'),
    }),
    
    // NEW: Technical Requirements for detailed response generation
    technicalRequirements: z.object({
        specifications: z.array(z.string()).describe('Specific technical specifications from contract'),
        qualityStandards: z.array(z.string()).describe('Quality standards and testing requirements'),
        deliveryRequirements: z.array(z.string()).describe('Delivery and installation requirements'),
        warrantyRequirements: z.array(z.string()).describe('Warranty and support requirements'),
        specialConsiderations: z.array(z.string()).describe('Any special technical considerations'),
    }),
    
    // NEW: Pricing and Terms for response generation
    pricingAndTerms: z.object({
        paymentTerms: z.array(z.string()).describe('Payment terms and conditions'),
        deliveryTimeline: z.array(z.string()).describe('Delivery timeline requirements'),
        warrantyTerms: z.array(z.string()).describe('Warranty requirements'),
        financialRequirements: z.array(z.string()).describe('Any financial or bonding requirements'),
    }),
    
    // Document Analysis (simplified - no form mapping)
    documentAnalysis: z.object({
        documentsProcessed: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            url: z.string(),
            analysisSuccess: z.boolean(),
            summary: z.string().optional().describe('Brief summary of document content'),
        })).describe('Analysis of real contract documents for context'),
    }),
});

export type DataAnalysisOutput = z.infer<typeof DataAnalysisOutputSchema>;

// Inferred types
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;
export type ProposalOutput = z.infer<typeof ProposalOutputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// Complete Generated Response (Final Product)
export interface GeneratedRFQResponse {
    metadata: {
        rfqNumber: string;
        companyName: string;
        generatedAt: string;
        lastModified: string;
        version: number;
    };
    blocks: ResponseBlock[];
    agentInsights: {
        dataAnalysis?: DataAnalysisOutput;
        analysis: AnalysisOutput;
        strategy: StrategyOutput;
        proposal: ProposalOutput;
        review: ReviewOutput | null;
    };
    submissionReady: boolean;
    confidenceScore: number;
}

// Agent states (unchanged)
export type AgentState = 'pending' | 'working' | 'completed' | 'error';

export interface AgentProgress {
    dataAnalyzer: {
        state: AgentState;
        message: string;
        result?: DataAnalysisOutput;
    };
    analyzer: {
        state: AgentState;
        message: string;
        result?: AnalysisOutput;
    };
    strategist: {
        state: AgentState;
        message: string;
        result?: StrategyOutput;
    };
    writer: {
        state: AgentState;
        message: string;
        result?: ProposalOutput;
    };
    reviewer?: {
        state: AgentState;
        message: string;
        result?: ReviewOutput;
    };
}

// Data types (unchanged)
export interface Contract {
    id: string;
    title: string;
    solicitationNumber: string;
    agencyName: string;
    naicsId: string;
    deadlineDate: string;
    description: string;
    overview: string;
}

export interface Entity {
    id: string;
    businessName: string;
    physicalAddress: string;
    naicsCodes: Array<{
        code: string;
        name: string;
    }>;
    cageCode: string;
    entityStartDate: string;
}

// Utility functions for block management - Updated for hierarchical structure
export const createBlock = (
    type: BlockType,
    text: string,
    order: number,
    editable: boolean = true,
    children?: ResponseBlock[],
    depth?: number,
    metadata?: ResponseBlock['metadata'],
): ResponseBlock => ({
    id: crypto.randomUUID(),
    type,
    text,
    order,
    editable,
    children,
    depth,
    metadata,
});

export const createFormBlock = (
    title: string,
    fields: FormField[],
    order: number,
    instructions?: string,
): ResponseBlock => ({
    id: crypto.randomUUID(),
    type: 'Form',
    text: title, // Use title as text for forms
    order,
    editable: true,
    metadata: {
        formFields: fields,
        required: true,
        instructions,
        originalTitle: title, // Keep for migration
    },
});

// NEW: Helper functions for hierarchical structure
export const createHierarchicalBlock = (
    type: BlockType,
    text: string,
    order: number,
    children?: ResponseBlock[],
    depth: number = 0,
): ResponseBlock => {
    return createBlock(type, text, order, true, children, depth);
};

export const addChildToBlock = (
    parent: ResponseBlock,
    child: ResponseBlock,
): ResponseBlock => {
    const updatedParent = { ...parent };
    if (!updatedParent.children) {
        updatedParent.children = [];
    }
    // Set child depth based on parent
    child.depth = (parent.depth || 0) + 1;
    updatedParent.children.push(child);
    return updatedParent;
};

export const flattenBlocks = (blocks: ResponseBlock[]): ResponseBlock[] => {
    const flattened: ResponseBlock[] = [];
    
    const flatten = (block: ResponseBlock) => {
        flattened.push(block);
        if (block.children) {
            block.children.forEach(flatten);
        }
    };
    
    blocks.forEach(flatten);
    return flattened;
};

// Migration helpers for legacy data
export const migrateLegacyBlock = (legacyBlock: any): ResponseBlock => {
    return {
        id: legacyBlock.id || crypto.randomUUID(),
        type: legacyBlock.type,
        text: legacyBlock.title || legacyBlock.content || legacyBlock.text,
        order: legacyBlock.order,
        editable: legacyBlock.editable,
        children: [],
        depth: 0,
        metadata: {
            ...legacyBlock.metadata,
            originalTitle: legacyBlock.title,
            originalContent: legacyBlock.content,
        },
    };
};
