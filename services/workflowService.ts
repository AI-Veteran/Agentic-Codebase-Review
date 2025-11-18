
import type { Report, WorkflowEvent, KVCacheEntry } from '../types';
import { AgentName, AgentStatus } from '../types';
import { SHORT_UI_DELAY, MEDIUM_UI_DELAY, LONG_UI_DELAY, AGENT_CONFIGS } from '../constants';
import { generateArchitectureMap, generateAgentNotes, generateAgentReport, generateFinalReportSummary } from './geminiService';
import { fetchRepoContents } from './githubService';

interface WorkflowParams {
    repoUrl: string;
    branch: string;
    enableCICD: boolean;
    onProgress: (event: WorkflowEvent) => void;
}

export const runReviewWorkflow = async (params: WorkflowParams) => {
    const {
        repoUrl,
        branch,
        enableCICD,
        onProgress,
    } = params;

    const emitStatus = (name: AgentName, status: AgentStatus, task?: string) => {
        onProgress({ type: 'AGENT_STATUS', agentName: name, status, task });
    };

    const emitLog = (message: string, status: 'pending' | 'success' | 'error') => {
        onProgress({ type: 'LOG', message, status });
    };

    const updateLog = (status: 'success' | 'error', message?: string) => {
        onProgress({ type: 'LOG_UPDATE', status, message });
    };

    try {
        // 1. Supervisor fetches code
        emitStatus(AgentName.SUPERVISOR, AgentStatus.WORKING, 'Fetching codebase...');
        emitLog(`Fetching codebase from ${repoUrl} (branch: ${branch})...`, 'pending');
        const codeContext = await fetchRepoContents(repoUrl, branch);
        updateLog('success', 'Successfully fetched codebase.');
        emitStatus(AgentName.SUPERVISOR, AgentStatus.COMPLETED);

        // 2. Architect maps the system
        emitStatus(AgentName.ARCHITECTURE_ANALYST, AgentStatus.WORKING, 'Creating architecture map...');
        const architectureMap = await generateArchitectureMap(codeContext);
        
        const architectureEntry: KVCacheEntry = { 
            id: 0, // Placeholder, updated by hook
            type: 'ARCHITECTURE_MAP', 
            agentName: AgentName.ARCHITECTURE_ANALYST, 
            payload: architectureMap 
        };
        
        onProgress({ type: 'KV_UPDATE', entry: architectureEntry });
        
        emitStatus(AgentName.ARCHITECTURE_ANALYST, AgentStatus.WORKING, 'Map created. Analyzing...');

        // 3. Specialized agents analyze in parallel
        const analysisAgents = Object.entries(AGENT_CONFIGS)
            .filter(([_, config]) => config.category)
            .map(([name, config]) => ({ name: name as AgentName, category: config.category! }));

        const agentPromises = analysisAgents.map(async ({ name, category }) => {
            if(name !== AgentName.ARCHITECTURE_ANALYST) emitStatus(name, AgentStatus.WORKING, 'Taking notes...');

            const notes = await generateAgentNotes(name, codeContext, architectureMap);
            notes.forEach(note => {
                 onProgress({ 
                     type: 'KV_UPDATE', 
                     entry: { 
                         type: 'NOTE', 
                         agentName: name, 
                         payload: note 
                     } as KVCacheEntry
                 });
            });
            
            emitStatus(name, AgentStatus.WORKING, 'Compiling report...');
            const agentReport = await generateAgentReport(name, category, notes);
            onProgress({ 
                type: 'KV_UPDATE', 
                entry: { 
                    type: 'AGENT_REPORT', 
                    agentName: name, 
                    payload: agentReport 
                } as KVCacheEntry
            });

            emitStatus(name, AgentStatus.COMPLETED);
            return { agentName: name, report: agentReport };
        });

        const completedAgentReports = await Promise.all(agentPromises);

        // 4. Writing process
        emitStatus(AgentName.DRAFTING_AGENT, AgentStatus.WORKING, 'Collating reports...');
        await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
        emitStatus(AgentName.DRAFTING_AGENT, AgentStatus.COMPLETED);

        emitStatus(AgentName.EDITING_AGENT, AgentStatus.WORKING, 'Reviewing draft...');
        await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
        emitStatus(AgentName.EDITING_AGENT, AgentStatus.COMPLETED);

        emitStatus(AgentName.REVISING_AGENT, AgentStatus.WORKING, 'Generating final summary...');
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
        
        onProgress({ type: 'REPORT', report: finalReportObject });
        emitStatus(AgentName.REVISING_AGENT, AgentStatus.COMPLETED);
        onProgress({ type: 'STATUS', status: 'completed' });
        
        // 6. CI/CD Simulation
        if (enableCICD) {
            await new Promise(res => setTimeout(res, SHORT_UI_DELAY));
            emitLog('Posting status check to GitHub...', 'pending');
            await new Promise(res => setTimeout(res, MEDIUM_UI_DELAY));
            updateLog('success');
    
            await new Promise(res => setTimeout(res, SHORT_UI_DELAY));
            emitLog('Posting report to Pull Request #42...', 'pending');
            await new Promise(res => setTimeout(res, LONG_UI_DELAY));
            updateLog('success');
        }

    } catch (err: any) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        onProgress({ type: 'ERROR', error: `Review failed: ${errorMessage}` });
        updateLog('error', `Error: ${errorMessage}`);
        onProgress({ type: 'STATUS', status: 'error' });
    }
};
