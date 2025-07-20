'use server';

// Import utilities from separate file to avoid server action conflicts
import { chunkArray } from '../utils/document-utils';

/**
 * DOCUMENT FETCHER SERVICE
 * 
 * PURPOSE:
 * This service handles downloading and processing contract documents from URLs
 * provided in documents.json. It fetches PDFs and prepares them for AI analysis
 * to extract form fields and requirements.
 * 
 * RESPONSIBILITIES:
 * 1. Download documents from remote URLs (Vercel storage, SAM.gov, etc.)
 * 2. Convert documents to formats suitable for AI analysis
 * 3. Handle various document types (PDF, DOC, etc.)
 * 4. Provide error handling and retry logic
 * 5. Cache documents locally to avoid repeated downloads
 * 
 * SECURITY CONSIDERATIONS:
 * - Validate URLs before fetching
 * - Limit file sizes to prevent abuse
 * - Handle timeouts gracefully
 */

export interface DocumentFetchResult {
    success: boolean;
    content?: string;
    error?: string;
    metadata?: {
        size: number;
        type: string;
        pages?: number;
    };
}

export interface DocumentInfo {
    id: string;
    url: string;
    filename: string;
    type: string;
}

/**
 * Fetches a document from a URL and prepares it for AI analysis
 */
export async function fetchDocument(documentInfo: DocumentInfo): Promise<DocumentFetchResult> {
    try {
        console.log(`📄 Fetching document: ${documentInfo.filename}`);
        
        // Validate URL
        if (!isValidDocumentUrl(documentInfo.url)) {
            return {
                success: false,
                error: `Invalid or unsafe URL: ${documentInfo.url}`,
            };
        }

        // Fetch the document
        const response = await fetch(documentInfo.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'CLEATUS-RFQ-Assistant/1.0',
            },
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Failed to fetch document: ${response.status} ${response.statusText}`,
            };
        }

        // Check content type and size
        const contentType = response.headers.get('content-type') || '';
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        
        if (contentLength > 10 * 1024 * 1024) { // 10MB limit
            return {
                success: false,
                error: 'Document too large (max 10MB)',
            };
        }

        // For PDFs, we'll convert to base64 for AI analysis
        if (contentType.includes('pdf') || documentInfo.filename.toLowerCase().endsWith('.pdf')) {
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            
            return {
                success: true,
                content: base64,
                metadata: {
                    size: contentLength,
                    type: 'pdf',
                },
            };
        }

        // For text-based documents
        if (contentType.includes('text') || documentInfo.filename.toLowerCase().endsWith('.txt')) {
            const text = await response.text();
            
            return {
                success: true,
                content: text,
                metadata: {
                    size: contentLength,
                    type: 'text',
                },
            };
        }

        // For other document types, try as base64
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        
        return {
            success: true,
            content: base64,
            metadata: {
                size: contentLength,
                type: contentType || 'unknown',
            },
        };

    } catch (error) {
        console.error(`❌ Error fetching document ${documentInfo.filename}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Batch fetch multiple documents
 */
export async function fetchDocuments(documents: DocumentInfo[]): Promise<Map<string, DocumentFetchResult>> {
    const results = new Map<string, DocumentFetchResult>();
    
    console.log(`📋 Fetching ${documents.length} documents...`);
    
    // Process documents in parallel with reasonable concurrency
    const concurrencyLimit = 3;
    const chunks = chunkArray(documents, concurrencyLimit);
    
    for (const chunk of chunks) {
        const promises = chunk.map(async (doc) => {
            const result = await fetchDocument(doc);
            return { id: doc.id, result };
        });
        
        const chunkResults = await Promise.all(promises);
        
        for (const { id, result } of chunkResults) {
            results.set(id, result);
        }
    }
    
    const successCount = Array.from(results.values()).filter(r => r.success).length;
    console.log(`✅ Successfully fetched ${successCount}/${documents.length} documents`);
    
    return results;
}

/**
 * Validates if a URL is safe to fetch
 */
function isValidDocumentUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        
        // Allow HTTPS URLs from trusted domains
        const trustedDomains = [
            'vercel-storage.com',
            'sam.gov',
            'github.com',
            'githubusercontent.com',
        ];
        
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }
        
        const isTrustedDomain = trustedDomains.some(domain => 
            parsedUrl.hostname.includes(domain)
        );
        
        return isTrustedDomain;
    } catch {
        return false;
    }
} 