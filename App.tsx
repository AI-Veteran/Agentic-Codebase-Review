import React, { useState, useMemo } from 'react';
import { DEFAULT_REPO_URL, DEFAULT_BRANCH, MOCK_HISTORICAL_DATA } from './constants';
import { useReviewSession } from './hooks/useReviewSession';
import AgentCard from './components/AgentCard';
import KVCacheView from './components/KVCacheView';
import ReportView from './components/ReportView';
import ProcessLogView from './components/ProcessLogView';
import HistoricalTrendsView from './components/HistoricalTrendsView';
import { LogoIcon, ChartBarIcon, LoadingSpinnerIcon } from './components/Icons';

const App: React.FC = () => {
    // UI Input State
    const [repoUrl, setRepoUrl] = useState<string>(DEFAULT_REPO_URL);
    const [branch, setBranch] = useState<string>(DEFAULT_BRANCH);
    const [enableCICD, setEnableCICD] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');

    // Logic & Session State (extracted to hook)
    const { 
        status: reviewStatus, 
        agents, 
        kvCache, 
        report: finalReport, 
        logs: processLogs, 
        error, 
        startReview, 
        resetSession 
    } = useReviewSession();

    const isLoading = useMemo(() => reviewStatus === 'in_progress', [reviewStatus]);

    const handleStart = async () => {
        if (!repoUrl || !branch) return;
        setActiveTab('review');
        await startReview(repoUrl, branch, enableCICD);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-2 sm:p-3 lg:p-4">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <LogoIcon className="h-6 w-6 text-cyan-400" />
                        <div>
                           <h1 className="text-lg font-bold text-white">Agentic Code Review</h1>
                           <p className="text-[10px] text-gray-400">Multi-Agent System for Automated Code Analysis</p>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-medium text-gray-300 mb-1">Public GitHub Repository</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-grow bg-gray-900/50 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                                        placeholder="e.g., https://github.com/example/repo"
                                        aria-label="Repository URL"
                                    />
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full sm:w-24 bg-gray-900/50 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                                        placeholder="e.g., main"
                                        aria-label="Branch"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-start md:justify-end mb-1">
                                    <label htmlFor="cicd-checkbox" className="flex items-center space-x-1.5 text-[10px] text-gray-300 cursor-pointer">
                                        <input
                                            id="cicd-checkbox"
                                            type="checkbox"
                                            checked={enableCICD}
                                            onChange={(e) => setEnableCICD(e.target.checked)}
                                            disabled={isLoading}
                                            className="h-3 w-3 rounded bg-gray-900/50 border-gray-600 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:opacity-50"
                                        />
                                        <span>Simulate CI/CD Integration</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                   <button
                                        onClick={handleStart}
                                        disabled={isLoading || !repoUrl || !branch}
                                        className="w-full flex items-center justify-center bg-cyan-600 text-white font-semibold rounded px-3 py-1 text-xs hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoadingSpinnerIcon className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" />
                                                Reviewing...
                                            </>
                                        ) : 'Start Review'}
                                    </button>
                                    {reviewStatus !== 'idle' && (
                                         <button
                                            onClick={resetSession}
                                            disabled={isLoading}
                                            className="w-full bg-gray-700 text-white font-semibold rounded px-3 py-1 text-xs hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                        Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-red-400 mt-1.5 text-[10px] font-mono">{error}</p>}
                    </div>

                    {reviewStatus !== 'idle' && (
                        <>
                           <div className="mb-3 border-b border-gray-700">
                                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-1.5 px-1 text-xs font-medium ${activeTab === 'review' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}
                                    >
                                        <LogoIcon className="h-3.5 w-3.5" />
                                        Live Review
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-1.5 px-1 text-xs font-medium ${activeTab === 'history' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'}`}
                                    >
                                        <ChartBarIcon className="h-3.5 w-3.5" />
                                        Historical Trends
                                    </button>
                                </nav>
                            </div>
                            
                            {activeTab === 'review' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                                    <div className="lg:col-span-1">
                                        <h2 className="text-sm font-semibold mb-2 text-cyan-300">Agent Team</h2>
                                        <div className="space-y-1.5">
                                            {agents.map(agent => <AgentCard key={agent.name} agent={agent} />)}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2 space-y-4">
                                        <KVCacheView entries={kvCache} />
                                        {processLogs.length > 0 && <ProcessLogView logs={processLogs} />}
                                        {finalReport && reviewStatus === 'completed' && (
                                            <div>
                                                <h2 className="text-sm font-semibold mb-2 text-cyan-300">Final Report</h2>
                                                <ReportView report={finalReport} />
                                            </div>
                                        )}
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