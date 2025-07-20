'use client';

/**
 * AGENT PROGRESS PANEL COMPONENT
 * 
 * PURPOSE:
 * This component displays real-time progress of AI agents during RFQ response
 * generation. It provides visual feedback as each agent completes its work.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type AgentProgress as AgentProgressType } from '@/lib/types';
import AgentProgress from './AgentProgress';

interface AgentProgressPanelProps {
    agentProgress: AgentProgressType;
    isGenerating: boolean;
}

export default function AgentProgressPanel({ 
    agentProgress, 
    isGenerating 
}: AgentProgressPanelProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>AI Agent Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <AgentProgress 
                    progress={agentProgress} 
                    isGenerating={isGenerating} 
                />
            </CardContent>
        </Card>
    );
} 