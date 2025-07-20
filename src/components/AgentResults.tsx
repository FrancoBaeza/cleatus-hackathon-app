'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Target, 
  PenTool, 
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Download,
  Mail
} from 'lucide-react';
import { 
  AnalysisOutput, 
  StrategyOutput, 
  ProposalOutput, 
  ReviewOutput,
  DataAnalysisOutput 
} from '@/lib/types';
import { Button } from '@/components/ui/button';

interface AgentResultsProps {
    dataAnalysis?: DataAnalysisOutput;
    analysis?: AnalysisOutput;
    strategy?: StrategyOutput;
    proposal?: ProposalOutput;
    review?: ReviewOutput | undefined;
}

export default function AgentResults({ dataAnalysis, analysis, strategy, proposal, review }: AgentResultsProps) {
  if (!analysis && !strategy && !proposal && !review) {
    return null;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <span>Proposal Generated Successfully</span>
        </CardTitle>
        <p className="text-gray-600">
          Review the insights and outputs from each specialized agent below.
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">📊 Data</TabsTrigger>
            <TabsTrigger value="analysis">🔍 Analysis</TabsTrigger>
            <TabsTrigger value="strategy">🎯 Strategy</TabsTrigger>
            <TabsTrigger value="proposal">✍️ Proposal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quick Stats */}
              {analysis && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Analysis</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{analysis.gaps.length}</p>
                    <p className="text-sm text-gray-600">Gaps Identified</p>
                  </CardContent>
                </Card>
              )}
              
              {strategy && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold">Strategy</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{strategy.winProbability}%</p>
                    <p className="text-sm text-gray-600">Win Probability</p>
                  </CardContent>
                </Card>
              )}
              
              {proposal && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <PenTool className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold">Proposal</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{proposal.submissionForms.length}</p>
                    <p className="text-sm text-gray-600">Forms Generated</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Review card removed - using 3-agent system */}
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download Package</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Preview Email</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            {dataAnalysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Type & Scope</h4>
                        <p className="text-sm"><strong>Type:</strong> {dataAnalysis.contractInfo.type}</p>
                        <p className="text-sm"><strong>Scope:</strong> {dataAnalysis.contractInfo.scope}</p>
                        <p className="text-sm"><strong>Set-Aside:</strong> {dataAnalysis.contractInfo.setAsideType || 'None'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Timeline & Locations</h4>
                        <p className="text-sm"><strong>Timeline:</strong> {dataAnalysis.contractInfo.timeline}</p>
                        <p className="text-sm"><strong>Locations:</strong> {dataAnalysis.contractInfo.locations.join(', ')}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Key Requirements</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {dataAnalysis.contractInfo.keyRequirements.map((req, index) => (
                          <li key={index} className="text-sm">{req}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Gap Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">NAICS Alignment</h4>
                        <p className="text-sm">
                          <strong>Required:</strong> {dataAnalysis.gapAnalysis.naicsAlignment.required} | 
                          <strong> Entity:</strong> {dataAnalysis.gapAnalysis.naicsAlignment.entityPrimary} | 
                          <strong> Match:</strong> {dataAnalysis.gapAnalysis.naicsAlignment.isMatch ? '✅ Yes' : '❌ No'}
                        </p>
                        {!dataAnalysis.gapAnalysis.naicsAlignment.isMatch && (
                          <p className="text-sm mt-2 text-orange-600">
                            <strong>Approach:</strong> {dataAnalysis.gapAnalysis.naicsAlignment.complianceApproach}
                          </p>
                        )}
                      </div>
                      
                      {dataAnalysis.gapAnalysis.riskFactors.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Risk Factors</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.gapAnalysis.riskFactors.map((risk, index) => (
                              <li key={index} className="text-sm text-red-600">{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opportunity Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Win Probability: {dataAnalysis.opportunityAssessment.estimatedWinProbability}%</h4>
                        <p className="text-sm"><strong>Value Proposition:</strong> {dataAnalysis.opportunityAssessment.valueProposition}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Win Factors</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {dataAnalysis.opportunityAssessment.winFactors.map((factor, index) => (
                            <li key={index} className="text-sm text-green-600">{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            {analysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>Critical Gaps Identified</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.gaps.map((gap, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="destructive" className="text-xs">Gap {index + 1}</Badge>
                          <span className="text-sm">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span>Opportunities</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Opportunity {index + 1}
                          </Badge>
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="strategy" className="space-y-4">
            {strategy && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Strategic Positioning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{strategy.positioning}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Gap Mitigation Strategy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{strategy.gapMitigation}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Value Propositions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {strategy.valuePropositions.map((prop, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">VP {index + 1}</Badge>
                          <span className="text-sm">{prop}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="proposal" className="space-y-4">
            {proposal && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{proposal.companyInfo}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{proposal.technicalResponse}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* REVIEW AGENT REMOVED - Using 3-agent system for better consistency */}
        </Tabs>
      </CardContent>
    </Card>
  );
} 