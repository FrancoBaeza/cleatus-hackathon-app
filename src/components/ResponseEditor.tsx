'use client';

/**
 * ENHANCED RESPONSE EDITOR COMPONENT
 * 
 * PURPOSE:
 * This component provides an advanced interface for editing hierarchical RFQ response blocks.
 * It includes navigation, structure overview, and enhanced visualization of the content hierarchy.
 * 
 * KEY FEATURES:
 * - Hierarchical content navigation (table of contents)
 * - Content structure overview with statistics
 * - Visual progress indicators
 * - Quick navigation between sections
 * - Enhanced editing experience with context awareness
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    FileText, 
    List, 
    BarChart3, 
    Eye,
    Hash,
    Type,
    FormInput,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

import { type ResponseBlock, flattenBlocks } from '@/lib/types';
import HierarchicalBlockEditor from './HierarchicalBlockEditor';

interface ResponseEditorProps {
    blocks: ResponseBlock[];
    onBlocksUpdate: (blocks: ResponseBlock[]) => void;
    rfqNumber?: string;
    companyName?: string;
    confidenceScore?: number;
}

// Table of Contents Component
const TableOfContents = ({ 
    blocks, 
    onNavigate 
}: { 
    blocks: ResponseBlock[], 
    onNavigate: (blockId: string) => void 
}) => {
    const renderTOCItems = (blockList: ResponseBlock[], depth: number = 0): React.ReactNode[] => {
        return blockList.map((block) => {
            const isHeader = ['H1', 'H2', 'H3'].includes(block.type);
            const hasChildren = block.children && block.children.length > 0;
            
            if (!isHeader) return null;
            
            return (
                <div key={block.id}>
                    <button
                        onClick={() => onNavigate(block.id)}
                        className={`
                            w-full text-left p-2 rounded hover:bg-gray-100 transition-colors
                            ${depth === 0 ? 'font-semibold text-blue-900' : ''}
                            ${depth === 1 ? 'font-medium text-blue-700 ml-4' : ''}
                            ${depth === 2 ? 'text-blue-600 ml-8' : ''}
                        `}
                        style={{ marginLeft: `${depth * 16}px` }}
                    >
                        <div className="flex items-center space-x-2">
                            <Hash className={`${depth === 0 ? 'w-4 h-4' : 'w-3 h-3'}`} />
                            <span className="truncate">{block.text}</span>
                        </div>
                    </button>
                    
                    {hasChildren && renderTOCItems(block.children!, depth + 1)}
                </div>
            );
        }).filter(Boolean);
    };

    return (
        <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <List className="w-4 h-4 mr-2" />
                Table of Contents
            </h3>
            {renderTOCItems(blocks)}
        </div>
    );
};

// Structure Overview Component
const StructureOverview = ({ blocks }: { blocks: ResponseBlock[] }) => {
    const stats = useMemo(() => {
        const flatBlocks = flattenBlocks(blocks);
        const h1Count = flatBlocks.filter(b => b.type === 'H1').length;
        const h2Count = flatBlocks.filter(b => b.type === 'H2').length;
        const h3Count = flatBlocks.filter(b => b.type === 'H3').length;
        const textCount = flatBlocks.filter(b => b.type === 'Text').length;
        const formCount = flatBlocks.filter(b => b.type === 'Form').length;
        const totalWords = flatBlocks.reduce((acc, block) => {
            if (block.type === 'Text') {
                return acc + block.text.split(' ').length;
            }
            return acc;
        }, 0);
        
        return { h1Count, h2Count, h3Count, textCount, formCount, totalWords, totalBlocks: flatBlocks.length };
    }, [blocks]);

    const getCompletionPercentage = () => {
        const flatBlocks = flattenBlocks(blocks);
        const completedBlocks = flatBlocks.filter(block => {
            if (block.type === 'Form') {
                return block.metadata?.formFields && block.metadata.formFields.length > 0;
            }
            return block.text.trim().length > 50; // Consider blocks with substantial content as complete
        });
        return Math.round((completedBlocks.length / flatBlocks.length) * 100);
    };

    const completionPercentage = getCompletionPercentage();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Structure Overview
            </h3>
            
            {/* Completion Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Content Completion</span>
                    <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-xs text-gray-600">
                    {completionPercentage >= 80 ? (
                        <span className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Response is well-developed
                        </span>
                    ) : (
                        <span className="flex items-center text-yellow-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Consider adding more detail
                        </span>
                    )}
                </p>
            </div>

            {/* Content Statistics */}
            <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{stats.totalBlocks}</div>
                    <div className="text-xs text-blue-700">Total Blocks</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{stats.totalWords}</div>
                    <div className="text-xs text-green-700">Total Words</div>
                </div>
            </div>

            {/* Block Type Breakdown */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800">Content Breakdown:</h4>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span className="flex items-center"><Hash className="w-3 h-3 mr-1" />Headers</span>
                        <span>{stats.h1Count + stats.h2Count + stats.h3Count}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="flex items-center"><Type className="w-3 h-3 mr-1" />Content Blocks</span>
                        <span>{stats.textCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="flex items-center"><FormInput className="w-3 h-3 mr-1" />Forms</span>
                        <span>{stats.formCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ResponseEditor({ 
    blocks, 
    onBlocksUpdate,
    rfqNumber = "Current RFQ",
    companyName = "Your Company",
    confidenceScore = 85
}: ResponseEditorProps) {
    const [activeTab, setActiveTab] = useState('editor');

    const handleNavigateToBlock = (blockId: string) => {
        // Switch to editor tab and scroll to block
        setActiveTab('editor');
        setTimeout(() => {
            const element = document.getElementById(`block-${blockId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    return (
        <div className="space-y-4">
            {/* Compact Header */}
            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                        <h1 className="text-lg font-semibold text-blue-900">
                            Response Editor
                        </h1>
                        <p className="text-sm text-blue-700">
                            {rfqNumber} • {companyName} • Hierarchical content structure
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {confidenceScore}% Confidence
                </Badge>
            </div>

            {/* Enhanced Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="editor" className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Editor</span>
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>Structure</span>
                    </TabsTrigger>
                    <TabsTrigger value="navigation" className="flex items-center space-x-2">
                        <List className="w-4 h-4" />
                        <span>Navigation</span>
                    </TabsTrigger>
                </TabsList>

                {/* Editor Tab */}
                <TabsContent value="editor" className="space-y-3">
                    <div className="text-xs text-gray-600 px-3 py-2 bg-gray-50 rounded border-l-2 border-blue-400">
                        <span className="font-medium">💡 Notion-style editing:</span> Click to edit • Arrow buttons to reorder • Expand/collapse sections
                    </div>
                    
                    <HierarchicalBlockEditor 
                        blocks={blocks}
                        onBlocksChange={onBlocksUpdate}
                        rfqNumber={rfqNumber}
                        companyName={companyName}
                        confidenceScore={confidenceScore}
                    />
                </TabsContent>

                {/* Structure Tab */}
                <TabsContent value="structure" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Content Analysis & Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StructureOverview blocks={blocks} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Navigation Tab */}
                <TabsContent value="navigation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Content Navigation</CardTitle>
                            <p className="text-sm text-gray-600">
                                Click any section to navigate directly to it in the editor
                            </p>
                        </CardHeader>
                        <CardContent>
                            <TableOfContents 
                                blocks={blocks} 
                                onNavigate={handleNavigateToBlock}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 