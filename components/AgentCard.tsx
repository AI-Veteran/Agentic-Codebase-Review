import React from 'react';
import type { Agent } from '../types';
import { AgentStatus } from '../types';
import { ArchitectIcon, CpuIcon, DraftIcon, EditIcon, ReviseIcon, SecurityIcon, SupervisorIcon, CodeIcon, PackageIcon } from './Icons';

interface AgentCardProps {
    agent: Agent;
}

const statusStyles: { [key in AgentStatus]: { bg: string; text: string; dot: string; } } = {
    [AgentStatus.IDLE]: { bg: 'bg-gray-700/50', text: 'text-gray-300', dot: 'bg-gray-400' },
    [AgentStatus.WORKING]: { bg: 'bg-blue-900/50', text: 'text-blue-300', dot: 'bg-blue-400 animate-pulse' },
    [AgentStatus.COMPLETED]: { bg: 'bg-green-900/50', text: 'text-green-300', dot: 'bg-green-400' },
    [AgentStatus.ERROR]: { bg: 'bg-red-900/50', text: 'text-red-300', dot: 'bg-red-400' },
};

const iconMap: { [key: string]: React.ElementType } = {
    'Supervisor': SupervisorIcon,
    'Architecture Analyst': ArchitectIcon,
    'Security Sentinel': SecurityIcon,
    'Efficiency Expert': CpuIcon,
    'Maintainability Maestro': CodeIcon,
    'Dependency Detective': PackageIcon,
    'Drafting Agent': DraftIcon,
    'Editing Agent': EditIcon,
    'Revising Agent': ReviseIcon,
};


const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
    const styles = statusStyles[agent.status];
    const Icon = iconMap[agent.name] || SupervisorIcon;

    return (
        <div className={`flex items-start p-3 rounded-lg border border-gray-700 transition-all duration-300 ${styles.bg}`}>
            <div className="mr-4 mt-1">
               <Icon className="h-7 w-7 text-cyan-400" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-white">{agent.name}</p>
                <p className="text-xs text-gray-400">{agent.role}</p>
                {agent.status === AgentStatus.WORKING && agent.task && (
                    <p className="text-xs text-blue-300/80 mt-1 animate-pulse">{agent.task}</p>
                )}
            </div>
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${styles.text} self-center`}>
                <span className={`h-2 w-2 rounded-full mr-2 ${styles.dot}`}></span>
                {agent.status}
            </div>
        </div>
    );
};

export default AgentCard;
