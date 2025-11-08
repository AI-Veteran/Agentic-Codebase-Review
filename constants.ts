import React from 'react';
import type { Agent, HistoricalData } from './types';
import { AgentName, AgentStatus } from './types';
import { ArchitectIcon, CpuIcon, DraftIcon, EditIcon, ReviseIcon, SecurityIcon, SupervisorIcon, CodeIcon, PackageIcon } from './components/Icons';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

export const SHORT_UI_DELAY = 500;
export const MEDIUM_UI_DELAY = 1500;
export const LONG_UI_DELAY = 2000;

export const AGENT_DEFINITIONS: Agent[] = [
    { name: AgentName.SUPERVISOR, role: "Orchestrates the review process.", status: AgentStatus.IDLE },
    { name: AgentName.ARCHITECTURE_ANALYST, role: "Analyzes code structure and design patterns.", status: AgentStatus.IDLE },
    { name: AgentName.SECURITY_SENTINEL, role: "Scans for security vulnerabilities.", status: AgentStatus.IDLE },
    { name: AgentName.EFFICIENCY_EXPERT, role: "Identifies performance bottlenecks.", status: AgentStatus.IDLE },
    { name: AgentName.MAINTAINABILITY_MAESTRO, role: "Evaluates code readability and clarity.", status: AgentStatus.IDLE },
    { name: AgentName.DEPENDENCY_DETECTIVE, role: "Checks for outdated or vulnerable dependencies.", status: AgentStatus.IDLE },
    { name: AgentName.DRAFTING_AGENT, role: "Collates findings and drafts the report.", status: AgentStatus.IDLE },
    { name: AgentName.EDITING_AGENT, role: "Reviews the draft for clarity and correctness.", status: AgentStatus.IDLE },
    { name: AgentName.REVISING_AGENT, role: "Refines the report for a polished output.", status: AgentStatus.IDLE }
];

export const AGENT_METADATA: Record<AgentName, { icon: React.ElementType, color: string, bg: string }> = {
    [AgentName.SUPERVISOR]: { icon: SupervisorIcon, color: 'text-gray-400', bg: 'bg-gray-900/20' },
    [AgentName.ARCHITECTURE_ANALYST]: { icon: ArchitectIcon, color: 'text-purple-400', bg: 'bg-purple-900/20' },
    [AgentName.SECURITY_SENTINEL]: { icon: SecurityIcon, color: 'text-red-400', bg: 'bg-red-900/20' },
    [AgentName.EFFICIENCY_EXPERT]: { icon: CpuIcon, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    [AgentName.MAINTAINABILITY_MAESTRO]: { icon: CodeIcon, color: 'text-green-400', bg: 'bg-green-900/20' },
    [AgentName.DEPENDENCY_DETECTIVE]: { icon: PackageIcon, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    [AgentName.DRAFTING_AGENT]: { icon: DraftIcon, color: 'text-sky-400', bg: 'bg-sky-900/20' },
    [AgentName.EDITING_AGENT]: { icon: EditIcon, color: 'text-sky-400', bg: 'bg-sky-900/20' },
    [AgentName.REVISING_AGENT]: { icon: ReviseIcon, color: 'text-sky-400', bg: 'bg-sky-900/20' },
};

export const MOCK_HISTORICAL_DATA: HistoricalData[] = [
    { date: '2024-07-01', architecture: 5, security: 2, efficiency: 4, maintainability: 6, dependency: 1 },
    { date: '2024-07-08', architecture: 4, security: 3, efficiency: 3, maintainability: 5, dependency: 1 },
    { date: '2024-07-15', architecture: 4, security: 1, efficiency: 2, maintainability: 3, dependency: 2 },
    { date: '2024-07-22', architecture: 2, security: 1, efficiency: 2, maintainability: 2, dependency: 0 },
    { date: '2024-07-29', architecture: 1, security: 0, efficiency: 1, maintainability: 1, dependency: 0 },
];

// GitHub Service Constants
export const GITHUB_API_BASE = 'https://api.github.com';
export const MAX_FILES_TO_PROCESS = 50;
export const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.cs', '.html', '.css', '.scss', '.json', '.yml', '.yaml', '.md', 'Dockerfile'];
export const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', 'coverage', '.git', '.github', 'vendor', 'target', 'assets', 'img', 'images', 'docs'];
export const FILE_PRIORITY_ORDER = [
    'package.json', 'Dockerfile', '.ts', '.tsx', '.js', '.jsx',
    '.py', '.java', '.go', '.rb', '.php', '.cs', '.html', '.css', '.scss',
    '.yml', '.yaml', '.json', '.md'
];

// Gemini Service Constants
const AGENT_TASK_TEMPLATES: Record<string, string> = {
    [AgentName.SECURITY_SENTINEL]: "Identify all potential security vulnerabilities (e.g., XSS, SQL Injection, hardcoded secrets, insecure dependencies).",
    [AgentName.EFFICIENCY_EXPERT]: "Identify all potential performance bottlenecks or inefficient practices (e.g., N+1 queries, unnecessary re-renders, inefficient loops).",
    [AgentName.MAINTAINABILITY_MAESTRO]: "Identify all potential maintainability issues (e.g., code duplication, high complexity, lack of comments, magic numbers).",
    [AgentName.DEPENDENCY_DETECTIVE]: "Analyze the dependency files (like package.json) and codebase. Identify all dependency-related issues (e.g., outdated packages, unused dependencies, packages with known vulnerabilities).",
    [AgentName.ARCHITECTURE_ANALYST]: "You've already created an architectural map. Now, perform a deeper analysis. Identify specific architectural weaknesses (e.g., tight coupling, god objects, misplaced responsibilities)."
};

export const buildAgentPrompt = (agentName: AgentName): string => {
    const task = AGENT_TASK_TEMPLATES[agentName];
    if (!task) return "";
    return `As a ${agentName}, review the entire codebase provided. Use the architecture map for context. ${task} For each finding, provide the file path, a description of the issue, and a severity level.`;
};
