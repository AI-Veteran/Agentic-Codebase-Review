import { useState, useCallback } from 'react';
import { AgentStatus } from '../types';
import type { Agent, KVCacheEntry, Report, ReviewStatus, CICDLog, WorkflowEvent } from '../types';
import { AGENT_DEFINITIONS } from '../constants';
import { runReviewWorkflow } from '../services/workflowService';

export const useReviewSession = () => {
    const [status, setStatus] = useState<ReviewStatus>('idle');
    const [agents, setAgents] = useState<Agent[]>(AGENT_DEFINITIONS);
    const [kvCache, setKvCache] = useState<KVCacheEntry[]>([]);
    const [report, setReport] = useState<Report | null>(null);
    const [logs, setLogs] = useState<CICDLog[]>([]);
    const [error, setError] = useState<string | null>(null);

    const resetSession = useCallback(() => {
        setStatus('idle');
        setAgents(AGENT_DEFINITIONS);
        setKvCache([]);
        setReport(null);
        setLogs([]);
        setError(null);
    }, []);

    const handleWorkflowProgress = useCallback((event: WorkflowEvent) => {
        switch (event.type) {
            case 'AGENT_STATUS':
                setAgents(prev => prev.map(a => 
                    a.name === event.agentName ? { ...a, status: event.status, task: event.task || '' } : a
                ));
                break;
            case 'KV_UPDATE':
                setKvCache(prev => [...prev, { ...event.entry, id: prev.length } as KVCacheEntry]);
                break;
            case 'LOG':
                setLogs(prev => [...prev, { id: prev.length, message: event.message, status: event.status }]);
                break;
            case 'LOG_UPDATE':
                setLogs(prev => {
                    if (prev.length === 0) return [];
                    const newLogs = [...prev];
                    const lastLog = { ...newLogs[newLogs.length - 1], status: event.status };
                    if (event.message) lastLog.message = event.message;
                    newLogs[newLogs.length - 1] = lastLog;
                    return newLogs;
                });
                break;
            case 'REPORT':
                setReport(event.report);
                break;
            case 'ERROR':
                setError(event.error);
                setAgents(prev => prev.map(a => a.status === AgentStatus.WORKING ? { ...a, status: AgentStatus.ERROR } : a));
                break;
            case 'STATUS':
                setStatus(event.status);
                break;
        }
    }, []);

    const startReview = useCallback(async (repoUrl: string, branch: string, enableCICD: boolean) => {
        resetSession();
        setStatus('in_progress');
        await runReviewWorkflow({
            repoUrl,
            branch,
            enableCICD,
            onProgress: handleWorkflowProgress
        });
    }, [resetSession, handleWorkflowProgress]);

    return {
        status,
        agents,
        kvCache,
        report,
        logs,
        error,
        startReview,
        resetSession
    };
};
