import React, { useState, useCallback, useMemo } from 'react';
import type { Agent, KVCacheEntry, Report, ReviewStatus, CICDLog, Note, AgentReport, ArchitectureMap } from './types';
import { AgentName, AgentStatus } from './types';
import { AGENT_DEFINITIONS, MOCK_HISTORICAL_DATA } from './constants';
import { generateArchitectureMap, generateAgentNotes, generateAgentReport, generateFinalReportSummary } from './services/geminiService';
import { fetchRepoContents } from './services/githubService';
import AgentCard from './components/AgentCard';
import KVCacheView from './components/KVCacheView';
import ReportView from './components/ReportView';
import ProcessLogView from './components/ProcessLogView';
import HistoricalTrendsView from './components/HistoricalTrendsView';
import { LogoIcon, ChartBarIcon } from './components/Icons';

const App: React.FC = () => {
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('idle');
    const [agents, setAgents] = useState<Agent[]>(AGENT_DEFINITIONS);
    const [kvCache, setKvCache] = useState<KVCacheEntry[]>([]);
    const [finalReport, setFinalReport] = useState<Report | null>(null);
    const [repoUrl, setRepoUrl] = useState<string>('https://github.com/panva/jose');
    const [branch, setBranch] = useState<string>('main');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
    const [processLogs, setProcessLogs] = useState<CICDLog[]>([]);
    const [enableCICD, setEnableCICD] = useState<boolean>(true);

    const isLoading = useMemo(() => reviewStatus === 'in_progress', [reviewStatus]);

    const updateAgentStatus = useCallback((name: AgentName, status: AgentStatus, task?: string) => {
        setAgents(prevAgents =>
            prevAgents.map(agent =>
                agent.name === name ? { ...agent, status, task: task || '' } : agent
            )
        );
    }, []);
    
    const addKVCacheEntry = (entry: KVCacheEntry) => {
        setKvCache(prev => [...prev, entry]);
    };

    const resetState = () => {
        setReviewStatus('idle');
        setAgents(AGENT_DEFINITIONS);
        setKvCache([]);
        setFinalReport(null);
        setError(null);
        setActiveTab('review');
        setProcessLogs([]);
        setRepoUrl('https://github.com/panva/jose');
        setBranch('main');
        setEnableCICD(true);
    };
    
    const addProcessLog = (message: string, status: 'pending' | 'success' | 'error') => {
        setProcessLogs(prevLogs => [...prevLogs, { message, status }]);
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

    const handleStartReview = async () => {
        if (!repoUrl || !branch) {
            setError('Please provide a repository URL and branch.');
            return;
        }
        resetState();
        setReviewStatus('in_progress');

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
            await new Promise(res => setTimeout(res, 1500));
            updateAgentStatus(AgentName.DRAFTING_AGENT, AgentStatus.COMPLETED);

            updateAgentStatus(AgentName.EDITING_AGENT, AgentStatus.WORKING, 'Reviewing draft...');
            await new Promise(res => setTimeout(res, 1500));
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
                await new Promise(res => setTimeout(res, 500));
                addProcessLog('Posting status check to GitHub...', 'pending');
                await new Promise(res => setTimeout(res, 1500));
                updateLastProcessLog('success');
        
                await new Promise(res => setTimeout(res, 500));
                addProcessLog('Posting report to Pull Request #42...', 'pending');
                await new Promise(res => setTimeout(res, 2000));
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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="h-10 w-10 text-cyan-400" />
                        <div>
                           <h1 className="text-2xl font-bold text-white">Agentic Code Review</h1>
                           <p className="text-sm text-gray-400">Multi-Agent System for Automated Code Analysis</p>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Public GitHub Repository</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <input
                                        type="text"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-grow bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                                        placeholder="e.g., https://github.com/example/repo"
                                        aria-label="Repository URL"
                                    />
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full sm:w-40 bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                                        placeholder="e.g., main"
                                        aria-label="Branch"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-start md:justify-end mb-2">
                                    <label htmlFor="cicd-checkbox" className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                                        <input
                                            id="cicd-checkbox"
                                            type="checkbox"
                                            checked={enableCICD}
                                            onChange={(e) => setEnableCICD(e.target.checked)}
                                            disabled={isLoading}
                                            className="h-4 w-4 rounded bg-gray-900/50 border-gray-600 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:opacity-50"
                                        />
                                        <span>Simulate CI/CD Integration</span>
                                    </label>
                                </div>
                                <div className="flex gap-4">
                                   <button
                                        onClick={handleStartReview}
                                        disabled={isLoading || !repoUrl || !branch}
                                        className="w-full flex items-center justify-center bg-cyan-600 text-white font-semibold rounded-md px-4 py-2 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Reviewing...
                                            </>
                                        ) : 'Start Review'}
                                    </button>
                                    {reviewStatus !== 'idle' && (
                                         <button
                                            onClick={resetState}
                                            disabled={isLoading}
                                            className="w-full bg-gray-700 text-white font-semibold rounded-md px-4 py-2 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                        Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-red-400 mt-4 text-sm font-mono">{error}</p>}
                    </div>

                    {reviewStatus !== 'idle' && (
                        <>
                           <div className="mb-6 border-b border-gray-700">
                                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${activeTab === 'review' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}
                                    >
                                        <LogoIcon className="h-5 w-5" />
                                        Live Review
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium ${activeTab === 'history' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}
                                    >
                                        <ChartBarIcon className="h-5 w-5" />
                                        Historical Trends
                                    </button>
                                </nav>
                            </div>
                            
                            {activeTab === 'review' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-1">
                                        <h2 className="text-xl font-semibold mb-4 text-cyan-300">Agent Team</h2>
                                        <div className="space-y-3">
                                            {agents.map(agent => <AgentCard key={agent.name} agent={agent} />)}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <KVCacheView entries={kvCache} />
                                        {finalReport && reviewStatus === 'completed' && (
                                            <div className="mt-8">
                                            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Final Report</h2>
                                            <ReportView report={finalReport} />
                                            </div>
                                        )}
                                        {processLogs.length > 0 && <ProcessLogView logs={processLogs} />}
                                    </div>
                                </div>
                            ) : (
                                <HistoricalTrendsView data={MOCK_HISTORICAL_DATA} />
                            )}
                        </>
                    )}

                </main>
            </div>
        </div>
    );
};

export default App;
