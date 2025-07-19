import contractData from '@/data/contract.json';
import entityData from '@/data/entity.json';
import { Contract, Entity } from './types';
import { AgentLogger } from './logger';

// Load real contract data
export function getContractData(): Contract {
  AgentLogger.logSystemEvent('Loading contract data', { 
    solicitationNumber: contractData.solicitationNumber,
    title: contractData.title 
  });

  return {
    id: contractData.id,
    title: contractData.title,
    solicitationNumber: contractData.solicitationNumber,
    agencyName: contractData.agencyName,
    naicsId: contractData.naicsId,
    deadlineDate: contractData.deadlineDate,
    description: contractData.description,
    overview: contractData.overview
  };
}

// Load real entity data  
export function getEntityData(): Entity {
  AgentLogger.logSystemEvent('Loading entity data', {
    businessName: entityData.businessName,
    primaryNAICS: entityData.naicsCodes?.[0]?.code
  });

  return {
    id: entityData.id,
    businessName: entityData.businessName,
    physicalAddress: entityData.physicalAddress,
    naicsCodes: entityData.naicsCodes || [],
    cageCode: entityData.cageCode,
    entityStartDate: entityData.entityStartDate
  };
}

// Utility to extract key requirements from contract
export function extractContractRequirements(contract: Contract): string[] {
  const requirements = [];
  
  // Parse description for key requirements
  if (contract.description.includes('eight')) {
    requirements.push('8 bleacher seating systems required');
  }
  if (contract.description.includes('125') || contract.description.includes('123')) {
    requirements.push('125-person capacity per system (123 acceptable)');
  }
  if (contract.description.includes('JBSA') || contract.description.includes('Texas')) {
    requirements.push('Delivery to JBSA Lackland/Camp Bullis, Texas');
  }
  if (contract.description.includes('SDVOSB') || contract.description.includes('Service-Disabled')) {
    requirements.push('100% SDVOSB set-aside requirement');
  }
  if (contract.naicsId) {
    requirements.push(`NAICS ${contract.naicsId} compliance required`);
  }

  return requirements;
}

// Utility to identify NAICS gaps
export function identifyNAICSGaps(entity: Entity, requiredNAICS: string): string[] {
  const gaps = [];
  const entityNAICS = entity.naicsCodes.map(code => code.code);
  
  if (!entityNAICS.includes(requiredNAICS)) {
    const primaryNAICS = entityNAICS[0] || 'Unknown';
    gaps.push(`NAICS mismatch: Company has ${primaryNAICS} vs required ${requiredNAICS}`);
    
    // Specific gap analysis
    if (requiredNAICS === '337127' && primaryNAICS.startsWith('236')) {
      gaps.push('Construction company bidding on manufacturing requirement');
      gaps.push('Non-Manufacturer Rule (NMR) compliance required');
    }
  }
  
  return gaps;
}

// Get contract summary for AI context
export function getContractSummary(contract: Contract): string {
  return `
RFQ: ${contract.solicitationNumber}
Title: ${contract.title}
Agency: ${contract.agencyName}
Required NAICS: ${contract.naicsId}
Deadline: ${new Date(contract.deadlineDate).toLocaleDateString()}

Key Details:
${contract.overview}

Description:
${contract.description.replace(/<[^>]*>/g, '').substring(0, 500)}...
  `.trim();
}

// Get entity summary for AI context
export function getEntitySummary(entity: Entity): string {
  const primaryNAICS = entity.naicsCodes[0];
  const naicsCount = entity.naicsCodes.length;
  
  return `
Company: ${entity.businessName}
Location: ${entity.physicalAddress}
CAGE Code: ${entity.cageCode}
Established: ${new Date(entity.entityStartDate).getFullYear()}

Primary NAICS: ${primaryNAICS?.code} - ${primaryNAICS?.name}
Total NAICS Codes: ${naicsCount}

Capabilities Summary:
${entity.naicsCodes.slice(0, 5).map(naics => `- ${naics.code}: ${naics.name}`).join('\n')}
${naicsCount > 5 ? `... and ${naicsCount - 5} more capabilities` : ''}
  `.trim();
} 