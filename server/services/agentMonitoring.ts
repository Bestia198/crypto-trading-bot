/**
 * Agent Monitoring & Logging Service
 * Tracks agent performance, health, and execution metrics
 */

export interface AgentLog {
  timestamp: Date;
  agentId: number;
  userId: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  metadata?: Record<string, any>;
}

export interface AgentHealthStatus {
  agentId: number;
  isHealthy: boolean;
  lastExecutionTime: Date | null;
  consecutiveErrors: number;
  lastError: string | null;
  uptime: number; // percentage
  avgExecutionTime: number; // ms
}

export interface AgentPerformanceMetrics {
  agentId: number;
  period: 'hour' | 'day' | 'week' | 'month';
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  maxProfit: number;
  maxLoss: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
}

class AgentMonitor {
  private logs: Map<number, AgentLog[]> = new Map();
  private healthStatus: Map<number, AgentHealthStatus> = new Map();
  private performanceMetrics: Map<number, AgentPerformanceMetrics[]> = new Map();
  private maxLogsPerAgent: number = 1000;

  /**
   * Log agent activity
   */
  logActivity(
    agentId: number,
    userId: number,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const log: AgentLog = {
      timestamp: new Date(),
      agentId,
      userId,
      level,
      message,
      metadata,
    };

    // Store log
    if (!this.logs.has(agentId)) {
      this.logs.set(agentId, []);
    }
    const agentLogs = this.logs.get(agentId)!;
    agentLogs.push(log);

    // Trim old logs
    if (agentLogs.length > this.maxLogsPerAgent) {
      agentLogs.splice(0, agentLogs.length - this.maxLogsPerAgent);
    }

    // Console output
    const prefix = `[Agent ${agentId}]`;
    switch (level) {
      case 'ERROR':
        console.error(`${prefix} ${message}`, metadata);
        break;
      case 'WARN':
        console.warn(`${prefix} ${message}`, metadata);
        break;
      case 'DEBUG':
        console.debug(`${prefix} ${message}`, metadata);
        break;
      default:
        console.log(`${prefix} ${message}`, metadata);
    }
  }

  /**
   * Get agent logs
   */
  getLogs(agentId: number, limit: number = 100): AgentLog[] {
    const logs = this.logs.get(agentId) || [];
    return logs.slice(-limit);
  }

  /**
   * Update agent health status
   */
  updateHealthStatus(
    agentId: number,
    updates: Partial<AgentHealthStatus>
  ): void {
    const current = this.healthStatus.get(agentId) || {
      agentId,
      isHealthy: true,
      lastExecutionTime: null,
      consecutiveErrors: 0,
      lastError: null,
      uptime: 100,
      avgExecutionTime: 0,
    };

    const updated: AgentHealthStatus = { ...current, ...updates };
    this.healthStatus.set(agentId, updated);
  }

  /**
   * Get agent health status
   */
  getHealthStatus(agentId: number): AgentHealthStatus | null {
    return this.healthStatus.get(agentId) || null;
  }

  /**
   * Record execution error
   */
  recordError(agentId: number, userId: number, error: Error): void {
    const status = this.healthStatus.get(agentId) || {
      agentId,
      isHealthy: true,
      lastExecutionTime: null,
      consecutiveErrors: 0,
      lastError: null,
      uptime: 100,
      avgExecutionTime: 0,
    };

    status.consecutiveErrors += 1;
    status.lastError = error.message;
    status.isHealthy = status.consecutiveErrors < 5; // Unhealthy after 5 consecutive errors

    this.healthStatus.set(agentId, status);

    this.logActivity(agentId, userId, 'ERROR', `Agent execution failed: ${error.message}`, {
      consecutiveErrors: status.consecutiveErrors,
      errorStack: error.stack,
    });
  }

  /**
   * Record successful execution
   */
  recordSuccess(agentId: number, userId: number, executionTimeMs: number): void {
    const status = this.healthStatus.get(agentId) || {
      agentId,
      isHealthy: true,
      lastExecutionTime: null,
      consecutiveErrors: 0,
      lastError: null,
      uptime: 100,
      avgExecutionTime: 0,
    };

    status.lastExecutionTime = new Date();
    status.consecutiveErrors = 0;
    status.isHealthy = true;
    
    // Update average execution time
    status.avgExecutionTime =
      (status.avgExecutionTime + executionTimeMs) / 2;

    this.healthStatus.set(agentId, status);

    this.logActivity(agentId, userId, 'INFO', `Agent executed successfully`, {
      executionTimeMs,
      avgExecutionTime: status.avgExecutionTime,
    });
  }

  /**
   * Record trade execution
   */
  recordTrade(
    agentId: number,
    userId: number,
    trade: {
      symbol: string;
      action: 'BUY' | 'SELL';
      price: number;
      size: number;
      profit?: number;
    }
  ): void {
    this.logActivity(agentId, userId, 'INFO', `Trade executed: ${trade.action} ${trade.size} ${trade.symbol} @ ${trade.price}`, {
      symbol: trade.symbol,
      action: trade.action,
      price: trade.price,
      size: trade.size,
      profit: trade.profit,
    });
  }

  /**
   * Get all agent health statuses
   */
  getAllHealthStatuses(): AgentHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get unhealthy agents
   */
  getUnhealthyAgents(): AgentHealthStatus[] {
    return Array.from(this.healthStatus.values()).filter((status) => !status.isHealthy);
  }

  /**
   * Clear old logs (older than specified days)
   */
  clearOldLogs(daysOld: number = 7): void {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - daysOld);

    const agentIds: number[] = [];
    this.logs.forEach((_, agentId) => {
      agentIds.push(agentId);
    });

    for (const agentId of agentIds) {
      const logs = this.logs.get(agentId);
      if (logs) {
        const filtered = logs.filter((log: AgentLog) => log.timestamp > cutoffTime);
        if (filtered.length > 0) {
          this.logs.set(agentId, filtered);
        } else {
          this.logs.delete(agentId);
        }
      }
    }
  }

  /**
   * Export monitoring data
   */
  exportData(): {
    logs: Record<number, AgentLog[]>;
    healthStatus: AgentHealthStatus[];
  } {
    const logsRecord: Record<number, AgentLog[]> = {};
    this.logs.forEach((logs, agentId) => {
      logsRecord[agentId] = logs;
    });
    return {
      logs: logsRecord,
      healthStatus: Array.from(this.healthStatus.values()),
    };
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalAgents: number;
    healthyAgents: number;
    unhealthyAgents: number;
    totalLogs: number;
    avgExecutionTime: number;
  } {
    const statuses = Array.from(this.healthStatus.values());
    const healthyCount = statuses.filter((s) => s.isHealthy).length;
    const totalLogs = Array.from(this.logs.values()).reduce((sum, logs) => sum + logs.length, 0);
    const avgExecutionTime =
      statuses.length > 0
        ? statuses.reduce((sum, s) => sum + s.avgExecutionTime, 0) / statuses.length
        : 0;

    return {
      totalAgents: statuses.length,
      healthyAgents: healthyCount,
      unhealthyAgents: statuses.length - healthyCount,
      totalLogs,
      avgExecutionTime,
    };
  }
}

// Singleton instance
export const agentMonitor = new AgentMonitor();
