import React, { memo } from 'react';
import type { CICDLog } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, LoadingSpinnerIcon } from './Icons';

const LOG_STATUS_CONFIG: Record<CICDLog['status'], { icon: React.ReactElement, textColor: string }> = {
    pending: { icon: <ClockIcon className="h-3 w-3 text-blue-400" />, textColor: 'text-blue-300' },
    success: { icon: <CheckCircleIcon className="h-3 w-3 text-green-400" />, textColor: 'text-green-300' },
    error: { icon: <XCircleIcon className="h-3 w-3 text-red-400" />, textColor: 'text-red-300' },
};

const LogItem: React.FC<{ log: CICDLog }> = memo(({ log }) => {
    const config = LOG_STATUS_CONFIG[log.status];
    return (
        <div className="flex items-center gap-2">
            <div className="flex-shrink-0 pt-0.5">
                {config.icon}
            </div>
            <span className={`flex-grow text-[10px] ${config.textColor}`}>{log.message}</span>
            {log.status === 'pending' && (
               <LoadingSpinnerIcon className="animate-spin h-2.5 w-2.5 text-gray-500" />
            )}
        </div>
    );
});

const ProcessLogView: React.FC<{ logs: CICDLog[] }> = ({ logs }) => {
    return (
        <div className="mt-3">
            <h2 className="text-sm font-semibold mb-1.5 text-cyan-300">Process Log</h2>
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-2 font-mono space-y-1">
                {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}
            </div>
        </div>
    );
};

export default ProcessLogView;