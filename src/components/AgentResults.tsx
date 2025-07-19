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
  ReviewOutput 
} from '@/lib/types';
import { Button } from '@/components/ui/button';

interface AgentResultsProps {
  analysis?: AnalysisOutput;
  strategy?: StrategyOutput;
  proposal?: ProposalOutput;
  review?: ReviewOutput;
}

export default function AgentResults({ analysis, strategy, proposal, review }: AgentResultsProps) {
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
            <TabsTrigger value="analysis">🔍 Analysis</TabsTrigger>
            <TabsTrigger value="strategy">🎯 Strategy</TabsTrigger>
            <TabsTrigger value="proposal">✍️ Proposal</TabsTrigger>
            <TabsTrigger value="review">✅ Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              
              {review && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">Review</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{review.finalScore}%</p>
                    <p className="text-sm text-gray-600">Confidence Score</p>
                  </CardContent>
                </Card>
              )}
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
          
          <TabsContent value="review" className="space-y-4">
            {review && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Submission Package</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {review.finalScore}% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Email Template</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <pre className="whitespace-pre-wrap font-mono">{review.submissionPackage.emailTemplate}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Submission Checklist</h4>
                        <div className="space-y-1">
                          {review.submissionPackage.submissionChecklist.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 