
import React, { useState, memo } from 'react';
import type { KVCacheEntry, ArchitectureMapEntry, NoteEntry, AgentReportEntry } from '../types';
import { AGENT_CONFIGS } from '../constants';
import { SupervisorIcon, FolderIcon } from './Icons';

const ArchitectureMapView: React.FC<{ entry: ArchitectureMapEntry }> = memo(({ entry }) => {
    const [isOpen, setIsOpen] = useState(false);
    const Icon = AGENT_CONFIGS[entry.agentName]?.icon || SupervisorIcon;
    return (
        <div className="bg-gray-800/40 rounded border border-gray-700/50">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left p-2">
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-purple-400" />
                    <div>
                        <p className="text-[10px] font-semibold text-purple-300">Architecture Map</p>
                        <p className="text-[9px] text-gray-500 leading-none">{entry.payload.files.length} files</p>
                    </div>
                </div>
                <svg width="12" height="12" className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="border-t border-gray-700/30 px-2 py-2 text-[10px] font-mono space-y-1 bg-gray-900/30">
                    <p className="text-gray-400 mb-1.5 leading-relaxed">{entry.payload.summary}</p>
                    <div className="max-h-32 overflow-y-auto space-y-0.5 pr-1">
                        {entry.payload.files.map(file => (
                        <div key={file.path} className="flex items-start gap-1.5">
                            <FolderIcon className="h-2.5 w-2.5 text-cyan-500/70 mt-0.5 flex-shrink-0"/>
                            <p className="text-gray-500 truncate"><span className="text-cyan-300/80">{file.path}</span> - {file.description}</p>
                        </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

const NoteView: React.FC<{ entry: NoteEntry }> = memo(({ entry }) => {
    const Icon = AGENT_CONFIGS[entry.agentName]?.icon || SupervisorIcon;
    return (
        <div className="flex items-start gap-2 p-2 rounded hover:bg-gray-800/40 border border-transparent hover:border-gray-700/30 transition-colors">
            <Icon className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] leading-relaxed w-full">
                <div className="flex justify-between">
                     <p className="text-gray-400">
                        <span className="font-semibold text-gray-300">{entry.agentName}</span>
                    </p>
                     <span className={`text-[9px] px-1 rounded border ${entry.payload.severity === 'Critical' || entry.payload.severity === 'High' ? 'border-red-500/30 text-red-400' : 'border-gray-600 text-gray-500'}`}>{entry.payload.severity}</span>
                </div>
                <p className="text-gray-300/90 mt-0.5">"{entry.payload.finding}"</p>
            </div>
        </div>
    );
});

const AgentReportView: React.FC<{ entry: AgentReportEntry }> = memo(({ entry }) => {
    const Icon = AGENT_CONFIGS[entry.agentName]?.icon || SupervisorIcon;
    return (
         <div className="bg-green-900/10 border border-green-900/30 rounded p-2">
            <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-green-400" />
                <div>
                    <p className="text-[10px] font-medium text-green-300">{entry.agentName} Report</p>
                    <p className="text-[9px] text-green-500/70 leading-none">{entry.payload.findings.length} findings</p>
                </div>
            </div>
         </div>
    );
});

const entryComponentMap: { [key in KVCacheEntry['type']]: React.FC<{ entry: any }> } = {
    'ARCHITECTURE_MAP': ArchitectureMapView,
    'NOTE': NoteView,
    'AGENT_REPORT': AgentReportView,
};

const KVCacheView: React.FC<{ entries: KVCacheEntry[] }> = ({ entries }) => {
    return (
        <div>
            <h2 className="text-sm font-semibold mb-2 text-cyan-300">KV Cache Communication</h2>
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-1.5 space-y-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                {entries.length === 0 ? (
                    <p className="text-gray-600 text-center py-4 text-[10px] italic">Cache is empty. Waiting for agents...</p>
                ) : (
                    entries.map((entry) => {
                        const Component = entryComponentMap[entry.type];
                        return Component ? <Component key={entry.id} entry={entry} /> : null;
                    })
                )}
            </div>
        </div>
    );
};

export default KVCacheView;
