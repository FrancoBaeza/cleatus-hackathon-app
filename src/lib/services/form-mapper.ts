'use server';

/**
 * FORM MAPPER SERVICE
 * 
 * PURPOSE:
 * This service intelligently maps entity/company information to form fields
 * extracted from contract documents. It uses AI to understand field requirements
 * and match them with available company data, pre-filling forms automatically.
 * 
 * RESPONSIBILITIES:
 * 1. Map entity data to form fields using intelligent matching
 * 2. Generate confidence scores for each mapping
 * 3. Identify fields that need human review
 * 4. Handle various data formats and field types
 * 5. Provide fallback values and suggestions
 * 
 * MAPPING STRATEGY:
 * - Use AI to understand field semantics and requirements
 * - Match entity properties to form fields intelligently
 * - Handle common government form patterns
 * - Provide confidence scoring for validation
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { DocumentFormAnalysis, FormFieldExtraction } from './form-analyzer';

const MODEL = "gpt-4.1";

export interface EntityData {
    businessName: string;
    website?: string;
    incorporatedAddress?: string;
    physicalAddress?: string;
    cageCode?: string;
    ueiCode?: string;
    annualRevenue?: string;
    entityStartDate?: string;
    registrationDate?: string;
    naicsCodes?: Array<{ code: string; name: string; }>;
    mainNaics?: { code: string; name: string; };
    certifications?: string;
    dealMakers?: string;
    dealBreakers?: string;
    [key: string]: any;
}

export interface PreFilledField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select';
    value: string;
    required: boolean;
    mappingSource: string;
    confidenceScore: number;
    needsReview: boolean;
    options?: string[];
}

export interface PreFilledForm {
    id: string;
    documentId: string;
    documentName: string;
    formTitle: string;
    fields: PreFilledField[];
    completionPercentage: number;
    reviewNotes: string;
}

// Schema for AI-driven field mapping
const FieldMappingSchema = z.object({
    mappings: z.array(z.object({
        fieldId: z.string(),
        fieldName: z.string(),
        mappedValue: z.string().describe('The value to fill in this field'),
        mappingSource: z.string().describe('Which entity property this value came from'),
        confidenceScore: z.number().min(0).max(100).describe('Confidence in this mapping (0-100)'),
        needsReview: z.boolean().describe('Whether this mapping needs human review'),
        reasoning: z.string().describe('Why this mapping was chosen'),
    })),
    overallCompletionRate: z.number().min(0).max(100),
    reviewNotes: z.string().describe('General notes about the form filling process'),
    unmappedFields: z.array(z.object({
        fieldName: z.string(),
        reason: z.string().describe('Why this field could not be mapped'),
        suggestion: z.string().describe('Suggestion for manual completion'),
    })),
});

/**
 * Maps entity data to form fields using AI intelligence
 */
export async function mapEntityToFormFields(
    entityData: EntityData,
    formAnalysis: DocumentFormAnalysis
): Promise<PreFilledForm> {
    try {
        console.log(`🎯 Mapping entity data to form: ${formAnalysis.formType}`);
        
        const mappingResult = await performAIMapping(entityData, formAnalysis);
        
        // Convert AI mapping results to PreFilledForm format
        const preFilledFields: PreFilledField[] = formAnalysis.extractedFields.map((field, index) => {
            const mapping = mappingResult.mappings.find(m => m.fieldName === field.fieldName);
            
            if (mapping) {
                return {
                    id: `field_${index}`,
                    label: field.fieldName,
                    type: mapFieldType(field.fieldType),
                    value: mapping.mappedValue,
                    required: field.isRequired,
                    mappingSource: mapping.mappingSource,
                    confidenceScore: mapping.confidenceScore,
                    needsReview: mapping.needsReview,
                    options: field.options,
                };
            } else {
                // Field couldn't be mapped
                return {
                    id: `field_${index}`,
                    label: field.fieldName,
                    type: mapFieldType(field.fieldType),
                    value: '',
                    required: field.isRequired,
                    mappingSource: 'unmapped',
                    confidenceScore: 0,
                    needsReview: true,
                    options: field.options,
                };
            }
        });
        
        const completedFields = preFilledFields.filter(f => f.value && f.value.trim().length > 0);
        const completionPercentage = Math.round((completedFields.length / preFilledFields.length) * 100);
        
        return {
            id: `prefilled_${formAnalysis.documentId}`,
            documentId: formAnalysis.documentId,
            documentName: formAnalysis.documentName,
            formTitle: formAnalysis.formType,
            fields: preFilledFields,
            completionPercentage,
            reviewNotes: mappingResult.reviewNotes,
        };
        
    } catch (error) {
        console.error(`❌ Error mapping entity to form ${formAnalysis.formType}:`, error);
        
        // Return empty form on error
        return {
            id: `prefilled_${formAnalysis.documentId}`,
            documentId: formAnalysis.documentId,
            documentName: formAnalysis.documentName,
            formTitle: formAnalysis.formType,
            fields: formAnalysis.extractedFields.map((field, index) => ({
                id: `field_${index}`,
                label: field.fieldName,
                type: mapFieldType(field.fieldType),
                value: '',
                required: field.isRequired,
                mappingSource: 'error',
                confidenceScore: 0,
                needsReview: true,
                options: field.options,
            })),
            completionPercentage: 0,
            reviewNotes: `Error occurred during mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Uses AI to intelligently map entity data to form fields
 */
async function performAIMapping(entityData: EntityData, formAnalysis: DocumentFormAnalysis) {
    const prompt = `You are an expert at filling out government contract forms. Your task is to map entity/company information to form fields intelligently.

ENTITY INFORMATION:
${JSON.stringify(entityData, null, 2)}

FORM TO FILL OUT:
Form Type: ${formAnalysis.formType}
Form Instructions: ${formAnalysis.instructions}

FORM FIELDS TO MAP:
${formAnalysis.extractedFields.map((field, i) => `
${i + 1}. Field: "${field.fieldName}"
   Type: ${field.fieldType}
   Required: ${field.isRequired}
   Description: ${field.description || 'N/A'}
   Placeholder: ${field.placeholder || 'N/A'}
`).join('')}

MAPPING INSTRUCTIONS:
1. For each form field, determine the best matching value from the entity data
2. Consider field semantics, not just exact name matches
3. Handle common variations (e.g., "Business Name" = businessName, "Company Name" = businessName)
4. For dates, format them appropriately (MM/DD/YYYY for US forms)
5. For addresses, use the most appropriate address type
6. For financial fields, use available revenue data or indicate if not available
7. For NAICS codes, use the primary NAICS when relevant
8. For certification fields, extract relevant certifications

CONFIDENCE SCORING:
- 90-100: Exact match, high confidence
- 70-89: Good semantic match, probable accuracy
- 50-69: Reasonable match, should review
- 30-49: Uncertain match, definitely review
- 0-29: Poor match or no data available

Mark fields for review if:
- Confidence < 70
- Field requires specific formatting not available
- Field asks for information not in entity data
- Field requires calculation or derivation

Please map the entity data to form fields with confidence scores and review flags.`;

    const result = await generateObject({
        model: openai(MODEL),
        prompt,
        schema: FieldMappingSchema,
    });

    return result.object;
}

/**
 * Maps form field types to our standard types
 */
function mapFieldType(fieldType: string): 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select' {
    switch (fieldType) {
        case 'email': return 'email';
        case 'tel':
        case 'phone': return 'tel';
        case 'date': return 'date';
        case 'textarea': return 'textarea';
        case 'select': return 'select';
        case 'checkbox':
        case 'number':
        case 'text':
        default: return 'text';
    }
}

/**
 * Batch map entity data to multiple forms
 */
export async function mapEntityToMultipleForms(
    entityData: EntityData,
    formAnalyses: DocumentFormAnalysis[]
): Promise<PreFilledForm[]> {
    const results: PreFilledForm[] = [];
    
    console.log(`📋 Mapping entity data to ${formAnalyses.length} forms...`);
    
    // Process forms sequentially to avoid API rate limits
    for (const formAnalysis of formAnalyses) {
        if (formAnalysis.analysisSuccess && formAnalysis.extractedFields.length > 0) {
            try {
                const preFilledForm = await mapEntityToFormFields(entityData, formAnalysis);
                results.push(preFilledForm);
                
                console.log(`✅ Mapped ${formAnalysis.formType}: ${preFilledForm.completionPercentage}% complete`);
            } catch (error) {
                console.error(`❌ Failed to map ${formAnalysis.formType}:`, error);
            }
        } else {
            console.log(`⏭️ Skipping ${formAnalysis.formType}: no extractable fields`);
        }
    }
    
    const avgCompletion = results.length > 0 
        ? Math.round(results.reduce((sum, form) => sum + form.completionPercentage, 0) / results.length)
        : 0;
    
    console.log(`🎯 Form Mapping Complete: ${results.length} forms processed, ${avgCompletion}% average completion`);
    
    return results;
}



 