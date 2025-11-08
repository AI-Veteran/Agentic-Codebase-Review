import type { Agent, HistoricalData } from './types';
import { AgentName, AgentStatus } from './types';

export const AGENT_DEFINITIONS: Agent[] = [
    {
        name: AgentName.SUPERVISOR,
        role: "Orchestrates the review process.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.ARCHITECTURE_ANALYST,
        role: "Analyzes code structure and design patterns.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.SECURITY_SENTINEL,
        role: "Scans for security vulnerabilities.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.EFFICIENCY_EXPERT,
        role: "Identifies performance bottlenecks.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.MAINTAINABILITY_MAESTRO,
        role: "Evaluates code readability and clarity.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.DEPENDENCY_DETECTIVE,
        role: "Checks for outdated or vulnerable dependencies.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.DRAFTING_AGENT,
        role: "Collates findings and drafts the report.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.EDITING_AGENT,
        role: "Reviews the draft for clarity and correctness.",
        status: AgentStatus.IDLE
    },
    {
        name: AgentName.REVISING_AGENT,
        role: "Refines the report for a polished output.",
        status: AgentStatus.IDLE
    }
];

export const MOCK_HISTORICAL_DATA: HistoricalData[] = [
    { date: '2024-07-01', architecture: 5, security: 2, efficiency: 4, maintainability: 6, dependency: 1 },
    { date: '2024-07-08', architecture: 4, security: 3, efficiency: 3, maintainability: 5, dependency: 1 },
    { date: '2024-07-15', architecture: 4, security: 1, efficiency: 2, maintainability: 3, dependency: 2 },
    { date: '2024-07-22', architecture: 2, security: 1, efficiency: 2, maintainability: 2, dependency: 0 },
    { date: '2024-07-29', architecture: 1, security: 0, efficiency: 1, maintainability: 1, dependency: 0 },
];