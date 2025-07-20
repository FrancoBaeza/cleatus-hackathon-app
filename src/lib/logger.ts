// Comprehensive logging for AI agent operations
export class AgentLogger {
    private static logs: Array<{
        timestamp: string;
        agent: string;
        action: string;
        data?: any;
        duration?: number;
        success: boolean;
        error?: string;
    }> = [];

    static logAgentStart(agent: string, action: string, inputData?: any) {
        const timestamp = new Date().toISOString();
        console.log(`🤖 [${agent.toUpperCase()}] Starting: ${action}`, {
            timestamp,
            inputSize: inputData ? JSON.stringify(inputData).length : 0,
        });

        this.logs.push({
            timestamp,
            agent,
            action: `START: ${action}`,
            data: inputData,
            success: true,
        });

        return timestamp;
    }

    static logAgentSuccess(
        agent: string,
        action: string,
        startTime: string,
        outputData?: any,
    ) {
        const endTime = new Date().toISOString();
        const duration =
            new Date(endTime).getTime() - new Date(startTime).getTime();

        console.log(`✅ [${agent.toUpperCase()}] Success: ${action}`, {
            duration: `${duration}ms`,
            outputSize: outputData ? JSON.stringify(outputData).length : 0,
        });

        this.logs.push({
            timestamp: endTime,
            agent,
            action: `SUCCESS: ${action}`,
            data: outputData,
            duration,
            success: true,
        });
    }

    static logAgentError(
        agent: string,
        action: string,
        startTime: string,
        error: any,
    ) {
        const endTime = new Date().toISOString();
        const duration =
            new Date(endTime).getTime() - new Date(startTime).getTime();

        console.error(`❌ [${agent.toUpperCase()}] Error: ${action}`, {
            duration: `${duration}ms`,
            error: error.message || error,
        });

        this.logs.push({
            timestamp: endTime,
            agent,
            action: `ERROR: ${action}`,
            duration,
            success: false,
            error: error.message || String(error),
        });
    }

    static logSystemEvent(message: string, data?: any) {
        const timestamp = new Date().toISOString();
        console.log(`🔧 [SYSTEM] ${message}`, data);

        this.logs.push({
            timestamp,
            agent: 'SYSTEM',
            action: message,
            data,
            success: true,
        });
    }

    static getLogs() {
        return [...this.logs];
    }

    static getLogsSummary() {
        const summary = {
            totalEvents: this.logs.length,
            successCount: this.logs.filter((log) => log.success).length,
            errorCount: this.logs.filter((log) => !log.success).length,
            agentStats: {} as Record<
                string,
                { calls: number; avgDuration: number; errors: number }
            >,
        };

        // Calculate agent statistics
        this.logs.forEach((log) => {
            if (!summary.agentStats[log.agent]) {
                summary.agentStats[log.agent] = {
                    calls: 0,
                    avgDuration: 0,
                    errors: 0,
                };
            }

            summary.agentStats[log.agent].calls++;
            if (log.duration) {
                summary.agentStats[log.agent].avgDuration += log.duration;
            }
            if (!log.success) {
                summary.agentStats[log.agent].errors++;
            }
        });

        // Calculate averages
        Object.keys(summary.agentStats).forEach((agent) => {
            const stats = summary.agentStats[agent];
            if (stats.calls > 0) {
                stats.avgDuration = Math.round(stats.avgDuration / stats.calls);
            }
        });

        return summary;
    }

    static clearLogs() {
        this.logs = [];
        console.log('🗑️ [SYSTEM] Logs cleared');
    }
}
