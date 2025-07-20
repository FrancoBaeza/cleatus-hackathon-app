import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { 
    AnalysisOutput, 
    StrategyOutput, 
    ProposalOutput, 
    ReviewOutput,
    GeneratedRFQResponse 
} from './types';

export interface AgentExecutionLog {
    agentName: string;
    executionId: string;
    timestamp: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    input?: any;
    output?: any;
    error?: string;
    metadata: {
        modelUsed: string;
        promptLength: number;
        outputTokens?: number;
        inputTokens?: number;
    };
}

export interface SessionLog {
    sessionId: string;
    startTime: string;
    endTime?: string;
    totalDuration?: number;
    success: boolean;
    agentExecutions: AgentExecutionLog[];
    finalOutput?: GeneratedRFQResponse;
    summary: {
        totalAgents: number;
        successfulAgents: number;
        failedAgents: number;
        averageDuration: number;
    };
}

class DetailedAgentLogger {
    private sessionId: string;
    private sessionStartTime: number;
    private sessionLog: SessionLog;
    private logsDirectory: string;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.logsDirectory = join(process.cwd(), 'agent-logs');
        this.sessionLog = {
            sessionId: this.sessionId,
            startTime: new Date().toISOString(),
            success: false,
            agentExecutions: [],
            summary: {
                totalAgents: 0,
                successfulAgents: 0,
                failedAgents: 0,
                averageDuration: 0
            }
        };

        this.ensureLogsDirectory();
    }

    private generateSessionId(): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substring(7);
        return `session-${timestamp}-${random}`;
    }

    private ensureLogsDirectory(): void {
        try {
            if (!existsSync(this.logsDirectory)) {
                mkdirSync(this.logsDirectory, { recursive: true });
            }
        } catch (error) {
            console.warn('Could not create logs directory:', error);
        }
    }

    public logAgentStart(
        agentName: string, 
        input?: any,
        metadata?: { promptLength?: number; modelUsed?: string }
    ): { executionId: string; startTime: number } {
        const executionId = `${agentName}-${Date.now()}`;
        const startTime = Date.now();

        console.log(`🤖 [${agentName.toUpperCase()}] Starting execution...`);
        
        return { executionId, startTime };
    }

    public logAgentSuccess(
        agentName: string,
        executionId: string,
        startTime: number,
        output: any,
        metadata?: { 
            modelUsed?: string; 
            promptLength?: number; 
            outputTokens?: number; 
            inputTokens?: number 
        }
    ): void {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const agentLog: AgentExecutionLog = {
            agentName,
            executionId,
            timestamp: new Date().toISOString(),
            startTime,
            endTime,
            duration,
            success: true,
            output,
            metadata: {
                modelUsed: metadata?.modelUsed || 'gpt-4',
                promptLength: metadata?.promptLength || 0,
                outputTokens: metadata?.outputTokens,
                inputTokens: metadata?.inputTokens
            }
        };

        this.sessionLog.agentExecutions.push(agentLog);
        this.sessionLog.summary.totalAgents++;
        this.sessionLog.summary.successfulAgents++;

        // Save individual agent result
        this.saveAgentResult(agentLog);

        console.log(`✅ [${agentName.toUpperCase()}] Completed in ${duration}ms`);
        this.logAgentDetails(agentName, output);
    }

    public logAgentError(
        agentName: string,
        executionId: string,
        startTime: number,
        error: any,
        metadata?: { modelUsed?: string; promptLength?: number }
    ): void {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const agentLog: AgentExecutionLog = {
            agentName,
            executionId,
            timestamp: new Date().toISOString(),
            startTime,
            endTime,
            duration,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            metadata: {
                modelUsed: metadata?.modelUsed || 'gpt-4',
                promptLength: metadata?.promptLength || 0
            }
        };

        this.sessionLog.agentExecutions.push(agentLog);
        this.sessionLog.summary.totalAgents++;
        this.sessionLog.summary.failedAgents++;

        // Save individual agent error
        this.saveAgentResult(agentLog);

        console.log(`❌ [${agentName.toUpperCase()}] Failed after ${duration}ms: ${agentLog.error}`);
    }

    private logAgentDetails(agentName: string, output: any): void {
        switch (agentName) {
            case 'analyzer':
                console.log(`   📊 Requirements: ${output.requirements?.length || 0}`);
                console.log(`   ⚠️  Gaps: ${output.gaps?.length || 0}`);
                console.log(`   🎯 Opportunities: ${output.opportunities?.length || 0}`);
                break;
            case 'strategist':
                console.log(`   🎲 Win Probability: ${output.winProbability || 0}%`);
                console.log(`   💡 Value Props: ${output.valuePropositions?.length || 0}`);
                break;
            case 'writer':
                console.log(`   📝 Response Blocks: ${output.responseBlocks?.length || 0}`);
                console.log(`   📋 Forms Generated: ${output.responseBlocks?.filter((b: any) => b.type === 'Form').length || 0}`);
                break;
            case 'reviewer':
                console.log(`   ✅ Final Score: ${output.finalScore || 0}%`);
                console.log(`   📋 Final Blocks: ${output.finalResponseBlocks?.length || 0}`);
                break;
        }
    }

    private saveAgentResult(agentLog: AgentExecutionLog): void {
        try {
            const filename = `${this.sessionId}_${agentLog.agentName}_${Date.now()}.json`;
            const filepath = join(this.logsDirectory, filename);
            
            const logData = {
                ...agentLog,
                sessionId: this.sessionId,
                agentOutput: agentLog.output,
                readableTimestamp: new Date(agentLog.timestamp).toLocaleString()
            };

            writeFileSync(filepath, JSON.stringify(logData, null, 2));
            console.log(`   💾 Saved to: agent-logs/${filename}`);
        } catch (error) {
            console.warn(`   ⚠️  Could not save agent result:`, error);
        }
    }

    public finalizeSession(finalOutput?: GeneratedRFQResponse, success: boolean = true): void {
        this.sessionLog.endTime = new Date().toISOString();
        this.sessionLog.totalDuration = Date.now() - this.sessionStartTime;
        this.sessionLog.success = success;
        this.sessionLog.finalOutput = finalOutput;

        // Calculate summary statistics
        const durations = this.sessionLog.agentExecutions.map(exec => exec.duration);
        this.sessionLog.summary.averageDuration = durations.length > 0 
            ? durations.reduce((a, b) => a + b, 0) / durations.length 
            : 0;

        // Save complete session log
        this.saveSessionLog();

        // Print session summary
        this.printSessionSummary();
    }

    private saveSessionLog(): void {
        try {
            const filename = `${this.sessionId}_SESSION_COMPLETE.json`;
            const filepath = join(this.logsDirectory, filename);
            
            writeFileSync(filepath, JSON.stringify(this.sessionLog, null, 2));
            console.log(`\n📊 Complete session saved to: agent-logs/${filename}`);
        } catch (error) {
            console.warn('Could not save session log:', error);
        }
    }

    private printSessionSummary(): void {
        const { summary } = this.sessionLog;
        console.log(`\n🎯 SESSION SUMMARY:`);
        console.log(`   Session ID: ${this.sessionId}`);
        console.log(`   Total Duration: ${this.sessionLog.totalDuration}ms`);
        console.log(`   Agents Executed: ${summary.totalAgents}`);
        console.log(`   Success Rate: ${summary.successfulAgents}/${summary.totalAgents} (${((summary.successfulAgents / summary.totalAgents) * 100).toFixed(1)}%)`);
        console.log(`   Average Agent Duration: ${Math.round(summary.averageDuration)}ms`);
        console.log(`   Final Success: ${this.sessionLog.success ? '✅' : '❌'}`);
        
        if (this.sessionLog.finalOutput) {
            console.log(`   Blocks Generated: ${this.sessionLog.finalOutput.blocks.length}`);
            console.log(`   Confidence Score: ${this.sessionLog.finalOutput.confidenceScore}%`);
            console.log(`   Submission Ready: ${this.sessionLog.finalOutput.submissionReady ? '✅' : '❌'}`);
        }
    }

    // Static method to create new instance for each session
    static createSession(): DetailedAgentLogger {
        return new DetailedAgentLogger();
    }
}

// Export singleton for current session
export const detailedLogger = DetailedAgentLogger.createSession(); 