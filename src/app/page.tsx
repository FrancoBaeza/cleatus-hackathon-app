'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Building2, FileText, Sparkles } from 'lucide-react';
import AgentProgress from '@/components/AgentProgress';
import AgentResults from '@/components/AgentResults';
import { 
  AgentProgress as AgentProgressType,
  AnalysisOutput,
  StrategyOutput, 
  ProposalOutput,
  ReviewOutput
} from '@/lib/types';

// Sample data (in real app this would come from API)
const sampleContract = {
  id: "contract_001",
  title: "Bleacher Seating Systems",
  solicitationNumber: "FA301625Q0050",
  agencyName: "DEPT OF THE AIR FORCE",
  naicsId: "337127",
  deadlineDate: "2025-07-21 21:00:00"
};

const sampleEntity = {
  id: "entity_001", 
  businessName: "GUNN CONSTRUCTION LLC",
  physicalAddress: "3533 COLUMBIA PIKE, ARLINGTON, VA",
  cageCode: "9HET5"
};

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentProgress, setAgentProgress] = useState<AgentProgressType>({
    analyzer: { state: 'pending', message: 'Waiting to start analysis...' },
    strategist: { state: 'pending', message: 'Waiting for analysis results...' },
    writer: { state: 'pending', message: 'Waiting for strategy...' },
    reviewer: { state: 'pending', message: 'Waiting for proposal draft...' }
  });
  
  const [results, setResults] = useState<{
    analysis?: AnalysisOutput;
    strategy?: StrategyOutput;
    proposal?: ProposalOutput;
    review?: ReviewOutput;
  }>({});

  const generateResponse = async () => {
    setIsGenerating(true);
    setResults({});
    
    // Reset progress
    setAgentProgress({
      analyzer: { state: 'working', message: 'Analyzing RFQ requirements and identifying gaps...' },
      strategist: { state: 'pending', message: 'Waiting for analysis results...' },
      writer: { state: 'pending', message: 'Waiting for strategy...' },
      reviewer: { state: 'pending', message: 'Waiting for proposal draft...' }
    });
    
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate the multi-agent process
      
      // Agent 1: Analyzer (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const analysisResult: AnalysisOutput = {
        requirements: [
          "8 bleacher seating systems required",
          "125-person capacity per system", 
          "Delivery to JBSA Lackland, TX",
          "SDVOSB certification required",
          "Compliance with NAICS 337127"
        ],
        gaps: [
          "NAICS mismatch: Company has 236220 (Construction) vs required 337127 (Manufacturing)",
          "Geographic challenge: Virginia-based company, Texas delivery location",
          "Specialization gap: General construction vs specialized bleacher manufacturing"
        ],
        riskFactors: [
          "Non-Manufacturer Rule (NMR) applies - requires certified manufacturing partnership",
          "Tight deadline: 19 days for proposal submission",
          "100% SDVOSB set-aside competition"
        ],
        opportunities: [
          "Small business set-aside reduces large contractor competition", 
          "Delivery-only scope eliminates installation complexity",
          "Federal contracting experience advantage",
          "Arlington location provides government market familiarity"
        ],
        complianceItems: [
          "SDVOSB certification verification",
          "Financial release forms completion",
          "Technical specifications submission",
          "Manufacturing partnership documentation"
        ]
      };
      
      setAgentProgress(prev => ({
        ...prev,
        analyzer: { state: 'completed', message: 'Found 3 critical gaps, 4 opportunities identified', result: analysisResult },
        strategist: { state: 'working', message: 'Developing partnership strategy for NAICS gap...' }
      }));
      setResults(prev => ({ ...prev, analysis: analysisResult }));
      
      // Agent 2: Strategist (7 seconds) 
      await new Promise(resolve => setTimeout(resolve, 4000));
      const strategyResult: StrategyOutput = {
        positioning: "Position Gunn Construction as a specialized construction logistics expert with proven federal contracting experience, partnering with certified NAICS 337127 manufacturers to deliver comprehensive bleacher solutions.",
        gapMitigation: "Establish strategic partnership with certified bleacher manufacturer (NAICS 337127 compliant) to address manufacturing requirement while leveraging Gunn's construction expertise for logistics, delivery, and project management.",
        valuePropositions: [
          "Arlington-based with deep federal contracting knowledge",
          "Proven delivery expertise for government facilities",
          "Strategic manufacturing partnerships ensure compliance",
          "Small business agility with enterprise reliability",
          "Texas delivery experience through previous projects"
        ],
        winProbability: 75,
        pricingStrategy: "Competitive pricing strategy positioned at 85% of estimated budget ceiling, emphasizing value through partnership model and delivery expertise rather than lowest-price approach."
      };
      
      setAgentProgress(prev => ({
        ...prev,
        strategist: { state: 'completed', message: 'Partnership strategy developed - 75% win probability', result: strategyResult },
        writer: { state: 'working', message: 'Generating professional proposal content...' }
      }));
      setResults(prev => ({ ...prev, strategy: strategyResult }));
      
      // Agent 3: Writer (10 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      const proposalResult: ProposalOutput = {
        companyInfo: `GUNN CONSTRUCTION LLC
Arlington, Virginia

Established in 2023, Gunn Construction LLC is a veteran-owned small business specializing in commercial and institutional building construction with extensive federal contracting experience. Our company brings unique value through our strategic location in Arlington, Virginia, providing deep understanding of federal procurement requirements and proven delivery capabilities.

CAGE Code: 9HET5
Primary NAICS: 236220 - Commercial and Institutional Building Construction
Address: 3533 Columbia Pike, Arlington, VA 22204

Our team combines construction expertise with logistics excellence, ensuring seamless project delivery for government facilities across multiple states.`,
        
        technicalResponse: `TECHNICAL RESPONSE - BLEACHER SEATING SYSTEMS

1. PARTNERSHIP APPROACH
Gunn Construction has established a strategic partnership with [Manufacturing Partner Name], a certified NAICS 337127 manufacturer, to ensure full compliance with manufacturing requirements while leveraging our construction and delivery expertise.

2. DELIVERY SPECIFICATIONS
- Quantity: Eight (8) bleacher seating systems
- Capacity: 125 personnel per system (123 acceptable per RFQ)
- Delivery Location: JBSA Lackland/Camp Bullis, Texas
- Timeline: Full delivery within 45 days of award

3. QUALITY ASSURANCE
All bleacher systems will meet or exceed government specifications with full warranty coverage and testing documentation as required by the Statement of Work.

4. PROJECT MANAGEMENT
Dedicated project manager assigned with daily progress reporting and direct government liaison throughout delivery process.`,
        
        narrative: `STRATEGIC NARRATIVE

Gunn Construction's approach to this requirement leverages our core strengths while addressing the specialized manufacturing component through strategic partnership. Our Arlington location provides inherent advantages in understanding federal procurement processes and government facility requirements.

The NAICS challenge becomes our competitive advantage through our innovative partnership model, combining certified manufacturing capabilities with proven construction logistics expertise. This approach ensures compliance while delivering superior service through our established federal contracting processes.

Our commitment to this project extends beyond simple delivery - we provide comprehensive project management, ensuring seamless integration with Air Force operations and schedules.`,
        
        pricingDetails: "Competitive firm fixed price of $485,000 for complete delivery of eight bleacher systems, including all transportation, coordination, and project management services.",
        
        submissionForms: [
          {
            formName: "Contractor Release of Financial Information", 
            formContent: "Completed authorization form permitting government verification of financial responsibility per FAR 9.104-1(a)"
          },
          {
            formName: "Company Information Form",
            formContent: "Complete company details including CAGE code, SDVOSB certification, and technical capabilities"
          }
        ]
      };
      
      setAgentProgress(prev => ({
        ...prev,
        writer: { state: 'completed', message: '4-page proposal generated, all forms completed', result: proposalResult },
        reviewer: { state: 'working', message: 'Reviewing compliance and finalizing submission package...' }
      }));
      setResults(prev => ({ ...prev, proposal: proposalResult }));
      
      // Agent 4: Reviewer (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const reviewResult: ReviewOutput = {
        complianceCheck: [
          "All RFQ requirements addressed in technical response",
          "NAICS gap mitigated through documented partnership",
          "Financial forms completed and ready for submission", 
          "SDVOSB certification verified and documented",
          "No contradictions found between proposal sections",
          "Professional government contracting tone maintained"
        ],
        submissionPackage: {
          emailTemplate: `To: parie.reynolds@us.af.mil; lance.watters.1@us.af.mil
Subject: RFQ Response - FA301625Q0050 Bleacher Seating Systems - Gunn Construction LLC

Dear Ms. Reynolds and Mr. Watters,

Gunn Construction LLC respectfully submits our response to RFQ FA301625Q0050 for Bleacher Seating Systems.

Attached Documents:
- Technical Response and Company Information
- Contractor Release of Financial Information (Attachment 2)
- Partnership Documentation (NAICS 337127 compliance)

Our response addresses all requirements through our strategic partnership approach, ensuring full compliance while leveraging our federal contracting expertise.

Please confirm receipt and do not hesitate to contact us with any questions.

Respectfully,
[Authorized Representative]
Gunn Construction LLC
Phone: [Contact Number]
Email: [Contact Email]`,
          attachments: [
            "Technical Response Document",
            "Company Information Form", 
            "Financial Release Form",
            "Partnership Documentation",
            "SDVOSB Certification"
          ],
          submissionChecklist: [
            "All required forms completed",
            "Technical specifications addressed", 
            "Email sent to both required recipients",
            "Attachment files properly formatted",
            "Deadline compliance verified (July 21, 2025)",
            "Professional submission standards met"
          ]
        },
        finalScore: 95
      };
      
      setAgentProgress(prev => ({
        ...prev,
        reviewer: { state: 'completed', message: 'Compliance verified - 95% submission confidence', result: reviewResult }
      }));
      setResults(prev => ({ ...prev, review: reviewResult }));
      
    } catch (error) {
      console.error('Generation failed:', error);
      // Handle error state
    } finally {
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
            Multi-Agent Government Proposal Generator - Transform RFQs into winning proposals in 30 seconds
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary" className="text-sm">🎯 4 Specialized Agents</Badge>
            <Badge variant="secondary" className="text-sm">⚡ Sub-30 Second Generation</Badge>
            <Badge variant="secondary" className="text-sm">🏛️ Government Contracting Expert</Badge>
          </div>
        </div>

        {/* Input Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span>Generate Proposal</span>
            </CardTitle>
            <p className="text-gray-600">
              Select your RFQ and company to generate a professional government proposal using our multi-agent AI system.
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
                      <h3 className="font-semibold text-blue-900">Selected RFQ</h3>
                      <p className="text-sm text-blue-700 mt-1">{sampleContract.solicitationNumber}</p>
                      <p className="text-sm font-medium text-blue-800">{sampleContract.title}</p>
                      <p className="text-xs text-blue-600 mt-1">{sampleContract.agencyName}</p>
                      <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700">
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
                      <h3 className="font-semibold text-green-900">Selected Company</h3>
                      <p className="text-sm font-medium text-green-800">{sampleEntity.businessName}</p>
                      <p className="text-xs text-green-600 mt-1">{sampleEntity.physicalAddress}</p>
                      <Badge variant="outline" className="mt-2 text-xs border-green-300 text-green-700">
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
                    Generating Response...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Watch 4 specialized AI agents collaborate to create your proposal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agent Progress */}
        {(isGenerating || hasResults) && (
          <AgentProgress progress={agentProgress} isGenerating={isGenerating} />
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
      </div>
    </div>
  );
}
