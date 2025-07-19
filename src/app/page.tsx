'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Rocket,
    Building2,
    FileText,
    Sparkles,
    AlertCircle,
    Eye,
    Settings,
    Users
} from 'lucide-react';
import AgentProgress from '@/components/AgentProgress';
import AgentResults from '@/components/AgentResults';
import BlockEditor from '@/components/BlockEditor';
import { 
    AgentProgress as AgentProgressType,
    AnalysisOutput,
    StrategyOutput, 
    ProposalOutput,
    ReviewOutput,
    GeneratedRFQResponse,
    ResponseBlock
} from '@/lib/types';
import { generateProposalResponse } from '@/lib/agents';

// Sample data for display (real data comes from server actions)
const sampleContract = {
    id: 'contract_001',
    title: 'Bleacher Seating Systems',
    solicitationNumber: 'FA301625Q0050',
    agencyName: 'DEPT OF THE AIR FORCE',
    naicsId: '337127',
    deadlineDate: '2025-07-21 21:00:00',
};

const sampleEntity = {
    id: 'entity_001',
    businessName: 'GUNN CONSTRUCTION LLC',
    physicalAddress: '3533 COLUMBIA PIKE, ARLINGTON, VA',
    cageCode: '9HET5',
};

export default function Home() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentProgress, setAgentProgress] = useState<AgentProgressType>({
        analyzer: { state: 'pending', message: 'Waiting to start analysis...' },
        strategist: {
            state: 'pending',
            message: 'Waiting for analysis results...',
        },
        writer: { state: 'pending', message: 'Waiting for strategy...' },
        reviewer: {
            state: 'pending',
            message: 'Waiting for proposal draft...',
        },
    });
    
    // New: Complete RFQ Response with blocks and insights
    const [rfqResponse, setRfqResponse] = useState<GeneratedRFQResponse | null>(null);
    const [responseBlocks, setResponseBlocks] = useState<ResponseBlock[]>([]);

    const generateResponse = async () => {
        setIsGenerating(true);
        setError(null);
        setRfqResponse(null);
        setResponseBlocks([]);
        
        // Reset progress
        setAgentProgress({
            analyzer: {
                state: 'working',
                message: 'Analyzing RFQ requirements and identifying gaps...',
            },
            strategist: {
                state: 'pending',
                message: 'Waiting for analysis results...',
            },
            writer: { state: 'pending', message: 'Waiting for strategy...' },
            reviewer: {
                state: 'pending',
                message: 'Waiting for proposal draft...',
            },
        });
        
        try {
            // Call the real server action orchestrator
            const result = await generateProposalResponse();
            
            // Update UI as each agent completes (simulated since server action runs all at once)
            // Agent 1 completed
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    analyzer: {
                        state: 'completed',
                        message: `Found ${result.agentInsights.analysis.gaps.length} gaps, ${result.agentInsights.analysis.opportunities.length} opportunities identified`,
                        result: result.agentInsights.analysis,
                    },
                    strategist: {
                        state: 'working',
                        message:
                            'Developing partnership strategy for NAICS gap...',
                    },
                }));
            }, 1000);

            // Agent 2 completed  
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    strategist: {
                        state: 'completed',
                        message: `Partnership strategy developed - ${result.agentInsights.strategy.winProbability}% win probability`,
                        result: result.agentInsights.strategy,
                    },
                    writer: {
                        state: 'working',
                        message: 'Generating RFQ response blocks...',
                    },
                }));
            }, 3000);

            // Agent 3 completed
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    writer: {
                        state: 'completed',
                        message: `Generated ${result.blocks.length} response blocks with ${result.blocks.filter(b => b.type === 'Form').length} forms`,
                        result: result.agentInsights.proposal,
                    },
                    reviewer: {
                        state: 'working',
                        message:
                            'Reviewing compliance and finalizing submission package...',
                    },
                }));
            }, 5000);

            // Agent 4 completed - Set final results
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    reviewer: {
                        state: 'completed',
                        message: `Compliance verified - ${result.confidenceScore}% submission confidence`,
                        result: result.agentInsights.review,
                    },
                }));
                
                // Set the complete RFQ response
                setRfqResponse(result);
                setResponseBlocks(result.blocks);
                setIsGenerating(false);
            }, 6500);
            
        } catch (error) {
            console.error('Generation failed:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred',
            );

            // Update progress to show error state
            setAgentProgress((prev) => {
                const currentAgent = Object.entries(prev).find(
                    ([_, agent]) => agent.state === 'working',
                )?.[0] as keyof AgentProgressType;
                if (currentAgent) {
                    return {
                        ...prev,
                        [currentAgent]: {
                            state: 'error',
                            message: `Error: ${
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error'
                            }`,
                        },
                    };
                }
                return prev;
            });
            
            setIsGenerating(false);
        }
    };

    const hasResults = rfqResponse !== null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <Rocket className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            CLEATUS AI Agent 2.0
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Multi-Agent RFQ Response Generator - 4 AI specialists collaborate to create editable, professional government proposals
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                        <Badge variant="secondary" className="text-sm">
                            🎯 4 Specialized Agents
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            📝 Editable Block System
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            🏛️ Government Contracting Expert
                        </Badge>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="max-w-4xl mx-auto border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="font-semibold text-red-800">
                                    Generation Error
                                </span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your OpenAI API key is configured in
                                .env.local
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Input Section */}
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center space-x-2">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                            <span>Generate RFQ Response</span>
                        </CardTitle>
                        <p className="text-gray-600">
                            Watch 4 AI agents analyze, strategize, write, and review a complete, editable government proposal response.
                        </p>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {/* RFQ Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-2 border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <FileText className="w-6 h-6 text-blue-600 mt-1" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-blue-900">
                                                Real Contract Data
                                            </h3>
                                            <p className="text-sm text-blue-700 mt-1">
                                                {
                                                    sampleContract.solicitationNumber
                                                }
                                            </p>
                                            <p className="text-sm font-medium text-blue-800">
                                                {sampleContract.title}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                {sampleContract.agencyName}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="mt-2 text-xs border-blue-300 text-blue-700"
                                            >
                                                NAICS {sampleContract.naicsId}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-green-200 bg-green-50">
                                <CardContent className="p-4">
                                    <div className="flex items-start space-x-3">
                                        <Building2 className="w-6 h-6 text-green-600 mt-1" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-green-900">
                                                Real Entity Data
                                            </h3>
                                            <p className="text-sm font-medium text-green-800">
                                                {sampleEntity.businessName}
                                            </p>
                                            <p className="text-xs text-green-600 mt-1">
                                                {sampleEntity.physicalAddress}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="mt-2 text-xs border-green-300 text-green-700"
                                            >
                                                CAGE: {sampleEntity.cageCode}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Generate Button */}
                        <div className="text-center">
                            <Button 
                                onClick={generateResponse}
                                disabled={isGenerating}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                        AI Agents Working...
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-5 h-5 mr-2" />
                                        Generate Response with AI
                                    </>
                                )}
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                                {isGenerating
                                    ? 'Real OpenAI agents generating structured RFQ response blocks...'
                                    : 'Click to see AI agents collaborate and create an editable RFQ response'}
                            </p>
                        </div>

                        {/* Development Note */}
                        <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                                ⚠️ Requires OpenAI API Key in .env.local
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Agent Progress */}
                {(isGenerating || hasResults) && (
                    <AgentProgress
                        progress={agentProgress}
                        isGenerating={isGenerating}
                    />
                )}

                {/* Main Results - Two Views */}
                {hasResults && rfqResponse && (
                    <div className="space-y-6">
                        <Tabs defaultValue="response" className="w-full">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-2xl font-bold">
                                            Generated RFQ Response
                                        </CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary" className={`${rfqResponse.submissionReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {rfqResponse.confidenceScore}% Confidence
                                            </Badge>
                                            {rfqResponse.submissionReady && (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                    ✅ Submission Ready
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <TabsList className="grid w-full grid-cols-2 mt-4">
                                        <TabsTrigger value="response" className="flex items-center space-x-2">
                                            <Eye className="w-4 h-4" />
                                            <span>RFQ Response Editor</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="insights" className="flex items-center space-x-2">
                                            <Users className="w-4 h-4" />
                                            <span>Agent Insights</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </CardHeader>

                                <CardContent>
                                    <TabsContent value="response" className="mt-6">
                                        <BlockEditor
                                            blocks={responseBlocks}
                                            onBlocksChange={setResponseBlocks}
                                            rfqNumber={rfqResponse.metadata.rfqNumber}
                                            companyName={rfqResponse.metadata.companyName}
                                            confidenceScore={rfqResponse.confidenceScore}
                                        />
                                    </TabsContent>

                                    <TabsContent value="insights" className="mt-6">
                                        <AgentResults 
                                            analysis={rfqResponse.agentInsights.analysis}
                                            strategy={rfqResponse.agentInsights.strategy} 
                                            proposal={rfqResponse.agentInsights.proposal}
                                            review={rfqResponse.agentInsights.review}
                                        />
                                    </TabsContent>
                                </CardContent>
                            </Card>
                        </Tabs>
                    </div>
                )}
            </div>
        </div>
    );
}
