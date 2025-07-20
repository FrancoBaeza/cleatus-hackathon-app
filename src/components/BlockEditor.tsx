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
    FileText,
    Hash,
    Type,
    FormInput,
    Download,
    Mail,
} from 'lucide-react';
import { ResponseBlock, FormField, BlockType } from '@/lib/types';

interface BlockEditorProps {
    blocks: ResponseBlock[];
    onBlocksChange: (blocks: ResponseBlock[]) => void;
    rfqNumber: string;
    companyName: string;
    confidenceScore: number;
}

interface EditableBlockProps {
    block: ResponseBlock;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (updatedBlock: ResponseBlock) => void;
    onCancel: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

// Get icon for block type
const getBlockIcon = (type: BlockType) => {
    switch (type) {
        case 'H1':
            return <Hash className="w-4 h-4" />;
        case 'H2':
            return <Hash className="w-3 h-3" />;
        case 'H3':
            return <Hash className="w-2 h-2" />;
        case 'Text':
            return <Type className="w-4 h-4" />;
        case 'Form':
            return <FormInput className="w-4 h-4" />;
        default:
            return <FileText className="w-4 h-4" />;
    }
};

// Form field editor component
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
                <div
                    key={field.id}
                    className="p-3 border rounded-lg bg-gray-50"
                >
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                            placeholder="Field Label"
                            value={field.label}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => updateField(index, { label: e.target.value })}
                        />
                        <select
                            className="px-3 py-2 border rounded-md"
                            value={field.type}
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                            ) =>
                                updateField(index, {
                                    type: e.target.value as any,
                                })
                            }
                        >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="Default Value"
                            value={field.value}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => updateField(index, { value: e.target.value })}
                        />
                        <Input
                            placeholder="Placeholder"
                            value={field.placeholder || ''}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) =>
                                updateField(index, {
                                    placeholder: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Individual editable block component
const EditableBlock = ({
    block,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: EditableBlockProps) => {
    const [editedBlock, setEditedBlock] = useState<ResponseBlock>(block);

    const handleSave = () => {
        onSave(editedBlock);
    };

    const handleFormFieldsChange = (fields: FormField[]) => {
        setEditedBlock({
            ...editedBlock,
            metadata: {
                ...editedBlock.metadata,
                formFields: fields,
            },
        });
    };

    const renderBlockContent = () => {
        if (isEditing) {
            return (
                <div className="space-y-4">
                    <Input
                        placeholder="Block Title"
                        value={editedBlock.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditedBlock({
                                ...editedBlock,
                                title: e.target.value,
                            })
                        }
                    />

                    {block.type === 'Form' &&
                    editedBlock.metadata?.formFields ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Form Fields:
                            </label>
                            <FormFieldEditor
                                fields={editedBlock.metadata.formFields}
                                onChange={handleFormFieldsChange}
                            />
                        </div>
                    ) : (
                        <Textarea
                            placeholder="Block Content"
                            value={editedBlock.content}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>,
                            ) =>
                                setEditedBlock({
                                    ...editedBlock,
                                    content: e.target.value,
                                })
                            }
                            rows={6}
                        />
                    )}

                    <div className="flex space-x-2">
                        <Button onClick={handleSave} size="sm">
                            <Save className="w-4 h-4 mr-1" />
                            Save
                        </Button>
                        <Button onClick={onCancel} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                        </Button>
                    </div>
                </div>
            );
        }

        if (block.type === 'Form' && block.metadata?.formFields) {
            return (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">{block.content}</p>
                    <div className="grid gap-3">
                        {block.metadata.formFields.map((field) => (
                            <div key={field.id} className="flex flex-col">
                                <label className="text-sm font-medium mb-1">
                                    {field.label}
                                    {field.required && (
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    )}
                                </label>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        placeholder={field.placeholder}
                                        value={field.value}
                                        readOnly
                                        rows={3}
                                    />
                                ) : (
                                    <Input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        value={field.value}
                                        readOnly
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{block.content}</div>
            </div>
        );
    };

    const getBlockStyle = () => {
        switch (block.type) {
            case 'H1':
                return 'text-2xl font-bold';
            case 'H2':
                return 'text-xl font-semibold';
            case 'H3':
                return 'text-lg font-medium';
            default:
                return '';
        }
    };

    return (
        <Card
            className={`transition-all duration-200 ${
                isEditing ? 'ring-2 ring-blue-500' : ''
            }`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        {getBlockIcon(block.type)}
                        <Badge variant="outline" className="text-xs">
                            {block.type}
                        </Badge>
                        <span className={`${getBlockStyle()}`}>
                            {block.title}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1">
                        <Button
                            onClick={onMoveUp}
                            disabled={!canMoveUp}
                            variant="ghost"
                            size="sm"
                        >
                            <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={onMoveDown}
                            disabled={!canMoveDown}
                            variant="ghost"
                            size="sm"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={isEditing ? onCancel : onEdit}
                            variant="ghost"
                            size="sm"
                        >
                            {isEditing ? (
                                <X className="w-4 h-4" />
                            ) : (
                                <Edit3 className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>{renderBlockContent()}</CardContent>
        </Card>
    );
};

// Main block editor component
export default function BlockEditor({
    blocks,
    onBlocksChange,
    rfqNumber,
    companyName,
    confidenceScore,
}: BlockEditorProps) {
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

    const updateBlock = (blockId: string, updatedBlock: ResponseBlock) => {
        const newBlocks = blocks.map((block) =>
            block.id === blockId ? updatedBlock : block,
        );
        onBlocksChange(newBlocks);
        setEditingBlockId(null);
    };

    const moveBlock = (blockId: string, direction: 'up' | 'down') => {
        const blockIndex = blocks.findIndex((block) => block.id === blockId);
        if (blockIndex === -1) return;

        const newBlocks = [...blocks];
        const targetIndex =
            direction === 'up' ? blockIndex - 1 : blockIndex + 1;

        if (targetIndex < 0 || targetIndex >= blocks.length) return;

        // Swap blocks
        [newBlocks[blockIndex], newBlocks[targetIndex]] = [
            newBlocks[targetIndex],
            newBlocks[blockIndex],
        ];

        // Update order values
        newBlocks.forEach((block, index) => {
            block.order = index;
        });

        onBlocksChange(newBlocks);
    };

    const generateEmailSubmission = () => {
        const attachments = blocks
            .filter((block) => block.type === 'Form')
            .map((block) => block.title);

        return `To: parie.reynolds@us.af.mil; lance.watters.1@us.af.mil
            Subject: RFQ Response - ${rfqNumber} - ${companyName}

            Dear Ms. Reynolds and Mr. Watters,

            ${companyName} respectfully submits our response to RFQ ${rfqNumber} for Bleacher Seating Systems.

            Attached Documents:
            ${attachments.map((title) => `- ${title}`).join('\n')}

            Our response addresses all requirements and demonstrates our commitment to delivering exceptional service to the Air Force.

            Please confirm receipt and contact us with any questions.

            Respectfully,
            [Authorized Representative]
            ${companyName}

            Generated by CLEATUS AI Agent 2.0 - Confidence Score: ${confidenceScore}%`;
    };

    const exportResponse = () => {
        const responseContent = blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => {
                if (block.type === 'H1')
                    return `# ${block.title}\n\n${block.content}`;
                if (block.type === 'H2')
                    return `## ${block.title}\n\n${block.content}`;
                if (block.type === 'H3')
                    return `### ${block.title}\n\n${block.content}`;
                if (block.type === 'Form')
                    return `## ${block.title}\n\n[FORM: ${block.content}]`;
                return `${block.content}`;
            })
            .join('\n\n---\n\n');

        const blob = new Blob([responseContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RFQ_Response_${rfqNumber}_${companyName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">
                                RFQ Response Editor
                            </CardTitle>
                            <p className="text-gray-600 mt-1">
                                Edit your generated response blocks. Drag to
                                reorder, click edit to modify content.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                            >
                                {confidenceScore}% Ready
                            </Badge>
                            <Button
                                onClick={exportResponse}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
                            <Button
                                onClick={() => {
                                    const email = generateEmailSubmission();
                                    navigator.clipboard.writeText(email);
                                    alert(
                                        'Email template copied to clipboard!',
                                    );
                                }}
                                size="sm"
                            >
                                <Mail className="w-4 h-4 mr-1" />
                                Copy Email
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Blocks */}
            <div className="space-y-4">
                {blocks
                    .sort((a, b) => a.order - b.order)
                    .map((block, index) => (
                        <EditableBlock
                            key={block.id}
                            block={block}
                            isEditing={editingBlockId === block.id}
                            onEdit={() => setEditingBlockId(block.id)}
                            onSave={(updatedBlock) =>
                                updateBlock(block.id, updatedBlock)
                            }
                            onCancel={() => setEditingBlockId(null)}
                            onMoveUp={() => moveBlock(block.id, 'up')}
                            onMoveDown={() => moveBlock(block.id, 'down')}
                            canMoveUp={index > 0}
                            canMoveDown={index < blocks.length - 1}
                        />
                    ))}
            </div>

            {/* Summary */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">
                                {blocks.length}
                            </p>
                            <p className="text-sm text-gray-600">
                                Total Blocks
                            </p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {blocks.filter((b) => b.type === 'Form').length}
                            </p>
                            <p className="text-sm text-gray-600">Forms</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {
                                    blocks.filter((b) => b.type.startsWith('H'))
                                        .length
                                }
                            </p>
                            <p className="text-sm text-gray-600">Headings</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {confidenceScore}%
                            </p>
                            <p className="text-sm text-gray-600">Confidence</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
