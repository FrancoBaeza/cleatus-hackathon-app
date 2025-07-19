'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Target, 
  PenTool, 
  CheckCircle2, 
  Clock, 
  Zap,
  AlertCircle 
} from 'lucide-react';
import { AgentProgress as AgentProgressType, AgentState } from '@/lib/types';

interface AgentProgressProps {
  progress: AgentProgressType;
  isGenerating: boolean;
}

const agentIcons = {
  analyzer: Search,
  strategist: Target,
  writer: PenTool,
  reviewer: CheckCircle2,
};

const getStateIcon = (state: AgentState) => {
  switch (state) {
    case 'working':
      return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getStateBadge = (state: AgentState) => {
  switch (state) {
    case 'working':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Working...</Badge>;
    case 'completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Done</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

const calculateOverallProgress = (progress: AgentProgressType): number => {
  const agents = ['analyzer', 'strategist', 'writer', 'reviewer'] as const;
  const completedCount = agents.filter(agent => progress[agent].state === 'completed').length;
  return (completedCount / agents.length) * 100;
};

export default function AgentProgress({ progress, isGenerating }: AgentProgressProps) {
  const overallProgress = calculateOverallProgress(progress);
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Multi-Agent Processing</CardTitle>
          <Badge variant={isGenerating ? "secondary" : "outline"} className="text-sm">
            {isGenerating ? "⚡ Generating..." : "Ready"}
          </Badge>
        </div>
        <Progress value={overallProgress} className="w-full h-2" />
        <p className="text-sm text-gray-600">
          {overallProgress === 100 ? "All agents completed!" : `Progress: ${Math.round(overallProgress)}%`}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(Object.entries(progress) as Array<[keyof AgentProgressType, AgentProgressType[keyof AgentProgressType]]>).map(([agentName, agentData], index) => {
          const Icon = agentIcons[agentName];
          const agentTitles = {
            analyzer: 'Agent 1: Analyzer',
            strategist: 'Agent 2: Strategist', 
            writer: 'Agent 3: Writer',
            reviewer: 'Agent 4: Reviewer'
          };
          
          return (
            <div 
              key={agentName} 
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-500 ${
                agentData.state === 'working' 
                  ? 'border-yellow-300 bg-yellow-50 shadow-md' 
                  : agentData.state === 'completed'
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  agentData.state === 'working' 
                    ? 'bg-yellow-200' 
                    : agentData.state === 'completed'
                    ? 'bg-green-200'
                    : 'bg-gray-200'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    agentData.state === 'working' 
                      ? 'text-yellow-700' 
                      : agentData.state === 'completed'
                      ? 'text-green-700'
                      : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm">{agentTitles[agentName]}</h3>
                    {getStateIcon(agentData.state)}
                    {getStateBadge(agentData.state)}
                  </div>
                  <p className={`text-sm mt-1 ${
                    agentData.state === 'working' ? 'text-yellow-700 font-medium' : 'text-gray-600'
                  }`}>
                    {agentData.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {overallProgress === 100 && (
          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Proposal Generation Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All agents have completed their tasks. Your proposal is ready for review.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 