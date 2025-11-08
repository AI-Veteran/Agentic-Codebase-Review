import React, { memo } from 'react';
import type { CICDLog } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, LoadingSpinnerIcon } from './Icons';

const iconMap: { [key in CICDLog['status']]: React.ReactElement } = {
    pending: <ClockIcon className="h-5 w-5 text-blue-400" />,
    success: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    error: <XCircleIcon className="h-5 w-5 text-red-400" />,
};

const textMap: { [key in CICDLog['status']]: string } = {
    pending: 'text-blue-300',
    success: 'text-green-300',
    error: 'text-red-300',
};

const LogItem: React.FC<{ log: CICDLog }> = memo(({ log }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
            {iconMap[log.status]}
        </div>
        <span className={`flex-grow ${textMap[log.status]}`}>{log.message}</span>
        {log.status === 'pending' && (
           <LoadingSpinnerIcon className="animate-spin h-4 w-4 text-gray-400" />
        )}
    </div>
));

const ProcessLogView: React.FC<{ logs: CICDLog[] }> = ({ logs }) => {
    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Process Log</h2>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 font-mono text-sm space-y-3">
                {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}
            </div>
        </div>
    );
};

export default ProcessLogView;
