/**
 * DOCUMENT UTILITIES (SIMPLIFIED)
 * 
 * PURPOSE:
 * Helper functions for document processing that don't require server actions.
 * Simplified version without form mapping functionality.
 */

import type { DocumentInfo } from '../services/document-fetcher';

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
 * Utility function to chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
} 