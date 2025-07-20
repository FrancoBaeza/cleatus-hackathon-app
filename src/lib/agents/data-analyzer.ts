'use server';

/**
 * ENHANCED DATA ANALYZER AGENT - WITH DOCUMENT PROCESSING
 * 
 * PURPOSE:
 * This agent serves as the foundation of our contract-agnostic RFQ response system.
 * It processes raw JSON data AND real contract documents, extracting structured
 * information and auto-filling forms using AI.
 * 
 * NEW CAPABILITIES:
 * 1. Downloads and analyzes real contract documents from URLs
 * 2. Extracts form fields from PDFs and documents
 * 3. Automatically maps entity data to form fields
 * 4. Pre-fills forms with high confidence scoring
 * 5. Provides comprehensive document analysis
 * 
 * RESPONSIBILITIES:
 * 1. Process raw contract JSON data to extract procurement type, scope, requirements
 * 2. Analyze entity JSON data to identify capabilities and business classification
 * 3. Download and analyze real contract documents for forms
 * 4. Extract form fields and requirements from documents
 * 5. Map entity information to form fields intelligently
 * 6. Pre-fill forms with confidence scoring and review flags
 * 7. Perform gap analysis between contract requirements and entity capabilities
 * 8. Assess opportunity potential and estimate win probability
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { DataAnalysisOutputSchema, type DataAnalysisOutput } from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';
import { 
    fetchDocuments,
    type DocumentFetchResult,
    type DocumentInfo 
} from '../services/document-fetcher';
import { 
    analyzeDocumentsForForms,
    type DocumentFormAnalysis 
} from '../services/form-analyzer';
import { 
    mapEntityToMultipleForms,
    type PreFilledForm 
} from '../services/form-mapper';
import { 
    extractDocumentInfo,
    filterFormDocuments,
    getFormMappingStats
} from '../utils/document-utils';

const MODEL = "gpt-4.1";

export async function runDataAnalyzerAgent(contractJson: any, entityJson: any, documentsJson: any): Promise<DataAnalysisOutput> {
    const startTime = Date.now();
    console.log('🚀 Enhanced Data Analyzer: Starting comprehensive analysis...');

    try {
        // PHASE 1: Analyze raw JSON data (base analysis)
        console.log('📊 Phase 1: Analyzing raw contract and entity data...');
        const baseAnalysis = await analyzeRawContractData(contractJson, entityJson);
        
        // PHASE 2: Process real documents for forms (enhanced analysis)
        console.log('📄 Phase 2: Processing real contract documents...');
        const { documentAnalysis, preFilledForms } = await processContractDocuments(documentsJson, entityJson);
        
        // PHASE 3: Combine all analysis results
        console.log('🔄 Phase 3: Combining analysis results...');
        const enhancedAnalysis: DataAnalysisOutput = {
            ...baseAnalysis,
            documentAnalysis,
            preFilledForms,
        };
        
        const mappingStats = getFormMappingStats(preFilledForms);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Enhanced Data Analyzer Complete (${duration}ms):`);
        console.log(`   📋 Documents processed: ${documentAnalysis.documentsProcessed.length}`);
        console.log(`   📝 Forms pre-filled: ${preFilledForms.length}`);
        console.log(`   📊 Average completion: ${mappingStats.mappingRate}%`);
        
        return enhancedAnalysis;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in enhanced data analysis';
        console.error('❌ Enhanced Data Analyzer failed:', errorMessage);
        throw error;
    }
}

/**
 * PHASE 1: Analyzes raw contract and entity JSON data
 */
async function analyzeRawContractData(contractJson: any, entityJson: any) {
    const prompt = `You are analyzing raw contract and entity data to extract structured information for RFQ response generation. Process the data thoroughly and extract key insights.

RAW CONTRACT DATA:
${JSON.stringify(contractJson, null, 2)}

RAW ENTITY DATA:
${JSON.stringify(entityJson, null, 2)}

EXTRACT AND STRUCTURE THE FOLLOWING:

1. CONTRACT INFORMATION:
   - Type of procurement (construction, services, manufacturing, etc.)
   - Scope and key requirements
   - Deliverables and timeline
   - Performance locations
   - Set-aside type (SDVOSB, Small Business, etc.)
   - Special requirements and certifications

2. ENTITY ASSESSMENT:
   - Primary business capability
   - Relevant experience for this contract
   - Competitive advantages
   - Business classification and size

3. GAP ANALYSIS:
   - NAICS code alignment between required and entity
   - Capability gaps
   - Compliance or certification gaps
   - Risk factors

4. OPPORTUNITY ASSESSMENT:
   - Win factors and competitive positioning
   - Value proposition for this opportunity
   - Estimated win probability (realistic assessment)

5. COMPLIANCE REQUIREMENTS:
   - Required forms for submission (identify from contract data)
   - Certifications needed
   - Submission method and deadlines

Be thorough and specific. Extract actual values from the data, don't make assumptions.`;

    const result = await generateObject({
        model: openai(MODEL),
        prompt,
        schema: DataAnalysisOutputSchema.omit({ documentAnalysis: true, preFilledForms: true }),
    });

    return result.object;
}

/**
 * PHASE 2: Processes real contract documents for forms and requirements
 */
async function processContractDocuments(documentsJson: any, entityJson: any) {
    try {
        console.log("DOCUMENTS JSON", documentsJson);
        // Extract document information from contract data
        const documentsData = documentsJson || [];
        if (!Array.isArray(documentsData) || documentsData.length === 0) {
            console.log('⚠️ No documents found in contract data, skipping document analysis');
            return {
                documentAnalysis: {
                    documentsProcessed: [],
                    formMappingResults: [],
                },
                preFilledForms: [],
            };
        }

        // Filter to only documents likely to contain forms
        const formDocuments = filterFormDocuments(documentsData);
        console.log(`📋 Found ${formDocuments.length} potential form documents out of ${documentsData.length} total`);

        if (formDocuments.length === 0) {
            console.log('⚠️ No form documents identified, skipping form analysis');
            return {
                documentAnalysis: {
                    documentsProcessed: [],
                    formMappingResults: [],
                },
                preFilledForms: [],
            };
        }

        // Extract document info for downloading
        const documentInfos = extractDocumentInfo(formDocuments);
        
        // STEP 1: Download documents
        console.log(`📥 Downloading ${documentInfos.length} form documents...`);
        const fetchResults = await fetchDocuments(documentInfos);
        
        // STEP 2: Analyze documents for form fields
        console.log(`🔍 Analyzing documents for form fields...`);
        const documentsForAnalysis = Array.from(fetchResults.entries())
            .filter(([_, result]) => result.success && result.content)
            .map(([id, result]) => {
                const docInfo = documentInfos.find(d => d.id === id)!;
                return {
                    id,
                    name: docInfo.filename,
                    content: result.content!,
                    type: result.metadata?.type || 'unknown',
                };
            });

        const formAnalyses = await analyzeDocumentsForForms(documentsForAnalysis);
        
        // STEP 3: Map entity data to form fields
        console.log(`🎯 Mapping entity data to form fields...`);
        const successfulAnalyses = formAnalyses.filter(analysis => analysis.analysisSuccess);
        const preFilledForms = await mapEntityToMultipleForms(entityJson, successfulAnalyses);
        
        // STEP 4: Prepare document analysis summary
        const documentAnalysis = {
            documentsProcessed: Array.from(fetchResults.entries()).map(([id, result]) => {
                const docInfo = documentInfos.find(d => d.id === id)!;
                const analysis = formAnalyses.find(a => a.documentId === id);
                
                return {
                    id,
                    name: docInfo.filename,
                    type: docInfo.type,
                    url: docInfo.url,
                    analysisSuccess: result.success,
                    extractedFields: analysis?.extractedFields || [],
                };
            }),
            formMappingResults: preFilledForms.map(form => ({
                documentId: form.documentId,
                documentName: form.documentName,
                mappingSuccess: form.completionPercentage > 0,
                totalFields: form.fields.length,
                mappedFields: form.fields.filter(f => f.value && f.mappingSource !== 'unmapped').length,
                unmappedFields: form.fields
                    .filter(f => !f.value || f.mappingSource === 'unmapped')
                    .map(f => f.label),
            })),
        };

        return { documentAnalysis, preFilledForms };

    } catch (error) {
        console.error('❌ Error processing contract documents:', error);
        return {
            documentAnalysis: {
                documentsProcessed: [],
                formMappingResults: [],
            },
            preFilledForms: [],
        };
    }
} 