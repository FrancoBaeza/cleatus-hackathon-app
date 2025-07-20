/**
 * DOCUMENT AND FORM UTILITIES
 * 
 * PURPOSE:
 * Helper functions for document processing and form analysis that don't
 * require server actions. These utilities support the main AI services.
 */

import type { DocumentInfo } from '../services/document-fetcher';
import type { FormFieldExtraction } from '../services/form-analyzer';
import type { PreFilledForm } from '../services/form-mapper';

/**
 * Helper to extract document info from documents.json structure
 */
export function extractDocumentInfo(documentsData: any[]): DocumentInfo[] {
    return documentsData
        .filter(doc => doc.url && doc.filename) // Only process docs with URLs
        .map(doc => ({
            id: doc.id,
            url: doc.url,
            filename: doc.filename,
            type: doc.fileType || 'unknown',
        }));
}

/**
 * Filters documents to only those likely to contain forms
 */
export function filterFormDocuments(documents: any[]): any[] {
    const formKeywords = [
        'form', 'questionnaire', 'application', 'certification', 
        'financial', 'info', 'information', 'statement', 'disclosure',
        'release', 'template', 'worksheet', 'checklist'
    ];
    
    return documents.filter(doc => {
        const filename = doc.filename?.toLowerCase() || '';
        const displayName = doc.displayName?.toLowerCase() || '';
        const summary = doc.summary?.toLowerCase() || '';
        
        return formKeywords.some(keyword => 
            filename.includes(keyword) || 
            displayName.includes(keyword) || 
            summary.includes(keyword)
        );
    });
}

/**
 * Validates and cleans extracted form fields
 */
export function validateFormFields(fields: FormFieldExtraction[]): FormFieldExtraction[] {
    return fields
        .filter(field => field.fieldName && field.fieldName.trim().length > 0)
        .map(field => ({
            ...field,
            fieldName: field.fieldName.trim(),
            description: field.description?.trim() || undefined,
            placeholder: field.placeholder?.trim() || undefined,
        }));
}

/**
 * Validates and cleans mapped form data
 */
export function validateMappedForm(form: PreFilledForm): PreFilledForm {
    return {
        ...form,
        fields: form.fields.map(field => ({
            ...field,
            value: field.value?.trim() || '',
            needsReview: field.needsReview || field.confidenceScore < 70 || field.required && !field.value,
        })),
    };
}

/**
 * Gets summary statistics for form mapping results
 */
export function getFormMappingStats(forms: PreFilledForm[]) {
    const totalFields = forms.reduce((sum, form) => sum + form.fields.length, 0);
    const mappedFields = forms.reduce((sum, form) => 
        sum + form.fields.filter(f => f.value && f.mappingSource !== 'unmapped').length, 0);
    const highConfidenceFields = forms.reduce((sum, form) => 
        sum + form.fields.filter(f => f.confidenceScore >= 70).length, 0);
    const reviewRequiredFields = forms.reduce((sum, form) => 
        sum + form.fields.filter(f => f.needsReview).length, 0);
    
    return {
        totalForms: forms.length,
        totalFields,
        mappedFields,
        mappingRate: totalFields > 0 ? Math.round((mappedFields / totalFields) * 100) : 0,
        highConfidenceFields,
        highConfidenceRate: totalFields > 0 ? Math.round((highConfidenceFields / totalFields) * 100) : 0,
        reviewRequiredFields,
        reviewRate: totalFields > 0 ? Math.round((reviewRequiredFields / totalFields) * 100) : 0,
    };
}

/**
 * Utility function to chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
} 