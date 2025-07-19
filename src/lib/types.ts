import { z } from 'zod';

// Response Block System (Core Product Output)
export type BlockType = 'H1' | 'H2' | 'H3' | 'Text' | 'Form';

export interface ResponseBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  order: number;
  editable: boolean;
  metadata?: {
    formFields?: FormField[];
    required?: boolean;
    instructions?: string;
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
  submissionForms: z.array(z.object({
    formName: z.string(),
    formContent: z.string(),
  })),
  // New: Generated response blocks
  responseBlocks: z.array(z.object({
    id: z.string(),
    type: z.enum(['H1', 'H2', 'H3', 'Text', 'Form']),
    title: z.string(),
    content: z.string(),
    order: z.number(),
    editable: z.boolean(),
    metadata: z.object({
      formFields: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'tel', 'date', 'textarea', 'select']),
        value: z.string(),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
        placeholder: z.string().optional(),
      })).optional(),
      required: z.boolean().optional(),
      instructions: z.string().optional(),
    }).optional(),
  })),
});

export const ReviewOutputSchema = z.object({
  complianceCheck: z.array(z.string()),
  submissionPackage: z.object({
    emailTemplate: z.string(),
    attachments: z.array(z.string()),
    submissionChecklist: z.array(z.string()),
  }),
  finalScore: z.number(),
  // New: Final response with any adjustments
  finalResponseBlocks: z.array(z.object({
    id: z.string(),
    type: z.enum(['H1', 'H2', 'H3', 'Text', 'Form']),
    title: z.string(),
    content: z.string(),
    order: z.number(),
    editable: z.boolean(),
    metadata: z.object({
      formFields: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'tel', 'date', 'textarea', 'select']),
        value: z.string(),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
        placeholder: z.string().optional(),
      })).optional(),
      required: z.boolean().optional(),
      instructions: z.string().optional(),
    }).optional(),
  })),
});

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
    analysis: AnalysisOutput;
    strategy: StrategyOutput;
    proposal: ProposalOutput;
    review: ReviewOutput;
  };
  submissionReady: boolean;
  confidenceScore: number;
}

// Agent states (unchanged)
export type AgentState = 'pending' | 'working' | 'completed' | 'error';

export interface AgentProgress {
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
  reviewer: {
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

// Utility functions for block management
export const createBlock = (
  type: BlockType,
  title: string,
  content: string,
  order: number,
  editable: boolean = true,
  metadata?: ResponseBlock['metadata']
): ResponseBlock => ({
  id: crypto.randomUUID(),
  type,
  title,
  content,
  order,
  editable,
  metadata,
});

export const createFormBlock = (
  title: string,
  fields: FormField[],
  order: number,
  instructions?: string
): ResponseBlock => ({
  id: crypto.randomUUID(),
  type: 'Form',
  title,
  content: `Form with ${fields.length} fields`,
  order,
  editable: true,
  metadata: {
    formFields: fields,
    required: true,
    instructions,
  },
}); 