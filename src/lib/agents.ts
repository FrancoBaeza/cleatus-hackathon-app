/**
 * AGENTS MODULE - MAIN ENTRY POINT
 * 
 * This file provides backwards compatibility and serves as the main entry point
 * for the multi-agent RFQ response system. All agents have been modularized
 * into separate files for better organization and maintainability.
 * 
 * ARCHITECTURE:
 * - Data Analyzer: Processes raw JSON data into structured insights
 * - Strategic Analyzer: Identifies gaps, risks, and opportunities
 * - Strategist: Develops comprehensive bid strategy and positioning
 * - Writer: Generates detailed, professional RFQ response blocks
 * - Orchestrator: Coordinates sequential agent execution
 */

// Re-export everything from the agents module
export * from './agents/index';
