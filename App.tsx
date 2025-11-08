import React, { useState, useCallback, useMemo } from 'react';
import type { Agent, KVCacheEntry, Report, ReviewStatus, CICDLog } from './types';
// FIX: AgentStatus is not exported from constants.ts and is not used in this file.
import { AGENT_DEFINITIONS, MOCK_HISTORICAL_DATA } from './constants';
import { runReviewWorkflow } from './services/workflowService';
import AgentCard from './components/AgentCard';
import KVCacheView from './components/KVCacheView';
import ReportView from './components/ReportView';
import ProcessLogView from './components/ProcessLogView';
import HistoricalTrendsView from './components/HistoricalTrendsView';
import { LogoIcon, ChartBarIcon, LoadingSpinnerIcon } from './components/Icons';

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

    const resetState = useCallback(() => {
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
    }, []);

    const handleStartReview = async () => {
        if (!repoUrl || !branch) {
            setError('Please provide a repository URL and branch.');
            return;
        }
        // Reset state for a new review, except for inputs
        setReviewStatus('idle');
        setAgents(AGENT_DEFINITIONS);
        setKvCache([]);
        setFinalReport(null);
        setError(null);
        setProcessLogs([]);
        
        setReviewStatus('in_progress');

        await runReviewWorkflow({
            repoUrl,
            branch,
            enableCICD,
            setAgents,
            setKvCache,
            setFinalReport,
            setProcessLogs,
            setError,
            setReviewStatus,
        });
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
                                                <LoadingSpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
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