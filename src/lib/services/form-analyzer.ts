'use server';

/**
 * FORM ANALYZER SERVICE
 * 
 * PURPOSE:
 * This service uses OpenAI's vision and document analysis capabilities to
 * extract form fields and requirements from contract documents. It identifies
 * what information needs to be filled out by contractors.
 * 
 * RESPONSIBILITIES:
 * 1. Analyze PDF documents to identify forms and fillable fields
 * 2. Extract field names, types, requirements, and descriptions
 * 3. Categorize fields by importance and requirements
 * 4. Provide structured output for form mapping
 * 5. Handle various document formats and layouts
 * 
 * AI APPROACH:
 * - Uses GPT-4V for document analysis when available
 * - Falls back to text extraction and pattern matching
 * - Leverages contract knowledge to identify common form patterns
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const MODEL = "gpt-4.1";

// Schema for extracted form fields
const FormFieldExtractionSchema = z.object({
    fieldName: z.string().describe('The name or label of the form field'),
    fieldType: z.enum(['text', 'email', 'tel', 'date', 'textarea', 'select', 'checkbox', 'number']).describe('The type of input field'),
    isRequired: z.boolean().describe('Whether this field is mandatory'),
    description: z.string().optional().describe('Additional context or instructions for the field'),
    placeholder: z.string().optional().describe('Example or placeholder text'),
    options: z.array(z.string()).optional().describe('Available options for select/checkbox fields'),
    validation: z.string().optional().describe('Validation rules or format requirements'),
});

const DocumentFormAnalysisSchema = z.object({
    documentId: z.string(),
    documentName: z.string(),
    analysisSuccess: z.boolean(),
    formSections: z.array(z.object({
        sectionTitle: z.string().describe('Title or heading of the form section'),
        sectionDescription: z.string().optional().describe('Description of what this section covers'),
        fields: z.array(FormFieldExtractionSchema),
    })),
    extractedFields: z.array(FormFieldExtractionSchema),
    formType: z.string().describe('Type of form (e.g., "Financial Information", "Company Details", "Certification")'),
    instructions: z.string().describe('General instructions for filling out the form'),
    submissionRequirements: z.array(z.string()).describe('Special requirements for form submission'),
});

export type FormFieldExtraction = z.infer<typeof FormFieldExtractionSchema>;
export type DocumentFormAnalysis = z.infer<typeof DocumentFormAnalysisSchema>;

interface DocumentContent {
    id: string;
    name: string;
    content: string;
    type: string;
}

/**
 * Analyzes a document to extract form fields and requirements
 */
export async function analyzeDocumentForForms(document: DocumentContent): Promise<DocumentFormAnalysis> {
    try {
        console.log(`🔍 Analyzing document for forms: ${document.name}`);
        
        // Determine analysis approach based on document type
        if (document.type === 'pdf' && document.content) {
            return await analyzePDFWithAI(document);
        } else if (document.type === 'text') {
            return await analyzeTextDocument(document);
        } else {
            throw new Error(`Unsupported document type: ${document.type}`);
        }
        
    } catch (error) {
        console.error(`❌ Error analyzing document ${document.name}:`, error);
        return {
            documentId: document.id,
            documentName: document.name,
            analysisSuccess: false,
            formSections: [],
            extractedFields: [],
            formType: 'Unknown',
            instructions: '',
            submissionRequirements: [],
        };
    }
}

/**
 * Analyzes PDF documents using OpenAI's document analysis
 */
async function analyzePDFWithAI(document: DocumentContent): Promise<DocumentFormAnalysis> {
    const prompt = `You are analyzing a government contract document to extract form fields that contractors need to fill out. This document may contain forms, questionnaires, or templates requiring contractor information.

Document Name: ${document.name}
Document Type: PDF

IMPORTANT INSTRUCTIONS:
1. Identify ALL form fields, input areas, and information requirements
2. Pay special attention to:
   - Company/business information fields
   - Financial information requirements
   - Contact details and addresses
   - Certification and compliance fields
   - Experience and capability questions
   - Signature and date fields

3. For each field, determine:
   - Field name/label as it appears in the document
   - What type of input is expected (text, email, phone, date, etc.)
   - Whether the field is required or optional
   - Any specific formatting or validation requirements

4. Extract form sections and organize fields logically
5. Identify submission instructions and requirements

The goal is to create a comprehensive mapping of what information a contractor needs to provide.

Please analyze this PDF document (base64 encoded) and extract all form fields and requirements:

${document.content.substring(0, 50000)} ${document.content.length > 50000 ? '... [truncated]' : ''}`;

    const result = await generateObject({
        model: openai(MODEL),
        prompt,
        schema: DocumentFormAnalysisSchema,
    });

    return result.object;
}

/**
 * Analyzes text-based documents for form requirements
 */
async function analyzeTextDocument(document: DocumentContent): Promise<DocumentFormAnalysis> {
    const prompt = `You are analyzing a government contract document to extract form fields and information requirements for contractors.

Document Name: ${document.name}
Document Content:
${document.content}

ANALYSIS INSTRUCTIONS:
1. Look for form templates, questionnaires, or required information sections
2. Identify fields where contractors need to provide information
3. Extract field names, types, and requirements
4. Determine if fields are mandatory or optional
5. Note any special instructions or formatting requirements

Focus on finding contractor information requirements such as:
- Business/company details
- Financial information
- Contact information
- Certifications and registrations
- Experience and capabilities
- Compliance attestations

Please provide a structured analysis of all form fields and requirements found in this document.`;

    const result = await generateObject({
        model: openai(MODEL),
        prompt,
        schema: DocumentFormAnalysisSchema,
    });

    return result.object;
}

/**
 * Batch analyze multiple documents for forms
 */
export async function analyzeDocumentsForForms(documents: DocumentContent[]): Promise<DocumentFormAnalysis[]> {
    const results: DocumentFormAnalysis[] = [];
    
    console.log(`📋 Analyzing ${documents.length} documents for form fields...`);
    
    // Process documents sequentially to avoid API rate limits
    for (const document of documents) {
        try {
            const analysis = await analyzeDocumentForForms(document);
            results.push(analysis);
            
            console.log(`✅ Analyzed ${document.name}: ${analysis.extractedFields.length} fields found`);
        } catch (error) {
            console.error(`❌ Failed to analyze ${document.name}:`, error);
            results.push({
                documentId: document.id,
                documentName: document.name,
                analysisSuccess: false,
                formSections: [],
                extractedFields: [],
                formType: 'Analysis Failed',
                instructions: '',
                submissionRequirements: [],
            });
        }
    }
    
    const successCount = results.filter(r => r.analysisSuccess).length;
    const totalFields = results.reduce((sum, r) => sum + r.extractedFields.length, 0);
    
    console.log(`📊 Form Analysis Complete: ${successCount}/${documents.length} documents analyzed, ${totalFields} total fields extracted`);
    
    return results;
}



 