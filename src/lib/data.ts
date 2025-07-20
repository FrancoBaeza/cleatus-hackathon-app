import contractData from '../../data/contract-data/contract.json';
import entityData from '../../data/entity-data/entity.json';
import { Contract, Entity } from './types';
import { AgentLogger } from './logger';

// Simple data loaders - no hardcoded logic
export function getContractData(): Contract {
    AgentLogger.logSystemEvent('Loading contract data', {
        solicitationNumber: contractData.solicitationNumber,
        title: contractData.title,
    });

    return {
        id: contractData.id,
        title: contractData.title,
        solicitationNumber: contractData.solicitationNumber,
        agencyName: contractData.agencyName,
        naicsId: contractData.naicsId,
        deadlineDate: contractData.deadlineDate,
        description: contractData.description,
        overview: contractData.overview,
    };
}

export function getEntityData(): Entity {
    AgentLogger.logSystemEvent('Loading entity data', {
        businessName: entityData.businessName,
        primaryNAICS: entityData.naicsCodes?.[0]?.code,
    });

    return {
        id: entityData.id,
        businessName: entityData.businessName,
        physicalAddress: entityData.physicalAddress,
        naicsCodes: entityData.naicsCodes || [],
        cageCode: entityData.cageCode,
        entityStartDate: entityData.entityStartDate,
    };
}

// Get raw JSON data for AI processing
export function getRawContractData() {
    return contractData;
}

export function getRawEntityData() {
    return entityData;
}
 