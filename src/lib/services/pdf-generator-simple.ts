'use client';

import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
    title?: string;
    companyName?: string;
    rfqNumber?: string;
    excludeSubmissionInfo?: boolean;
    excludeForms?: boolean;
}

export interface FormPDFOptions {
    formTitle: string;
    formFields: any[];
    companyName?: string;
    rfqNumber?: string;
}

/**
 * Simple PDF generator that avoids html2canvas issues
 * Uses jsPDF directly to create PDFs from text content
 */
export async function generateSimpleRFQPDF(
    blocks: any[],
    options: PDFGenerationOptions = {}
): Promise<Blob> {
    const {
        title = 'RFQ Response',
        companyName = 'Your Company',
        rfqNumber = 'Current RFQ',
        excludeSubmissionInfo = true,
        excludeForms = false
    } = options;

    // Filter out submission information blocks if requested
    let blocksForPDF = excludeSubmissionInfo 
        ? blocks.filter(block => {
            const submissionKeywords = [
                'submission', 'contact', 'email', 'address', 'phone', 'fax',
                'submit', 'send', 'deliver', 'mail', 'correspondence'
            ];
            
            const blockText = block.text.toLowerCase();
            return !submissionKeywords.some(keyword => blockText.includes(keyword));
        })
        : blocks;

    // Filter out forms if requested
    if (excludeForms) {
        const originalCount = blocksForPDF.length;
        
        // Recursive function to filter forms from all levels
        const filterFormsRecursively = (blocks: any[]): any[] => {
            return blocks
                .filter(block => block.type !== 'Form')
                .map(block => {
                    if (block.children && block.children.length > 0) {
                        return {
                            ...block,
                            children: filterFormsRecursively(block.children)
                        };
                    }
                    return block;
                });
        };
        
        blocksForPDF = filterFormsRecursively(blocksForPDF);
        const filteredCount = blocksForPDF.length;
        console.log(`🔍 PDF Filter: ${originalCount} blocks → ${filteredCount} blocks (excluded forms recursively)`);
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 6; // Reduced from 7
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
            pdf.setFont('helvetica', 'bold');
        } else {
            pdf.setFont('helvetica', 'normal');
        }

        const maxWidth = pageWidth - (2 * margin);
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }

        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 3; // Reduced from 5
    };

    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue color
    addWrappedText(title, 20, true);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102); // Gray color
    addWrappedText(`RFQ Number: ${rfqNumber} | Company: ${companyName}`, 12);
    addWrappedText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    
    // Add separator line
    yPosition += 3; // Reduced from 5
    pdf.setDrawColor(37, 99, 235);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8; // Reduced from 10

    // Process blocks
    function processBlocks(blockList: any[], depth: number = 0): void {
        blockList.forEach(block => {
            // Check if we need a new page
            if (yPosition > pageHeight - margin - 20) {
                pdf.addPage();
                yPosition = margin;
            }

            const indent = depth * 10;

            switch (block.type) {
                case 'H1':
                    // Add extra space before H1 headers
                    if (yPosition > margin + 10) {
                        yPosition += 5;
                    }
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(37, 99, 235); // Blue
                    addWrappedText(block.text, 16, true);
                    break;
                    
                case 'H2':
                    // Add small space before H2 headers
                    if (yPosition > margin + 5) {
                        yPosition += 3;
                    }
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(30, 64, 175); // Darker blue
                    addWrappedText(block.text, 14, true);
                    break;
                    
                case 'H3':
                    // Add minimal space before H3 headers
                    if (yPosition > margin + 3) {
                        yPosition += 2;
                    }
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(55, 48, 163); // Purple
                    addWrappedText(block.text, 12, true);
                    break;
                    
                case 'Text':
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(51, 51, 51); // Dark gray
                    addWrappedText(block.text, 11);
                    break;
                    
                case 'Form':
                    // Add form box with dynamic height
                    const formTitleHeight = 15;
                    const formFieldsHeight = block.metadata?.formFields?.length ? Math.min(block.metadata.formFields.length * 8, 40) : 20;
                    const totalFormHeight = formTitleHeight + formFieldsHeight + 10;
                    
                    if (yPosition + totalFormHeight > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    // Draw form background
                    pdf.setDrawColor(209, 213, 219);
                    pdf.setFillColor(249, 250, 251);
                    pdf.roundedRect(margin, yPosition - 3, pageWidth - (2 * margin), totalFormHeight, 3, 3, 'FD');
                    
                    // Add form title
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(55, 65, 81);
                    pdf.text(block.text, margin + 5, yPosition + 5);
                    
                    if (block.metadata?.formFields && Array.isArray(block.metadata.formFields)) {
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(107, 114, 128);
                        let fieldY = yPosition + 15;
                        
                        block.metadata.formFields.forEach((field: any, index: number) => {
                            if (index < 5) { // Show up to 5 fields
                                const fieldName = field.name || field.label || `Field ${index + 1}`;
                                const fieldValue = field.value || '[To be filled]';
                                const fieldText = `• ${fieldName}: ${fieldValue}`;
                                
                                // Check if text fits on current page
                                if (fieldY > pageHeight - margin - 10) {
                                    pdf.addPage();
                                    yPosition = margin;
                                    fieldY = yPosition + 15;
                                }
                                
                                pdf.text(fieldText, margin + 5, fieldY);
                                fieldY += 4;
                            }
                        });
                        
                        // Adjust yPosition for the form
                        yPosition = fieldY + 5;
                    } else {
                        yPosition += totalFormHeight + 5;
                    }
                    break;
            }

            // Process children recursively
            if (block.children && block.children.length > 0) {
                processBlocks(block.children, depth + 1);
            }
        });
    }

    processBlocks(blocksForPDF);

    // Convert to blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
}

/**
 * Generates a PDF for a single form
 */
export async function generateFormPDF(
    formOptions: FormPDFOptions
): Promise<Blob> {
    const {
        formTitle,
        formFields,
        companyName = 'Your Company',
        rfqNumber = 'Current RFQ'
    } = formOptions;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, x: number = margin) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
            pdf.setFont('helvetica', 'bold');
        } else {
            pdf.setFont('helvetica', 'normal');
        }

        const maxWidth = pageWidth - (2 * margin);
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * 6) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
        }

        pdf.text(lines, x, yPosition);
        yPosition += lines.length * 6 + 3;
    };

    // Add header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235); // Blue color
    addText(formTitle, 18, true);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102); // Gray color
    addText(`RFQ Number: ${rfqNumber} | Company: ${companyName}`, 12);
    addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
    
    // Add separator line
    yPosition += 5;
    pdf.setDrawColor(37, 99, 235);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Add form fields
    if (formFields && Array.isArray(formFields)) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        addText('Form Fields:', 14, true);
        yPosition += 5;

        formFields.forEach((field, index) => {
            const fieldName = field.name || field.label || `Field ${index + 1}`;
            const fieldValue = field.value || '[To be filled]';
            
            // Field name
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(55, 65, 81);
            addText(`${fieldName}:`, 12, true, margin + 5);
            
            // Field value
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(51, 51, 51);
            addText(fieldValue, 11, false, margin + 10);
            
            yPosition += 5; // Extra space between fields
        });
    }

    // Convert to blob
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
}

/**
 * Downloads the PDF file
 */
export function downloadPDF(pdfBlob: Blob, filename: string = 'RFQ_Response.pdf'): void {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
} 