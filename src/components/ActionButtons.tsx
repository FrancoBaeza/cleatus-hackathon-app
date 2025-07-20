'use client';

/**
 * ACTION BUTTONS COMPONENT
 * 
 * PURPOSE:
 * This component provides the primary action buttons for the RFQ response system,
 * including generation triggers and export functionality.
 */

import { Button } from '@/components/ui/button';
import { Download, Zap, FileText, Mail } from 'lucide-react';
import { type ResponseBlock } from '@/lib/types';

interface ActionButtonsProps {
    isGenerating: boolean;
    onGenerate: () => void;
    hasResponse: boolean;
    responseBlocks: ResponseBlock[];
}

export default function ActionButtons({
    isGenerating,
    onGenerate,
    hasResponse,
    responseBlocks,
}: ActionButtonsProps) {
    const handleExportPDF = () => {
        // TODO: Implement PDF export
        console.log('Exporting to PDF...', responseBlocks);
    };

    const handleExportEmail = () => {
        // TODO: Implement email template export
        console.log('Generating email template...', responseBlocks);
    };

    return (
        <div className="flex flex-wrap gap-4 mb-6">
            <Button
                onClick={onGenerate}
                disabled={isGenerating}
                size="lg"
                className="flex items-center space-x-2"
            >
                <Zap className="w-5 h-5" />
                <span>
                    {isGenerating ? 'Generating...' : 'Generate RFQ Response'}
                </span>
            </Button>

            {/* {hasResponse && (
                <>
                    <Button
                        onClick={handleExportPDF}
                        variant="outline"
                        size="lg"
                        className="flex items-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export PDF</span>
                    </Button>

                    <Button
                        onClick={handleExportEmail}
                        variant="outline"
                        size="lg"
                        className="flex items-center space-x-2"
                    >
                        <Mail className="w-4 h-4" />
                        <span>Email Template</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="flex items-center space-x-2"
                    >
                        <FileText className="w-4 h-4" />
                        <span>View JSON</span>
                    </Button>
                </>
            )} */}
        </div>
    );
} 