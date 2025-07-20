/**
 * MAIN PAGE - RFQ RESPONSE SYSTEM
 * 
 * This page has been completely refactored to use modular components
 * and real-time agent execution instead of simulated progress.
 * 
 * ARCHITECTURE:
 * - Uses the new RFQResponseGenerator component for all functionality
 * - Real-time progress updates as agents complete their work
 * - Modular component structure for better maintainability
 * - Contract-agnostic system that works with any government RFQ
 */

import RFQResponseGenerator from '@/components/RFQResponseGenerator';

export default function HomePage() {
    return <RFQResponseGenerator />;
}
