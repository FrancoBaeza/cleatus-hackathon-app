'use client';

import { useEffect, useState } from 'react';
import { getContractData, getEntityData, extractRequiredForms, generateFormFields } from '@/lib/data';

export default function TestDataPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Test basic data loading
      const contract = getContractData();
      const entity = getEntityData();
      
      // Test dynamic form extraction
      const requiredForms = extractRequiredForms(contract);
      
      // Test form field generation
      const sampleFormFields = generateFormFields('Basic Quote Information', entity);
      
      setTestResults({
        contract: {
          solicitationNumber: contract.solicitationNumber,
          title: contract.title,
          naicsId: contract.naicsId
        },
        entity: {
          businessName: entity.businessName,
          cageCode: entity.cageCode,
          naicsCount: entity.naicsCodes.length
        },
        requiredForms: requiredForms.map(form => ({
          name: form.name,
          description: form.description.substring(0, 100) + '...'
        })),
        sampleFormFields: sampleFormFields.slice(0, 3).map(field => ({
          label: field.label,
          type: field.type,
          value: field.value ? field.value.substring(0, 20) + '...' : 'empty',
          required: field.required
        }))
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Data Loading Error</h1>
        <p className="text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  if (!testResults) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Loading data...</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">✅ Data Loading Test Results</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contract Data */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Contract Data</h2>
          <div className="space-y-2 text-sm">
            <p><strong>RFQ:</strong> {testResults.contract.solicitationNumber}</p>
            <p><strong>Title:</strong> {testResults.contract.title}</p>
            <p><strong>NAICS:</strong> {testResults.contract.naicsId}</p>
          </div>
        </div>

        {/* Entity Data */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-green-800 mb-3">Entity Data</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Company:</strong> {testResults.entity.businessName}</p>
            <p><strong>CAGE:</strong> {testResults.entity.cageCode}</p>
            <p><strong>NAICS Codes:</strong> {testResults.entity.naicsCount}</p>
          </div>
        </div>

        {/* Dynamic Form Extraction */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-purple-800 mb-3">Dynamic Form Detection</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Forms Found:</strong> {testResults.requiredForms.length}</p>
            {testResults.requiredForms.map((form: any, index: number) => (
              <div key={index} className="border-l-2 border-purple-300 pl-2">
                <p className="font-medium">{form.name}</p>
                <p className="text-xs text-gray-600">{form.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Field Generation */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-orange-800 mb-3">Form Field Generation</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Sample Fields:</strong></p>
            {testResults.sampleFormFields.map((field: any, index: number) => (
              <div key={index} className="border-l-2 border-orange-300 pl-2">
                <p className="font-medium">{field.label} ({field.type})</p>
                <p className="text-xs text-gray-600">
                  Value: {field.value} | Required: {field.required ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-100 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800">🎉 All Data Loading Successfully!</h3>
        <p className="text-green-700 text-sm mt-1">
          Both static imports and dynamic form extraction are working correctly.
          Your multi-agent system is ready to generate RFQ responses!
        </p>
      </div>
    </div>
  );
} 