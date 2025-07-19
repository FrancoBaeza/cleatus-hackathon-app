import { z } from 'zod';

// Agent Output Schemas
export const AnalysisOutputSchema = z.object({
  requirements: z.array(z.string()),
  gaps: z.array(z.string()),
  riskFactors: z.array(z.string()),
  opportunities: z.array(z.string()),
  complianceItems: z.array(z.string()),
});

export const StrategyOutputSchema = z.object({
  positioning: z.string(),
  gapMitigation: z.string(),
  valuePropositions: z.array(z.string()),
  winProbability: z.number(),
  pricingStrategy: z.string(),
});

export const ProposalOutputSchema = z.object({
  companyInfo: z.string(),
  technicalResponse: z.string(),
  narrative: z.string(),
  pricingDetails: z.string(),
  submissionForms: z.array(z.object({
    formName: z.string(),
    formContent: z.string(),
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
});

// Inferred types
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type StrategyOutput = z.infer<typeof StrategyOutputSchema>;
export type ProposalOutput = z.infer<typeof ProposalOutputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// Agent states
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

// Data types
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