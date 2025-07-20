'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    FileDown, 
    Mail, 
    Download, 
    Send, 
    CheckCircle, 
    AlertCircle,
    Eye,
    Clock
} from 'lucide-react';
import { 
    generateSimpleRFQPDF, 
    downloadPDF 
} from '@/lib/services/pdf-generator-simple';
import { 
    generateEmailTemplate, 
    openEmailClient,
    type EmailTemplate 
} from '@/lib/services/pdf-generator';
import { type ResponseBlock } from '@/lib/types';

interface ExportAndSubmitButtonsProps {
    blocks: ResponseBlock[];
    contactInfo?: any;
    rfqNumber?: string;
    companyName?: string;
    onExportStart?: () => void;
    onExportComplete?: () => void;
}

export default function ExportAndSubmitButtons({
    blocks,
    contactInfo,
    rfqNumber = 'Current RFQ',
    companyName = 'Your Company',
    onExportStart,
    onExportComplete
}: ExportAndSubmitButtonsProps) {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isPreparingEmail, setIsPreparingEmail] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
    const [lastAction, setLastAction] = useState<'pdf' | 'email' | null>(null);

    const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true);
        setLastAction('pdf');
        onExportStart?.();

        try {
            const blob = await generateSimpleRFQPDF(blocks, {
                title: `RFQ Response - ${rfqNumber}`,
                companyName,
                rfqNumber,
                excludeSubmissionInfo: true
            });
            
            setPdfBlob(blob);
            downloadPDF(blob, `RFQ_Response_${rfqNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            console.log('✅ PDF generated and downloaded successfully');
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
            onExportComplete?.();
        }
    };

    const handlePrepareEmail = async () => {
        setIsPreparingEmail(true);
        setLastAction('email');

        try {
            // Generate PDF if not already generated
            let currentPdfBlob = pdfBlob;
            if (!currentPdfBlob) {
                currentPdfBlob = await generateSimpleRFQPDF(blocks, {
                    title: `RFQ Response - ${rfqNumber}`,
                    companyName,
                    rfqNumber,
                    excludeSubmissionInfo: true
                });
                setPdfBlob(currentPdfBlob);
            }

            // Generate email template
            const template = generateEmailTemplate(blocks, {
                ...contactInfo,
                rfqNumber,
                companyName
            }, currentPdfBlob || undefined);
            
            setEmailTemplate(template);
            
            // Open email client
            openEmailClient(template);
            
            console.log('✅ Email template prepared and email client opened');
        } catch (error) {
            console.error('❌ Email preparation failed:', error);
            alert('Failed to prepare email. Please try again.');
        } finally {
            setIsPreparingEmail(false);
        }
    };

    const handleDownloadPDF = () => {
        if (pdfBlob) {
            downloadPDF(pdfBlob, `RFQ_Response_${rfqNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
        } else {
            handleGeneratePDF();
        }
    };

    const handleResendEmail = () => {
        if (emailTemplate) {
            openEmailClient(emailTemplate);
        } else {
            handlePrepareEmail();
        }
    };

    const hasContactInfo = contactInfo?.submissionEmail && contactInfo.submissionEmail.length > 0;
    const hasBlocks = blocks && blocks.length > 0;

    return (
        <div className="space-y-4">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF Status */}
                <Card className={`border-2 ${pdfBlob ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                            <FileDown className="w-4 h-4" />
                            <span>PDF Export</span>
                            {pdfBlob && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xs text-gray-600 mb-3">
                            {pdfBlob ? (
                                <span className="flex items-center text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    PDF ready for download
                                </span>
                            ) : (
                                <span className="flex items-center text-gray-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Generate PDF for submission
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF || !hasBlocks}
                            size="sm"
                            className="w-full"
                            variant={pdfBlob ? "outline" : "default"}
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : pdfBlob ? (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Generate PDF
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Email Status */}
                <Card className={`border-2 ${emailTemplate ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>Email Submission</span>
                            {emailTemplate && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xs text-gray-600 mb-3">
                            {emailTemplate ? (
                                <span className="flex items-center text-blue-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Email template ready
                                </span>
                            ) : hasContactInfo ? (
                                <span className="flex items-center text-gray-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Prepare email for submission
                                </span>
                            ) : (
                                <span className="flex items-center text-yellow-600">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Contact info needed
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={handleResendEmail}
                            disabled={isPreparingEmail || !hasBlocks || !hasContactInfo}
                            size="sm"
                            className="w-full"
                            variant={emailTemplate ? "outline" : "default"}
                        >
                            {isPreparingEmail ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Preparing...
                                </>
                            ) : emailTemplate ? (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Resend Email
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Prepare Email
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Information Display */}
            {hasContactInfo && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>Submission Contacts</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="font-medium">Primary Contact:</span>
                                <span>{contactInfo.primaryContact?.name || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Email:</span>
                                <span className="text-blue-600">{contactInfo.primaryContact?.email || 'Not specified'}</span>
                            </div>
                            {contactInfo.secondaryContact && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Secondary Contact:</span>
                                        <span>{contactInfo.secondaryContact.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Secondary Email:</span>
                                        <span className="text-blue-600">{contactInfo.secondaryContact.email}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between">
                                <span className="font-medium">Submission Emails:</span>
                                <span className="text-blue-600">{contactInfo.submissionEmail.join(', ')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            {/* <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !hasBlocks}
                    className="flex-1"
                    size="lg"
                >
                    {isGeneratingPDF ? (
                        <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <FileDown className="w-5 h-5 mr-2" />
                            Export to PDFf
                        </>
                    )}
                </Button>

                <Button
                    onClick={handlePrepareEmail}
                    disabled={isPreparingEmail || !hasBlocks || !hasContactInfo}
                    className="flex-1"
                    size="lg"
                    variant="outline"
                >
                    {isPreparingEmail ? (
                        <>
                            <Clock className="w-5 h-5 mr-2 animate-spin" />
                            Preparing Email...
                        </>
                    ) : (
                        <>
                            <Mail className="w-5 h-5 mr-2" />
                            Send Email
                        </>
                    )}
                </Button>
            </div> */}

            {/* Status Messages */}
            {lastAction && (
                <div className={`p-3 rounded-lg text-sm ${
                    lastAction === 'pdf' && pdfBlob ? 'bg-green-100 text-green-800' :
                    lastAction === 'email' && emailTemplate ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {lastAction === 'pdf' && pdfBlob && (
                        <span className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            PDF generated successfully! Check your downloads folder.
                        </span>
                    )}
                    {lastAction === 'email' && emailTemplate && (
                        <span className="flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Email template prepared! Your default email client should have opened.
                        </span>
                    )}
                </div>
            )}

            {/* Warning for missing contact info */}
            {!hasContactInfo && (
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 text-sm">
                    <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Contact information not found. Email submission will not be available until contact details are extracted from the RFQ documents.
                    </span>
                </div>
            )}
        </div>
    );
} 