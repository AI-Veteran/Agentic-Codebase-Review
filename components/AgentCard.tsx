
import React from 'react';
import type { Agent } from '../types';
import { AgentName, AgentStatus } from '../types';
import { AGENT_CONFIGS } from '../constants';
import { SupervisorIcon } from './Icons';

interface AgentCardProps {
    agent: Agent;
}

const statusStyles: { [key in AgentStatus]: { bg: string; text: string; dot: string; } } = {
    [AgentStatus.IDLE]: { bg: 'bg-gray-700/40', text: 'text-gray-400', dot: 'bg-gray-500' },
    [AgentStatus.WORKING]: { bg: 'bg-blue-900/30', text: 'text-blue-300', dot: 'bg-blue-400 animate-pulse' },
    [AgentStatus.COMPLETED]: { bg: 'bg-green-900/30', text: 'text-green-300', dot: 'bg-green-400' },
    [AgentStatus.ERROR]: { bg: 'bg-red-900/30', text: 'text-red-300', dot: 'bg-red-400' },
};

const AgentCard: React.FC<AgentCardProps> = React.memo(({ agent }) => {
    const styles = statusStyles[agent.status];
    const config = AGENT_CONFIGS[agent.name];
    const Icon = config?.icon || SupervisorIcon;

    return (
        <div className={`flex items-center p-2 rounded border border-gray-700/50 transition-all duration-300 ${styles.bg}`}>
            <div className="mr-2.5 flex-shrink-0">
               <Icon className="h-4 w-4 text-cyan-400/80" />
            </div>
            <div className="flex-grow min-w-0 mr-1">
                <div className="flex justify-between items-center mb-0.5">
                    <p className="text-xs font-medium text-gray-200 truncate mr-1.5">{agent.name}</p>
                     <div className={`flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-900/50 ${styles.text} flex-shrink-0`}>
                        <span className={`h-1 w-1 rounded-full mr-1 ${styles.dot}`}></span>
                        {agent.status}
                    </div>
                </div>
                <p className="text-[9px] text-gray-400 truncate leading-none">{agent.role}</p>
                {agent.status === AgentStatus.WORKING && agent.task && (
                    <p className="text-[9px] text-blue-300/80 mt-0.5 animate-pulse truncate">{agent.task}</p>
                )}
            </div>
        </div>
    );
});

export default AgentCard;
