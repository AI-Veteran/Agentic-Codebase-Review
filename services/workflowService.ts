import type { Dispatch, SetStateAction } from 'react';
import type { Agent, KVCacheEntry, Report, ReviewStatus, CICDLog, ArchitectureMap, Note, AgentReport } from '../types';
import { AgentName, AgentStatus } from '../types';
import { SHORT_UI_DELAY, MEDIUM_UI_DELAY, LONG_UI_DELAY } from '../constants';
import { generateArchitectureMap, generateAgentNotes, generateAgentReport, generateFinalReportSummary } from './geminiService';
import { fetchRepoContents } from './githubService';

interface WorkflowParams {
    repoUrl: string;
    branch: string;
    enableCICD: boolean;
    setAgents: Dispatch<SetStateAction<Agent[]>>;
    setKvCache: Dispatch<SetStateAction<KVCacheEntry[]>>;
    setFinalReport: Dispatch<SetStateAction<Report | null>>;
    setProcessLogs: Dispatch<SetStateAction<CICDLog[]>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setReviewStatus: Dispatch<SetStateAction<ReviewStatus>>;
}

export const runReviewWorkflow = async (params: WorkflowParams) => {
    const {
        repoUrl,
        branch,
        enableCICD,
        setAgents,
        setKvCache,
        setFinalReport,
        setProcessLogs,
        setError,
        setReviewStatus,
    } = params;

    let logCounter = 0;
    let kvCacheCounter = 0;

    const updateAgentStatus = (name: AgentName, status: AgentStatus, task?: string) => {
        setAgents(prevAgents =>
            prevAgents.map(agent =>
                agent.name === name ? { ...agent, status, task: task || '' } : agent
            )
        );
    };
    
    const addKVCacheEntry = (entry: Omit<KVCacheEntry, 'id'>) => {
        // FIX: Using a spread operator on a discriminated union can confuse TypeScript.
        // We cast the new object to KVCacheEntry to ensure type correctness.
        setKvCache(prev => [...prev, { ...entry, id: kvCacheCounter++ } as KVCacheEntry]);
    };

    const addProcessLog = (message: string, status: 'pending' | 'success' | 'error') => {
        setProcessLogs(prevLogs => [...prevLogs, { id: logCounter++, message, status }]);
    };

    const updateLastProcessLog = (status: 'success' | 'error', newMessage?: string) => {
        setProcessLogs(prevLogs => {
            if (prevLogs.length === 0) return [];
            const newLogs = [...prevLogs];
            const lastLog = { ...newLogs[newLogs.length - 1] };
            lastLog.status = status;
            if (newMessage) {
                lastLog.message = newMessage;
            }
            newLogs[newLogs.length - 1] = lastLog;
            return newLogs;
        });
    };

    try {
        // 1. Supervisor fetches code
        updateAgentStatus(AgentName.SUPERVISOR, AgentStatus.WORKING, 'Fetching codebase...');
        addProcessLog(`Fetching codebase from ${repoUrl} (branch: ${branch})...`, 'pending');
        const codeContext = await fetchRepoContents(repoUrl, branch);
        updateLastProcessLog('success', 'Successfully fetched codebase.');
        updateAgentStatus(AgentName.SUPERVISOR, AgentStatus.COMPLETED);

        // 2. Architect maps the system
        updateAgentStatus(AgentName.ARCHITECTURE_ANALYST, AgentStatus.WORKING, 'Creating architecture map...');
        const architectureMap = await generateArchitectureMap(codeContext);
        addKVCacheEntry({ type: 'ARCHITECTURE_MAP', agentName: AgentName.ARCHITECTURE_ANALYST, payload: architectureMap });
        updateAgentStatus(AgentName.ARCHITECTURE_ANALYST, AgentStatus.WORKING, 'Map created. Analyzing...');

        // 3. Specialized agents analyze in parallel
        const analysisAgents: { name: AgentName, category: any }[] = [
            { name: AgentName.ARCHITECTURE_ANALYST, category: 'Architecture' },
            { name: AgentName.SECURITY_SENTINEL, category: 'Security' },
            { name: AgentName.EFFICIENCY_EXPERT, category: 'Efficiency' },
            { name: AgentName.MAINTAINABILITY_MAESTRO, category: 'Maintainability' },
            { name: AgentName.DEPENDENCY_DETECTIVE, category: 'Dependency' },
        ];
        
        const agentPromises = analysisAgents.map(async (agentInfo) => {
            const { name, category } = agentInfo;
            if(name !== AgentName.ARCHITECTURE_ANALYST) updateAgentStatus(name, AgentStatus.WORKING, 'Taking notes...');

            const notes = await generateAgentNotes(name, codeContext, architectureMap);
            notes.forEach(note => addKVCacheEntry({ type: 'NOTE', agentName: name, payload: note }));
            
            updateAgentStatus(name, AgentStatus.WORKING, 'Compiling report...');
            const agentReport = await generateAgentReport(name, category, notes);
            addKVCacheEntry({ type: 'AGENT_REPORT', agentName: name, payload: agentReport });

            updateAgentStatus(name, AgentStatus.COMPLETED);
            return { agentName: name, report: agentReport };
        });

        const completedAgentReports = await Promise.all(agentPromises);

        // 4. Writing process
        updateAgentStatus(AgentName.DRAFTING_AGENT, AgentStatus.WORKING, 'Collating reports...');
        await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
        updateAgentStatus(AgentName.DRAFTING_AGENT, AgentStatus.COMPLETED);

        updateAgentStatus(AgentName.EDITING_AGENT, AgentStatus.WORKING, 'Reviewing draft...');
        await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
        updateAgentStatus(AgentName.EDITING_AGENT, AgentStatus.COMPLETED);

        updateAgentStatus(AgentName.REVISING_AGENT, AgentStatus.WORKING, 'Generating final summary...');
        const finalSummary = await generateFinalReportSummary(completedAgentReports);
        
        // 5. Assemble final report
        const finalReportObject: Report = {
            review_id: `rev_${new Date().getTime()}`,
            status: 'completed',
            report: {
                summary: finalSummary,
                agentReports: completedAgentReports
            }
        };
        setFinalReport(finalReportObject);
        updateAgentStatus(AgentName.REVISING_AGENT, AgentStatus.COMPLETED);
        setReviewStatus('completed');
        
        // 6. CI/CD Simulation
        if (enableCICD) {
            await new Promise(res => setTimeout(res, SHORT_UI_DELAY));
            addProcessLog('Posting status check to GitHub...', 'pending');
            await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
            updateLastProcessLog('success');
    
            await new Promise(res => setTimeout(res, SHORT_UI_DELAY));
            addProcessLog('Posting report to Pull Request #42...', 'pending');
            await new Promise(res => setTimeout(res, LONG_UI_DELAY));
            updateLastProcessLog('success');
        }

    } catch (err: any) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Review failed: ${errorMessage}`);
        updateLastProcessLog('error', `Error: ${errorMessage}`);
        setReviewStatus('error');
        setAgents(prev => prev.map(a => a.status === AgentStatus.WORKING ? {...a, status: AgentStatus.ERROR} : a));
    }
};