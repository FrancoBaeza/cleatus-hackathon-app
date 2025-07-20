'use client';

/**
 * RESPONSE EDITOR COMPONENT
 * 
 * PURPOSE:
 * This component provides the interface for editing RFQ response blocks.
 * It wraps the BlockEditor with additional functionality and context.
 */

import { type ResponseBlock } from '@/lib/types';
import BlockEditor from './BlockEditor';

interface ResponseEditorProps {
    blocks: ResponseBlock[];
    onBlocksUpdate: (blocks: ResponseBlock[]) => void;
}

export default function ResponseEditor({ 
    blocks, 
    onBlocksUpdate 
}: ResponseEditorProps) {
    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
                Edit your response blocks below. All changes are automatically saved.
                Forms can be filled out and will be included in your final submission.
            </div>
            
            <BlockEditor 
                blocks={blocks}
                onBlocksChange={onBlocksUpdate}
                rfqNumber="Current RFQ"
                companyName="Company"
                confidenceScore={85}
            />
        </div>
    );
} 