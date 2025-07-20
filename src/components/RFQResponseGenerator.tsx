'use client';

/**
 * RFQ RESPONSE GENERATOR - MAIN COMPONENT
 * 
 * PURPOSE:
 * This is the main component that coordinates the entire RFQ response generation
 * interface. It manages the overall state and orchestrates the interaction between
 * the progress panel, response editor, and action buttons.
 * 
 * RESPONSIBILITIES:
 * - Coordinate real-time agent execution with progress updates
 * - Manage response blocks state and editing functionality
 * - Handle error states and user feedback
 * - Orchestrate communication between child components
 * - Provide consistent layout and user experience
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

import { useRealTimeRFQGeneration } from '@/hooks/useRealTimeRFQGeneration';
import { type ResponseBlock } from '@/lib/types';

import AgentProgressPanel from './AgentProgressPanel';
import ResponseEditor from './ResponseEditor';
import AgentResults from './AgentResults';
import ActionButtons from '@/components/ActionButtons';

export default function RFQResponseGenerator() {
    // Real-time generation hook
    const {
        generateRFQResponse,
        isGenerating,
        error,
        agentProgress,
        finalResponse,
        intermediateResults,
    } = useRealTimeRFQGeneration();

    // Response blocks state (for editing)
    const [responseBlocks, setResponseBlocks] = useState<ResponseBlock[]>([]);

    // Update response blocks when final response is ready
    React.useEffect(() => {
        if (finalResponse?.blocks) {
            setResponseBlocks(finalResponse.blocks);
        }
    }, [finalResponse]);

    // Handle block updates from editor
    const handleBlockUpdate = (updatedBlocks: ResponseBlock[]) => {
        setResponseBlocks(updatedBlocks);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    CLEATUS - AI Government RFQ Responder
                </h1>
                <p className="text-lg text-gray-600">
                    Contract-agnostic multi-agent system for professional government contracting responses
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <ActionButtons
                isGenerating={isGenerating}
                onGenerate={generateRFQResponse}
                hasResponse={!!finalResponse}
                responseBlocks={responseBlocks}
            />

            {/* Agent Progress Panel */}
            {(isGenerating || finalResponse) && (
                <AgentProgressPanel
                    agentProgress={agentProgress}
                    isGenerating={isGenerating}
                />
            )}

            {/* Main Content */}
            {finalResponse && (
                <div className="mt-8">
                    <Tabs defaultValue="editor" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="editor">📝 Response Editor</TabsTrigger>
                            <TabsTrigger value="insights">🔍 Agent Insights</TabsTrigger>
                        </TabsList>

                        <TabsContent value="editor" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>RFQ Response Editor</span>
                                        <div className="text-sm text-gray-500">
                                            {responseBlocks.length} blocks • Ready for submission
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponseEditor
                                        blocks={responseBlocks}
                                        onBlocksUpdate={handleBlockUpdate}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="insights" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Agent Insights & Analysis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AgentResults
                                        dataAnalysis={finalResponse.agentInsights.dataAnalysis}
                                        analysis={finalResponse.agentInsights.analysis}
                                        strategy={finalResponse.agentInsights.strategy}
                                        proposal={finalResponse.agentInsights.proposal}
                                        review={finalResponse.agentInsights.review || undefined}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Welcome State */}
            {!finalResponse && !isGenerating && (
                <div className="mt-8">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="max-w-2xl mx-auto">
                                <h2 className="text-2xl font-semibold mb-4">
                                    Welcome to CLEATUS
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    Our AI-powered system analyzes any government RFQ and generates 
                                    professional, compliant responses using a multi-agent approach. 
                                    Click "Generate RFQ Response" to begin the analysis.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl">📊</span>
                                        </div>
                                        <h3 className="font-semibold text-sm">Data Analysis</h3>
                                        <p className="text-xs text-gray-500">Process contract & entity data</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                        <h3 className="font-semibold text-sm">Strategic Analysis</h3>
                                        <p className="text-xs text-gray-500">Identify gaps & opportunities</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl">🎯</span>
                                        </div>
                                        <h3 className="font-semibold text-sm">Strategy Development</h3>
                                        <p className="text-xs text-gray-500">Develop winning positioning</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl">✍️</span>
                                        </div>
                                        <h3 className="font-semibold text-sm">Response Generation</h3>
                                        <p className="text-xs text-gray-500">Create professional content</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
} 