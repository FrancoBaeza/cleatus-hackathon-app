'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    GripVertical,
    Edit3,
    Save,
    X,
    ChevronUp,
    ChevronDown,
    ChevronRight,
    ChevronDown as ExpandIcon,
    FileText,
    Hash,
    Type,
    FormInput,
    Download,
    Mail,
    Minus,
    Plus,
} from 'lucide-react';
import { ResponseBlock, FormField, BlockType, flattenBlocks } from '@/lib/types';

interface HierarchicalBlockEditorProps {
    blocks: ResponseBlock[];
    onBlocksChange: (blocks: ResponseBlock[]) => void;
    rfqNumber: string;
    companyName: string;
    confidenceScore: number;
}

interface HierarchicalBlockProps {
    block: ResponseBlock;
    depth: number;
    isExpanded: boolean;
    isEditing: boolean;
    editingData: { text: string; formFields: FormField[] };
    onStartEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditingDataChange: (data: { text: string; formFields: FormField[] }) => void;
    onToggleExpand: () => void;
    onMove: (blockId: string, direction: 'up' | 'down') => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

// Get icon for block type with size based on hierarchy
const getBlockIcon = (type: BlockType, depth: number = 0) => {
    const sizeClass = depth === 0 ? 'w-5 h-5' : depth === 1 ? 'w-4 h-4' : 'w-3 h-3';
    
    switch (type) {
        case 'H1':
            return <Hash className={sizeClass} />;
        case 'H2':
            return <Hash className={sizeClass} />;
        case 'H3':
            return <Hash className={sizeClass} />;
        case 'Text':
            return <Type className={sizeClass} />;
        case 'Form':
            return <FormInput className={sizeClass} />;
        default:
            return <FileText className={sizeClass} />;
    }
};

// Get Notion-style text styling with distinct colors for headings
const getNotionTextStyle = (type: BlockType) => {
    switch (type) {
        case 'H1':
            return 'text-2xl font-bold text-indigo-900 py-2';
        case 'H2':
            return 'text-xl font-semibold text-blue-800 py-1';
        case 'H3':
            return 'text-lg font-medium text-cyan-700 py-1';
        case 'Text':
            return 'text-sm text-gray-700';
        case 'Form':
            return 'text-sm font-medium text-emerald-700';
        default:
            return 'text-sm text-gray-700';
    }
};

// Get border colors for different heading levels
const getHeadingBorderColor = (type: BlockType) => {
    switch (type) {
        case 'H1':
            return 'border-l-indigo-500';
        case 'H2':
            return 'border-l-blue-500';
        case 'H3':
            return 'border-l-cyan-500';
        case 'Form':
            return 'border-l-emerald-500';
        default:
            return 'border-l-gray-300';
    }
};

// Form field editor component for forms
const FormFieldEditor = ({
    fields,
    onChange,
}: {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}) => {
    const updateField = (index: number, field: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...field };
        onChange(newFields);
    };

    return (
        <div className="space-y-3">
            {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                            placeholder="Field Label"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                        />
                        <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
                            className="px-3 py-2 border rounded-md"
                        >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                        </select>
                    </div>
                    <Input
                        placeholder="Current Value"
                        value={field.value}
                        onChange={(e) => updateField(index, { value: e.target.value })}
                    />
                </div>
            ))}
        </div>
    );
};

// Individual hierarchical block component - Notion-style minimal design
const HierarchicalBlock: React.FC<HierarchicalBlockProps> = ({
    block,
    depth,
    isExpanded,
    isEditing,
    editingData,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onEditingDataChange,
    onToggleExpand,
    onMove,
    canMoveUp,
    canMoveDown,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const hasChildren = block.children && block.children.length > 0;
    const isHeader = ['H1', 'H2', 'H3'].includes(block.type);
    
    // Calculate indentation based on depth
    const indentationStyle = {
        paddingLeft: `${depth * 16 + 8}px`,
    };

    const handleSave = () => {
        onSaveEdit();
    };

    const handleCancel = () => {
        onCancelEdit();
    };

    const handleTextChange = (newText: string) => {
        onEditingDataChange({
            ...editingData,
            text: newText,
        });
    };

    const handleFormFieldsChange = (newFields: FormField[]) => {
        onEditingDataChange({
            ...editingData,
            formFields: newFields,
        });
    };

    return (
        <div 
            style={indentationStyle} 
            className={`
                group py-1 px-2 rounded-md transition-all duration-150 hover:bg-gray-50 
                ${isHeader || block.type === 'Form' ? `border-l-2 ${getHeadingBorderColor(block.type)}` : ''}
                ${isEditing ? 'bg-blue-50' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start space-x-2">
                {/* Expand/Collapse button for headers with children */}
                <div className="flex-shrink-0 w-6 flex justify-center pt-1">
                    {hasChildren ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleExpand}
                            className="p-0 h-4 w-4 hover:bg-gray-200 rounded"
                        >
                            {isExpanded ? (
                                <ExpandIcon className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </Button>
                    ) : (
                        <div className="w-4 h-4"></div>
                    )}
                </div>

                {/* Main content area */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-2">
                            {block.type === 'Form' ? (
                                <div>
                                    <Input
                                        placeholder="Form Title"
                                        value={editingData.text}
                                        onChange={(e) => handleTextChange(e.target.value)}
                                        className="mb-2 text-sm"
                                    />
                                    <FormFieldEditor
                                        fields={editingData.formFields}
                                        onChange={handleFormFieldsChange}
                                    />
                                </div>
                            ) : (
                                <Textarea
                                    placeholder="Type something..."
                                    value={editingData.text}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    rows={block.type === 'Text' ? 4 : 1}
                                    className="resize-none border-0 shadow-none focus:ring-1 focus:ring-blue-300 text-sm leading-relaxed"
                                />
                            )}
                            <div className="flex space-x-2">
                                <Button size="sm" onClick={handleSave} className="h-6 text-xs">
                                    Save
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleCancel} className="h-6 text-xs">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="cursor-text py-1"
                            onClick={onStartEdit}
                        >
                            {block.type === 'Form' ? (
                                <div>
                                    <p className={`font-medium ${getNotionTextStyle(block.type)}`}>
                                        {block.text}
                                    </p>
                                    {block.metadata?.formFields && block.metadata.formFields.length > 0 ? (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {block.metadata.formFields.length} fields configured
                                        </div>
                                    ) : (
                                        <div className="text-xs text-yellow-600 italic mt-1">
                                            No fields configured
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`${getNotionTextStyle(block.type)} leading-relaxed`}>
                                    {block.text && block.text.trim() ? (
                                        <div className="whitespace-pre-wrap">{block.text}</div>
                                    ) : (
                                        <div className="text-gray-400 italic text-sm">
                                            {block.type === 'Text' ? 'Empty' : 'Untitled'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action buttons - show on hover */}
                <div className={`flex-shrink-0 flex items-center space-x-1 transition-opacity duration-150 ${isHovered || isEditing ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Block type indicator */}
                    <div className="text-xs text-gray-400 font-mono">
                        {block.type}
                    </div>
                    
                    {/* Move buttons */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMove(block.id, 'up')}
                        disabled={!canMoveUp}
                        className="p-0 h-5 w-5 hover:bg-gray-200 rounded"
                        title="Move up"
                    >
                        <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMove(block.id, 'down')}
                        disabled={!canMoveDown}
                        className="p-0 h-5 w-5 hover:bg-gray-200 rounded"
                        title="Move down"
                    >
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                    
                    {/* Edit button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onStartEdit}
                        className="p-0 h-5 w-5 hover:bg-gray-200 rounded"
                        title="Edit"
                    >
                        <Edit3 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Main hierarchical block editor component
export default function HierarchicalBlockEditor({
    blocks,
    onBlocksChange,
    rfqNumber,
    companyName,
    confidenceScore,
}: HierarchicalBlockEditorProps) {
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<{
        text: string;
        formFields: FormField[];
    }>({ text: '', formFields: [] });

    // Initialize all sections as expanded
    useState(() => {
        const allIds = new Set(flattenBlocks(blocks).map(b => b.id));
        setExpandedBlocks(allIds);
        
        // Debug logging for hierarchical structure
        console.log('🎯 HierarchicalBlockEditor received blocks:', blocks.length);
        blocks.forEach((block, i) => {
            console.log(`Block ${i}: ${block.type} - "${block.text?.substring(0, 30)}..." - Children: ${block.children?.length || 0}`);
            if (block.children) {
                block.children.forEach((child, j) => {
                    console.log(`  Child ${j}: ${child.type} - "${child.text?.substring(0, 30)}..." - Children: ${child.children?.length || 0}`);
                });
            }
        });
    });

    const toggleExpanded = (blockId: string) => {
        const newExpanded = new Set(expandedBlocks);
        if (newExpanded.has(blockId)) {
            newExpanded.delete(blockId);
        } else {
            newExpanded.add(blockId);
        }
        setExpandedBlocks(newExpanded);
    };

    const updateBlock = (updatedBlock: ResponseBlock) => {
        const updateInHierarchy = (blocks: ResponseBlock[]): ResponseBlock[] => {
            return blocks.map(block => {
                if (block.id === updatedBlock.id) {
                    return updatedBlock;
                }
                if (block.children) {
                    return {
                        ...block,
                        children: updateInHierarchy(block.children),
                    };
                }
                return block;
            });
        };

        onBlocksChange(updateInHierarchy(blocks));
    };

    // Auto-save current editing block and switch to new one
    const handleStartEditing = (block: ResponseBlock) => {
        // If we're already editing a different block, save it first
        if (editingBlockId && editingBlockId !== block.id) {
            const currentBlock = findBlockById(blocks, editingBlockId);
            if (currentBlock) {
                const updatedBlock: ResponseBlock = {
                    ...currentBlock,
                    text: editingData.text,
                    metadata: currentBlock.type === 'Form' 
                        ? { ...currentBlock.metadata, formFields: editingData.formFields }
                        : currentBlock.metadata,
                };
                updateBlock(updatedBlock);
            }
        }

        // Start editing the new block
        setEditingBlockId(block.id);
        setEditingData({
            text: block.text,
            formFields: block.metadata?.formFields || [],
        });
    };

    // Save and stop editing
    const handleSaveEditing = () => {
        if (!editingBlockId) return;
        
        const currentBlock = findBlockById(blocks, editingBlockId);
        if (currentBlock) {
            const updatedBlock: ResponseBlock = {
                ...currentBlock,
                text: editingData.text,
                metadata: currentBlock.type === 'Form' 
                    ? { ...currentBlock.metadata, formFields: editingData.formFields }
                    : currentBlock.metadata,
            };
            updateBlock(updatedBlock);
        }
        
        setEditingBlockId(null);
        setEditingData({ text: '', formFields: [] });
    };

    // Cancel editing without saving
    const handleCancelEditing = () => {
        setEditingBlockId(null);
        setEditingData({ text: '', formFields: [] });
    };

    // Helper function to find block by ID
    const findBlockById = (blocks: ResponseBlock[], id: string): ResponseBlock | null => {
        for (const block of blocks) {
            if (block.id === id) return block;
            if (block.children) {
                const found = findBlockById(block.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const moveBlock = (blockId: string, direction: 'up' | 'down') => {
        const moveInHierarchy = (blocks: ResponseBlock[], targetId: string, direction: 'up' | 'down'): ResponseBlock[] => {
            // First try to move at current level
            for (let i = 0; i < blocks.length; i++) {
                if (blocks[i].id === targetId) {
                    const newBlocks = [...blocks];
                    if (direction === 'up' && i > 0) {
                        // Swap with previous element
                        [newBlocks[i], newBlocks[i - 1]] = [newBlocks[i - 1], newBlocks[i]];
                        return newBlocks;
                    } else if (direction === 'down' && i < blocks.length - 1) {
                        // Swap with next element
                        [newBlocks[i], newBlocks[i + 1]] = [newBlocks[i + 1], newBlocks[i]];
                        return newBlocks;
                    }
                    return blocks; // Cannot move
                }
            }
            
            // If not found at current level, recursively search children
            return blocks.map(block => {
                if (block.children && block.children.length > 0) {
                    const updatedChildren = moveInHierarchy(block.children, targetId, direction);
                    if (updatedChildren !== block.children) {
                        return { ...block, children: updatedChildren };
                    }
                }
                return block;
            });
        };

        const updatedBlocks = moveInHierarchy(blocks, blockId, direction);
        if (updatedBlocks !== blocks) {
            onBlocksChange(updatedBlocks);
        }
    };

    const renderHierarchicalBlocks = (
        blockList: ResponseBlock[],
        currentDepth: number = 0
    ): React.ReactNode[] => {
        return blockList.map((block, index) => {
            const isExpanded = expandedBlocks.has(block.id);
            const hasChildren = block.children && block.children.length > 0;

            return (
                <div key={`block-container-${block.id}`} id={`block-${block.id}`}>
                    <HierarchicalBlock
                        key={`hierarchical-block-${block.id}`}
                        block={block}
                        depth={currentDepth}
                        isExpanded={isExpanded}
                        isEditing={editingBlockId === block.id}
                        editingData={editingData}
                        onStartEdit={() => handleStartEditing(block)}
                        onSaveEdit={handleSaveEditing}
                        onCancelEdit={handleCancelEditing}
                        onEditingDataChange={setEditingData}
                        onToggleExpand={() => toggleExpanded(block.id)}
                        onMove={moveBlock}
                        canMoveUp={index > 0}
                        canMoveDown={index < blockList.length - 1}
                    />
                    
                    {/* Render children if expanded */}
                    {hasChildren && isExpanded && (
                        <div key={`children-container-${block.id}`}>
                            {renderHierarchicalBlocks(block.children!, currentDepth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // Generate export functions
    const exportToWord = () => {
        const content = flattenBlocks(blocks).map(block => {
            const prefix = '  '.repeat(block.depth || 0);
            return `${prefix}${block.type}: ${block.text}`;
        }).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rfqNumber}-response.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportEmailTemplate = () => {
        const textBlocks = flattenBlocks(blocks).filter(b => b.type === 'Text');
        const emailContent = `Subject: Response to ${rfqNumber}

Dear Contracting Officer,

Please find our response to ${rfqNumber} attached.

${textBlocks.slice(0, 2).map(b => b.text).join('\n\n')}

Thank you for your consideration.

Best regards,
${companyName}`;

        const blob = new Blob([emailContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${rfqNumber}-email-template.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalBlocks = flattenBlocks(blocks).length;
    const formBlocks = flattenBlocks(blocks).filter(b => b.type === 'Form').length;

    return (
        <div className="space-y-4">
            {/* Compact Header */}
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border">
                <div>
                    <h2 className="font-semibold text-gray-900">
                        Editor
                    </h2>
                    <p className="text-xs text-gray-600">
                        {rfqNumber} • {totalBlocks} blocks • {formBlocks} forms • {confidenceScore}% confidence
                    </p>
                </div>
                <div className="flex space-x-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToWord}
                        className="flex items-center space-x-1 h-7 px-2"
                    >
                        <Download className="w-3 h-3" />
                        <span className="text-xs">Export</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportEmailTemplate}
                        className="flex items-center space-x-1 h-7 px-2"
                    >
                        <Mail className="w-3 h-3" />
                        <span className="text-xs">Email</span>
                    </Button>
                </div>
            </div>

            {/* Hierarchical blocks - Notion-style minimal design */}
            <div className="border rounded-lg bg-white">
                {blocks && blocks.length > 0 ? (
                    <div className="p-2">
                        {renderHierarchicalBlocks(blocks)}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <h3 className="font-medium mb-1">No Content Generated</h3>
                        <p className="text-sm">
                            Generate your RFQ response to see the hierarchical content here.
                        </p>
                    </div>
                )}
            </div>

            {/* Minimal Footer */}
            <div className="text-xs text-gray-500 text-center py-2">
                Click any section to edit • Drag arrows to reorder • Expand/collapse with arrows
            </div>
        </div>
    );
} 