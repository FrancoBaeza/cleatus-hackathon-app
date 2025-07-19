'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Rocket,
    Building2,
    FileText,
    Sparkles,
    AlertCircle,
} from 'lucide-react';
import AgentProgress from '@/components/AgentProgress';
import AgentResults from '@/components/AgentResults';
import {
    AgentProgress as AgentProgressType,
    AnalysisOutput,
    StrategyOutput,
    ProposalOutput,
    ReviewOutput,
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

    const [results, setResults] = useState<{
        analysis?: AnalysisOutput;
        strategy?: StrategyOutput;
        proposal?: ProposalOutput;
        review?: ReviewOutput;
        logs?: any[];
        summary?: any;
    }>({});

    const generateResponse = async () => {
        setIsGenerating(true);
        setError(null);
        setResults({});

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
                        message: `Found ${result.analysis.gaps.length} gaps, ${result.analysis.opportunities.length} opportunities identified`,
                        result: result.analysis,
                    },
                    strategist: {
                        state: 'working',
                        message:
                            'Developing partnership strategy for NAICS gap...',
                    },
                }));
                setResults((prev) => ({ ...prev, analysis: result.analysis }));
            }, 1000);

            // Agent 2 completed
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    strategist: {
                        state: 'completed',
                        message: `Partnership strategy developed - ${result.strategy.winProbability}% win probability`,
                        result: result.strategy,
                    },
                    writer: {
                        state: 'working',
                        message: 'Generating professional proposal content...',
                    },
                }));
                setResults((prev) => ({ ...prev, strategy: result.strategy }));
            }, 3000);

            // Agent 3 completed
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    writer: {
                        state: 'completed',
                        message: `Proposal generated, ${result.proposal.submissionForms.length} forms completed`,
                        result: result.proposal,
                    },
                    reviewer: {
                        state: 'working',
                        message:
                            'Reviewing compliance and finalizing submission package...',
                    },
                }));
                setResults((prev) => ({ ...prev, proposal: result.proposal }));
            }, 5000);

            // Agent 4 completed
            setTimeout(() => {
                setAgentProgress((prev) => ({
                    ...prev,
                    reviewer: {
                        state: 'completed',
                        message: `Compliance verified - ${result.review.finalScore}% submission confidence`,
                        result: result.review,
                    },
                }));
                setResults((prev) => ({
                    ...prev,
                    review: result.review,
                    logs: result.logs,
                    summary: result.summary,
                }));
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

    const hasResults = Object.keys(results).length > 0;

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
                        Multi-Agent Government Proposal Generator - Transform
                        RFQs into winning proposals in 30 seconds
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                        <Badge variant="secondary" className="text-sm">
                            🎯 4 Specialized Agents
                        </Badge>
                        <Badge variant="secondary" className="text-sm">
                            ⚡ Real OpenAI Integration
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
                            <span>Generate Proposal</span>
                        </CardTitle>
                        <p className="text-gray-600">
                            Real contract data loaded. Click Generate to see 4
                            AI agents analyze, strategize, write, and review a
                            complete government proposal.
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
                                    ? 'Real OpenAI agents analyzing contract and generating strategic proposal...'
                                    : 'Watch 4 specialized AI agents collaborate using real government contracting expertise'}
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

                {/* Results */}
                {hasResults && (
                    <AgentResults
                        analysis={results.analysis}
                        strategy={results.strategy}
                        proposal={results.proposal}
                        review={results.review}
                    />
                )}

                {/* Debug Info (only show if we have logs) */}
                {results.summary && process.env.NODE_ENV === 'development' && (
                    <Card className="max-w-4xl mx-auto mt-8">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Debug Info - Agent Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold">
                                        Total Events
                                    </p>
                                    <p>{results.summary.totalEvents}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Success Rate
                                    </p>
                                    <p>
                                        {Math.round(
                                            (results.summary.successCount /
                                                results.summary.totalEvents) *
                                                100,
                                        )}
                                        %
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold">Errors</p>
                                    <p>{results.summary.errorCount}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        Avg Response Time
                                    </p>
                                    <p>
                                        {Object.values(
                                            results.summary.agentStats,
                                        ).reduce(
                                            (acc: number, stat: any) =>
                                                acc + stat.avgDuration,
                                            0,
                                        ) / 4}
                                        ms
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
