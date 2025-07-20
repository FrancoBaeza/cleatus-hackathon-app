'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFGenerationOptions {
    title?: string;
    companyName?: string;
    rfqNumber?: string;
    excludeSubmissionInfo?: boolean;
}

export interface EmailTemplate {
    subject: string;
    body: string;
    to: string[];
    cc?: string[];
    attachments: string[];
}

/**
 * Generates a PDF from the RFQ response blocks
 * Excludes submission information section for PDF export
 */
export async function generateRFQPDF(
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
            // Remove blocks that contain submission information
            const submissionKeywords = [
                'submission', 'contact', 'email', 'address', 'phone', 'fax',
                'submit', 'send', 'deliver', 'mail', 'correspondence'
            ];
            
            const blockText = block.text.toLowerCase();
            return !submissionKeywords.some(keyword => blockText.includes(keyword));
        })
        : blocks;

    // Create a temporary container for PDF generation
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    container.style.color = '#333333';

    // Add header
    const header = document.createElement('div');
    header.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h1 style="color: #2563eb; font-size: 24px; margin: 0 0 10px 0;">${title}</h1>
            <p style="font-size: 14px; margin: 0; color: #666666;">
                RFQ Number: ${rfqNumber} | Company: ${companyName}
            </p>
            <p style="font-size: 12px; margin: 5px 0 0 0; color: #888888;">
                Generated on: ${new Date().toLocaleDateString()}
            </p>
        </div>
    `;
    container.appendChild(header);

    // Process blocks and add to container
    function processBlocks(blockList: any[], depth: number = 0): void {
        blockList.forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.style.marginBottom = '15px';
            blockElement.style.marginLeft = `${depth * 20}px`;

            switch (block.type) {
                case 'H1':
                    blockElement.innerHTML = `
                        <h1 style="color: #2563eb; font-size: 20px; margin: 20px 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
                            ${block.text}
                        </h1>
                    `;
                    break;
                case 'H2':
                    blockElement.innerHTML = `
                        <h2 style="color: #1e40af; font-size: 16px; margin: 15px 0 10px 0; font-weight: 600;">
                            ${block.text}
                        </h2>
                    `;
                    break;
                case 'H3':
                    blockElement.innerHTML = `
                        <h3 style="color: #3730a3; font-size: 14px; margin: 10px 0 8px 0; font-weight: 600;">
                            ${block.text}
                        </h3>
                    `;
                    break;
                case 'Text':
                    blockElement.innerHTML = `
                        <p style="margin: 8px 0; text-align: justify;">
                            ${block.text}
                        </p>
                    `;
                    break;
                case 'Form':
                    blockElement.innerHTML = `
                        <div style="border: 1px solid #d1d5db; padding: 15px; margin: 10px 0; background-color: #f9fafb; border-radius: 4px;">
                            <h4 style="color: #374151; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">
                                ${block.text}
                            </h4>
                            ${block.metadata?.formFields ? `
                                <div style="font-size: 11px; color: #6b7280;">
                                    <strong>Form Fields:</strong><br>
                                    ${block.metadata.formFields.map((field: any) => 
                                        `• ${field.name}: ${field.value || '[To be filled]'}`
                                    ).join('<br>')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                    break;
            }

            container.appendChild(blockElement);

            // Process children recursively
            if (block.children && block.children.length > 0) {
                processBlocks(block.children, depth + 1);
            }
        });
    }

    processBlocks(blocksForPDF);

    // Add to document temporarily
    document.body.appendChild(container);

    try {
        // Generate PDF
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: container.scrollHeight,
            ignoreElements: (element) => {
                // Ignore elements with problematic CSS properties
                const style = window.getComputedStyle(element);
                return style.color.includes('lab(') || 
                       style.backgroundColor.includes('lab(') ||
                       style.borderColor.includes('lab(');
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        return pdfBlob;

    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Generates an email template for submission
 */
export function generateEmailTemplate(
    blocks: any[],
    contactInfo: any,
    pdfBlob?: Blob
): EmailTemplate {
    // Extract submission information from blocks
    const submissionBlock = blocks.find(block => 
        block.text.toLowerCase().includes('submission') ||
        block.text.toLowerCase().includes('contact')
    );

    const subject = `RFQ Response Submission - ${contactInfo?.rfqNumber || 'Current RFQ'}`;
    
    const body = `
Dear ${contactInfo?.primaryContact?.name || 'Contracting Officer'},

Please find attached our complete RFQ response for ${contactInfo?.rfqNumber || 'the current solicitation'}.

${submissionBlock ? submissionBlock.text : ''}

Key Points:
• Complete response package attached
• All required forms included
• Technical specifications addressed
• Pricing and terms provided
• Compliance requirements met

Please let us know if you need any additional information or clarification.

Best regards,
${contactInfo?.companyName || 'Your Company'}

---
This response was generated using our automated RFQ response system.
    `.trim();

    return {
        subject,
        body,
        to: contactInfo?.submissionEmail || [],
        cc: contactInfo?.secondaryContact?.email ? [contactInfo.secondaryContact.email] : [],
        attachments: pdfBlob ? ['RFQ_Response.pdf'] : []
    };
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

/**
 * Opens default email client with pre-filled template
 */
export function openEmailClient(template: EmailTemplate): void {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(template.body);
    const to = template.to.join(',');
    const cc = template.cc?.join(',') || '';
    
    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}${cc ? `&cc=${cc}` : ''}`;
    
    window.open(mailtoUrl, '_blank');
} 