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
import ExportAndSubmitButtons from './ExportAndSubmitButtons';
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">📊 Data</TabsTrigger>
            <TabsTrigger value="technical">⚙️ Technical</TabsTrigger>
            <TabsTrigger value="analysis">🔍 Analysis</TabsTrigger>
            <TabsTrigger value="strategy">🎯 Strategy</TabsTrigger>
            <TabsTrigger value="proposal">✍️ Proposal</TabsTrigger>
            <TabsTrigger value="contacts">📧 Contacts</TabsTrigger>
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
            
            {/* Export and Submit Buttons */}
            {proposal && (
              <ExportAndSubmitButtons
                blocks={proposal.responseBlocks}
                contactInfo={dataAnalysis?.complianceRequirements?.contactInformation}
                rfqNumber={dataAnalysis?.contractInfo?.type || 'Current RFQ'}
                companyName="Your Company"
              />
            )}
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
          
          <TabsContent value="technical" className="space-y-4">
            {dataAnalysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataAnalysis.technicalRequirements?.specifications?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Technical Specifications</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.technicalRequirements.specifications.map((spec, index) => (
                              <li key={index} className="text-sm">{spec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dataAnalysis.technicalRequirements?.qualityStandards?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Quality Standards</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.technicalRequirements.qualityStandards.map((standard, index) => (
                              <li key={index} className="text-sm">{standard}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dataAnalysis.technicalRequirements?.deliveryRequirements?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Delivery Requirements</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.technicalRequirements.deliveryRequirements.map((req, index) => (
                              <li key={index} className="text-sm">{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dataAnalysis.technicalRequirements?.warrantyRequirements?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Warranty Requirements</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.technicalRequirements.warrantyRequirements.map((warranty, index) => (
                              <li key={index} className="text-sm">{warranty}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing and Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataAnalysis.pricingAndTerms?.paymentTerms?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Payment Terms</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.pricingAndTerms.paymentTerms.map((term, index) => (
                              <li key={index} className="text-sm">{term}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dataAnalysis.pricingAndTerms?.deliveryTimeline?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Delivery Timeline</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.pricingAndTerms.deliveryTimeline.map((timeline, index) => (
                              <li key={index} className="text-sm">{timeline}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dataAnalysis.pricingAndTerms?.warrantyTerms?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Warranty Terms</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {dataAnalysis.pricingAndTerms.warrantyTerms.map((warranty, index) => (
                              <li key={index} className="text-sm">{warranty}</li>
                            ))}
                          </ul>
                        </div>
                      )}
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
          
          <TabsContent value="contacts" className="space-y-4">
            {dataAnalysis?.complianceRequirements?.contactInformation && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span>Submission Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Contact */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2">
                          Primary Contact
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Name:</span>
                            <span>{dataAnalysis.complianceRequirements.contactInformation.primaryContact.name}</span>
                          </div>
                          {dataAnalysis.complianceRequirements.contactInformation.primaryContact.title && (
                            <div className="flex justify-between">
                              <span className="font-medium">Title:</span>
                              <span>{dataAnalysis.complianceRequirements.contactInformation.primaryContact.title}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="font-medium">Email:</span>
                            <span className="text-blue-600 font-mono">{dataAnalysis.complianceRequirements.contactInformation.primaryContact.email}</span>
                          </div>
                          {dataAnalysis.complianceRequirements.contactInformation.primaryContact.phone && (
                            <div className="flex justify-between">
                              <span className="font-medium">Phone:</span>
                              <span>{dataAnalysis.complianceRequirements.contactInformation.primaryContact.phone}</span>
                            </div>
                          )}
                          {dataAnalysis.complianceRequirements.contactInformation.primaryContact.fax && (
                            <div className="flex justify-between">
                              <span className="font-medium">Fax:</span>
                              <span>{dataAnalysis.complianceRequirements.contactInformation.primaryContact.fax}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Secondary Contact */}
                      {dataAnalysis.complianceRequirements.contactInformation.secondaryContact && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2">
                            Secondary Contact
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Name:</span>
                              <span>{dataAnalysis.complianceRequirements.contactInformation.secondaryContact.name}</span>
                            </div>
                            {dataAnalysis.complianceRequirements.contactInformation.secondaryContact.title && (
                              <div className="flex justify-between">
                                <span className="font-medium">Title:</span>
                                <span>{dataAnalysis.complianceRequirements.contactInformation.secondaryContact.title}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="font-medium">Email:</span>
                              <span className="text-blue-600 font-mono">{dataAnalysis.complianceRequirements.contactInformation.secondaryContact.email}</span>
                            </div>
                            {dataAnalysis.complianceRequirements.contactInformation.secondaryContact.phone && (
                              <div className="flex justify-between">
                                <span className="font-medium">Phone:</span>
                                <span>{dataAnalysis.complianceRequirements.contactInformation.secondaryContact.phone}</span>
                              </div>
                            )}
                            {dataAnalysis.complianceRequirements.contactInformation.secondaryContact.fax && (
                              <div className="flex justify-between">
                                <span className="font-medium">Fax:</span>
                                <span>{dataAnalysis.complianceRequirements.contactInformation.secondaryContact.fax}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submission Information */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-3">
                          Submission Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Submission Emails:</span>
                            <div className="mt-1 space-y-1">
                              {dataAnalysis.complianceRequirements.contactInformation.submissionEmail.map((email, index) => (
                                <div key={index} className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                                  {email}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Submission Instructions:</span>
                            <p className="mt-1 text-gray-700 bg-gray-50 px-3 py-2 rounded">
                              {dataAnalysis.complianceRequirements.contactInformation.submissionInstructions}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Office Address */}
                      {dataAnalysis.complianceRequirements.contactInformation.officeAddress && (
                        <div>
                          <h4 className="font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-3">
                            Contracting Office Address
                          </h4>
                          <div className="text-sm bg-gray-50 px-3 py-2 rounded">
                            {dataAnalysis.complianceRequirements.contactInformation.officeAddress.street && (
                              <div>{dataAnalysis.complianceRequirements.contactInformation.officeAddress.street}</div>
                            )}
                            <div>
                              {dataAnalysis.complianceRequirements.contactInformation.officeAddress.city}, {' '}
                              {dataAnalysis.complianceRequirements.contactInformation.officeAddress.state} {' '}
                              {dataAnalysis.complianceRequirements.contactInformation.officeAddress.zipCode}
                            </div>
                            <div>{dataAnalysis.complianceRequirements.contactInformation.officeAddress.country}</div>
                          </div>
                        </div>
                      )}
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