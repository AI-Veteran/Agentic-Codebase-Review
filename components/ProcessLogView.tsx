import React from 'react';
import type { CICDLog } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from './Icons';

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

const ProcessLogView: React.FC<{ logs: CICDLog[] }> = ({ logs }) => {
    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Process Log</h2>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 font-mono text-sm space-y-3">
                {logs.map((log, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            {iconMap[log.status]}
                        </div>
                        <span className={`flex-grow ${textMap[log.status]}`}>{log.message}</span>
                        {log.status === 'pending' && (
                           <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessLogView;
