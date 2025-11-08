import React, { useState, memo } from 'react';
import type { KVCacheEntry, ArchitectureMapEntry, NoteEntry, AgentReportEntry } from '../types';
import { AgentName } from '../types';
import { AGENT_METADATA } from '../constants';
import { SupervisorIcon, FolderIcon } from './Icons';

const ArchitectureMapView: React.FC<{ entry: ArchitectureMapEntry }> = memo(({ entry }) => {
    const [isOpen, setIsOpen] = useState(true);
    const Icon = AGENT_METADATA[entry.agentName]?.icon || SupervisorIcon;
    return (
        <div className="bg-gray-800/60 rounded-lg p-3">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-purple-400" />
                    <div>
                        <p className="font-semibold text-purple-300">Architecture Map Generated</p>
                        <p className="text-xs text-gray-400">{entry.payload.files.length} files mapped</p>
                    </div>
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 pl-2 text-xs font-mono space-y-1">
                    <p className="text-gray-300 mb-2">{entry.payload.summary}</p>
                    {entry.payload.files.map(file => (
                       <div key={file.path} className="flex items-start">
                           <FolderIcon className="h-3 w-3 text-cyan-400 mr-2 mt-0.5 flex-shrink-0"/>
                           <p className="text-gray-400"><span className="text-cyan-300">{file.path}</span> - {file.description}</p>
                       </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const NoteView: React.FC<{ entry: NoteEntry }> = memo(({ entry }) => {
    const Icon = AGENT_METADATA[entry.agentName]?.icon || SupervisorIcon;
    return (
        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-800/40">
            <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
                <p className="text-gray-400">
                    <span className="font-semibold text-gray-300">{entry.agentName}</span> noted a <span className="font-semibold text-yellow-300">{entry.payload.severity}</span> issue in <span className="font-mono text-cyan-300">{entry.payload.filePath}</span>:
                </p>
                <p className="text-gray-300/80 pl-2 border-l-2 border-gray-700 mt-1 ml-1.5 py-1">"{entry.payload.finding}"</p>
            </div>
        </div>
    );
});

const AgentReportView: React.FC<{ entry: AgentReportEntry }> = memo(({ entry }) => {
    const Icon = AGENT_METADATA[entry.agentName]?.icon || SupervisorIcon;
    return (
         <div className="bg-gray-800/60 rounded-lg p-3">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-green-400" />
                <div>
                    <p className="font-semibold text-green-300">{entry.agentName} Report Compiled</p>
                    <p className="text-xs text-gray-400">{entry.payload.findings.length} findings detailed</p>
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
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">KV Cache Communication</h2>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3 space-y-2 max-h-[400px] lg:max-h-none overflow-y-auto">
                {entries.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">Cache is empty. Waiting for agents...</p>
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
