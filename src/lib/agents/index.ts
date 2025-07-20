/**
 * AGENTS MODULE INDEX
 * 
 * This file provides clean exports for all AI agents and the orchestrator,
 * making it easy to import the multi-agent system components.
 */

// Individual Agents
export { runDataAnalyzerAgent } from './data-analyzer';
export { runAnalyzerAgent } from './analyzer';
export { runStrategistAgent } from './strategist';
export { runWriterAgent } from './writer';

// Main Orchestrator
export { generateProposalResponse } from './orchestrator';

// Re-export types for convenience
export type {
    DataAnalysisOutput,
    AnalysisOutput,
    StrategyOutput,
    ProposalOutput,
    GeneratedRFQResponse,
} from '../types'; 