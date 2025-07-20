'use client';

import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
    title?: string;
    companyName?: string;
    rfqNumber?: string;
    excludeSubmissionInfo?: boolean;
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
        excludeSubmissionInfo = true
    } = options;

    // Filter out submission information blocks if requested
    const blocksForPDF = excludeSubmissionInfo 
        ? blocks.filter(block => {
            const submissionKeywords = [
                'submission', 'contact', 'email', 'address', 'phone', 'fax',
                'submit', 'send', 'deliver', 'mail', 'correspondence'
            ];
            
            const blockText = block.text.toLowerCase();
            return !submissionKeywords.some(keyword => blockText.includes(keyword));
        })
        : blocks;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
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
        yPosition += lines.length * lineHeight + 5;
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
    yPosition += 5;
    pdf.setDrawColor(37, 99, 235);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

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
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(37, 99, 235); // Blue
                    addWrappedText(block.text, 16, true);
                    break;
                    
                case 'H2':
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(30, 64, 175); // Darker blue
                    addWrappedText(block.text, 14, true);
                    break;
                    
                case 'H3':
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
                    // Add form box
                    const formHeight = 30;
                    if (yPosition + formHeight > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    pdf.setDrawColor(209, 213, 219);
                    pdf.setFillColor(249, 250, 251);
                    pdf.roundedRect(margin, yPosition - 5, pageWidth - (2 * margin), formHeight, 3, 3, 'FD');
                    
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(55, 65, 81);
                    pdf.text(block.text, margin + 5, yPosition + 5);
                    
                    if (block.metadata?.formFields) {
                        pdf.setFontSize(9);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(107, 114, 128);
                        let fieldY = yPosition + 15;
                        block.metadata.formFields.forEach((field: any, index: number) => {
                            if (index < 3) { // Limit to 3 fields to avoid overflow
                                pdf.text(`• ${field.name}: ${field.value || '[To be filled]'}`, margin + 5, fieldY);
                                fieldY += 4;
                            }
                        });
                    }
                    
                    yPosition += formHeight + 10;
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