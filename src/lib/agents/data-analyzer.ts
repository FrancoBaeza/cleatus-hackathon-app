'use server';

/**
 * ENHANCED DATA ANALYZER AGENT - COMPREHENSIVE DOCUMENT PROCESSING
 *
 * PURPOSE:
 * This agent serves as the foundation of our contract-agnostic RFQ response system.
 * It processes raw JSON data AND real contract documents, extracting structured
 * information and identifying ALL mandatory requirements for response generation.
 *
 * CRITICAL CAPABILITIES:
 * 1. Downloads and analyzes ALL real contract documents from URLs
 * 2. Extracts mandatory requirements and form fields from each document
 * 3. Identifies submission requirements and critical deadlines
 * 4. Maps entity data to contract requirements
 * 5. Provides comprehensive, unified analysis for all downstream agents
 *
 * RESPONSIBILITIES:
 * 1. Process raw contract JSON data to extract procurement type, scope, requirements
 * 2. Analyze entity JSON data to identify capabilities and business classification
 * 3. Download and analyze ALL real contract documents for complete context
 * 4. Extract mandatory requirements and form fields from each document
 * 5. Map entity information to contract requirements intelligently
 * 6. Perform comprehensive gap analysis between contract requirements and entity capabilities
 * 7. Assess opportunity potential and estimate win probability
 * 8. Identify ALL mandatory submission requirements for other agents
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { DataAnalysisOutputSchema, type DataAnalysisOutput } from '../types';
import { AgentLogger } from '../logger';
import { detailedLogger } from '../agent-logger';
import {
    fetchDocuments,
    type DocumentFetchResult,
    type DocumentInfo,
} from '../services/document-fetcher';

const MODEL = 'gpt-4.1';

export async function runDataAnalyzerAgent(
    contractJson: any,
    entityJson: any,
    documentsJson: any,
): Promise<DataAnalysisOutput> {
    const startTime = AgentLogger.logAgentStart(
        'data-analyzer',
        'Data Analyzer',
    );
    const { executionId, startTime: detailedStartTime } = detailedLogger.logAgentStart('data-analyzer');

    console.log(
        '🚀 Enhanced Data Analyzer: Starting comprehensive analysis...',
    );

    try {
        //Unified analysis
        const analisis = await analyzeContractData(
            contractJson,
            entityJson,
            documentsJson,
        );

        detailedLogger.logAgentSuccess(
            'data-analyzer',
            executionId,
            detailedStartTime,
            analisis,
            {
                modelUsed: MODEL,
            },
        );

        return analisis;
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Unknown error in enhanced data analysis';
        console.error('❌ Enhanced Data Analyzer failed:', errorMessage);
        throw error;
    }
}

/**
 * This function will analyze with AI all the information we have been provided.
 * @param contractJson
 * @param entityJson
 * @param documentsJson
 */
async function analyzeContractData(
    contractJson: any,
    entityJson: any,
    documentsJson: any,
): Promise<DataAnalysisOutput> {
    console.log('📄 Fetching and analyzing document content...');

    // Fetch all document content from markdown URLs
    const documentContents = await fetchAllDocumentContents(documentsJson);

    const prompt = `You are an expert government contract analyst specializing in RFQ response generation. 
    
    You will analyze a complete set of data including:
    1. Contract information (JSON data)
    2. Entity/company information (JSON data) 
    3. Real document content (extracted from actual contract documents)

    Your task is to provide a comprehensive analysis that will be used by downstream AI agents to generate a complete RFQ response.

    IMPORTANT: You must extract all the information from the documents and the data, and fill the form fields with the information you have extracted.

    CONTRACT DATA:
    ${JSON.stringify(contractJson, null, 2)}

    ENTITY DATA:
    ${JSON.stringify(entityJson, null, 2)}

    DOCUMENT CONTENTS:
    ${documentContents
        .map(
            (doc, index) => `
    DOCUMENT ${index + 1}: ${doc.name}
    Type: ${doc.type}
    Content:
    ${doc.content}
    ---`,
        )
        .join('\n')}

    ANALYZE ALL THIS INFORMATION AND PROVIDE:

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

    5. COMPLIANCE REQUIREMENTS (!!! MOST IMPORTANT IT MUST BE COMPLETE AND CORRECT):
   - ALL required forms for submission (extract from documents)
   - For each form, include:
     * name: Form name/title
     * description: What the form is for
     * criticality: 'Required', 'Optional', or 'Conditional'
     * formFields: Array of form fields with name, type, required, and value
   - ALL certifications and registrations needed
   - Submission method and ALL deadlines
   - Key compliance items from documents
   - COMPLETE CONTACT INFORMATION for automated submission:
     * Primary contact: name, title, email, phone, fax
     * Secondary contact: name, title, email, phone, fax (if available)
     * All submission email addresses
     * Specific submission instructions
     * Contracting office address (street, city, state, zip, country)

    6. TECHNICAL REQUIREMENTS:
    - ALL technical specifications from contract and documents
    - ALL quality standards and testing requirements
    - ALL delivery and installation requirements
    - ALL warranty and support requirements
    - Any special technical considerations

    7. PRICING AND TERMS:
    - ALL payment terms and conditions
    - ALL delivery timeline requirements
    - ALL warranty requirements
    - ALL financial or bonding requirements

    8. DOCUMENT ANALYSIS:
    - Summary of ALL documents processed
    - Key findings from each document
    - Mandatory requirements extracted from documents
    - Form fields and submission requirements

    CRITICAL REQUIREMENTS:
    - Extract ALL mandatory requirements from the actual document content
    - Identify ALL required forms and their specifications
    - For each form, extract ALL form fields with their properties:
    * name: Field name/label
    * type: Field type (text, email, tel, date, textarea, select)
    * required: Whether the field is mandatory
    * value: Suggested value or placeholder
    - Extract ALL contact information for automated submission:
    * Primary contracting officer: name, title, email, phone, fax
    * Secondary contracting officer: name, title, email, phone, fax
    * ALL email addresses where submissions should be sent
    * Specific submission instructions and methods
    * Complete office address information
    - Note ALL deadlines and submission requirements
    - Include ALL technical specifications and quality standards
    - Ensure NO mandatory elements are missed
    - Provide complete, actionable information for response generation

    FORM STRUCTURE EXAMPLE:
    For each required form, structure it like this:
    {
    "name": "Attachment 2 - Contractor Release of Financial Information",
    "description": "Form for contractor to authorize financial information release",
    "criticality": "Required",
    "formFields": [
        {
        "name": "Contractor Name",
        "type": "text",
        "required": true,
        "value": "GUNN CONSTRUCTION LLC"
        },
        {
        "name": "CAGE Code",
        "type": "text", 
        "required": true,
        "value": "9HET5"
        }
    ]
    }

    CONTACT INFORMATION STRUCTURE EXAMPLE:
    Extract contact information like this:
    {
    "contactInformation": {
        "primaryContact": {
            "name": "Parie D Reynolds",
            "title": "Contract Specialist",
            "email": "parie.reynolds@us.af.mil",
            "phone": "2103178332",
            "fax": ""
        },
        "secondaryContact": {
            "name": "Lance Watters",
            "title": "Contracting Officer",
            "email": "lance.watters.1@us.af.mil",
            "phone": "2106711763",
            "fax": ""
        },
        "submissionEmail": [
            "parie.reynolds@us.af.mil",
            "lance.watters.1@us.af.mil"
        ],
        "submissionInstructions": "Submit via email to both primary and secondary contacts by 4:00 PM CDT on July 21, 2025",
        "officeAddress": {
            "city": "JBSA LACKLAND",
            "state": "TX",
            "zipCode": "78236-5286",
            "country": "USA"
        }
    }
    }

    Be thorough and specific. Extract actual values from the data and documents, don't make assumptions. Focus on information that will be needed for the complete RFQ response generation.`;

    const response = await generateObject({
        model: openai(MODEL),
        schema: DataAnalysisOutputSchema,
        prompt,
    });

    return response.object;
}

/**
 * Fetches content from all document markdown URLs
 */
async function fetchAllDocumentContents(
    documentsJson: any,
): Promise<Array<{ name: string; type: string; content: string }>> {
    const documents = documentsJson || [];
    const contents: Array<{ name: string; type: string; content: string }> = [];

    console.log(`📥 Fetching content from ${documents.length} documents...`);

    for (const doc of documents) {
        try {
            if (doc.markdownUrl) {
                console.log(`📄 Fetching markdown content: ${doc.filename}`);
                const response = await fetch(doc.markdownUrl);

                if (response.ok) {
                    const content = await response.text();

                    // Verify we got actual text content, not binary data
                    if (
                        content.length > 0 &&
                        !content.startsWith('JVBERi') &&
                        !content.includes('%PDF')
                    ) {
                        contents.push({
                            name: doc.filename,
                            type: doc.docType || doc.type || 'unknown',
                            content: content.substring(0, 15000), // Limit content length
                        });
                        console.log(
                            `✅ Successfully fetched: ${doc.filename} (${content.length} chars)`,
                        );
                    } else {
                        console.log(
                            `⚠️ Got binary content for: ${doc.filename}, using summary instead`,
                        );
                        contents.push({
                            name: doc.filename,
                            type: doc.docType || doc.type || 'unknown',
                            content:
                                doc.summary ||
                                `[Document: ${
                                    doc.displayName || doc.filename
                                }]`,
                        });
                    }
                } else {
                    console.log(
                        `❌ Failed to fetch markdown: ${doc.filename} (${response.status})`,
                    );
                    contents.push({
                        name: doc.filename,
                        type: doc.docType || doc.type || 'unknown',
                        content:
                            doc.summary ||
                            `[Document: ${doc.displayName || doc.filename}]`,
                    });
                }
            } else {
                console.log(
                    `⚠️ No markdown URL for: ${doc.filename}, using summary`,
                );
                contents.push({
                    name: doc.filename,
                    type: doc.docType || doc.type || 'unknown',
                    content:
                        doc.summary ||
                        `[Document: ${doc.displayName || doc.filename}]`,
                });
            }
        } catch (error) {
            console.error(`❌ Error fetching ${doc.filename}:`, error);
            contents.push({
                name: doc.filename,
                type: doc.docType || doc.type || 'unknown',
                content:
                    doc.summary ||
                    `[Document: ${doc.displayName || doc.filename}]`,
            });
        }
    }

    console.log(`📋 Successfully processed ${contents.length} documents`);
    return contents;
}
