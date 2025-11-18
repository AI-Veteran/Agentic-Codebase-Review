
import React from 'react';
import type { Agent, HistoricalData } from './types';
import { AgentName, AgentStatus, AnalysisCategory } from './types';
import { ArchitectIcon, CpuIcon, DraftIcon, EditIcon, ReviseIcon, SecurityIcon, SupervisorIcon, CodeIcon, PackageIcon, LayoutIcon } from './components/Icons';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

export const SHORT_UI_DELAY = 500;
export const MEDIUM_UI_DELAY = 1500;
export const LONG_UI_DELAY = 2000;

export const DEFAULT_REPO_URL = 'https://github.com/AI-Veteran/Agentic-Codebase-Review';
export const DEFAULT_BRANCH = 'main';

// Consolidated Agent Configuration
export const AGENT_CONFIGS: Record<AgentName, { 
    role: string; 
    icon: React.ElementType; 
    color: string; 
    bg: string; 
    taskTemplate?: string;
    category?: AnalysisCategory;
}> = {
    [AgentName.SUPERVISOR]: { 
        role: "Orchestrates the review process.", 
        icon: SupervisorIcon, 
        color: 'text-gray-400', 
        bg: 'bg-gray-900/20' 
    },
    [AgentName.ARCHITECTURE_ANALYST]: { 
        role: "Analyzes code structure and design patterns.", 
        icon: ArchitectIcon, 
        color: 'text-purple-400', 
        bg: 'bg-purple-900/20',
        category: AnalysisCategory.ARCHITECTURE,
        taskTemplate: "You've already created an architectural map. Now, perform a deeper analysis. Identify specific architectural weaknesses (e.g., tight coupling, god objects, misplaced responsibilities)."
    },
    [AgentName.SECURITY_SENTINEL]: { 
        role: "Scans for security vulnerabilities.", 
        icon: SecurityIcon, 
        color: 'text-red-400', 
        bg: 'bg-red-900/20',
        category: AnalysisCategory.SECURITY,
        taskTemplate: "Identify all potential security vulnerabilities (e.g., XSS, SQL Injection, hardcoded secrets, insecure dependencies)."
    },
    [AgentName.EFFICIENCY_EXPERT]: { 
        role: "Identifies performance bottlenecks.", 
        icon: CpuIcon, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-900/20',
        category: AnalysisCategory.EFFICIENCY,
        taskTemplate: "Identify potential performance bottlenecks (e.g., N+1 queries, unnecessary re-renders). IMPORTANT: You must carefully evaluate if a proposed optimization preserves the original algorithm's logic. If a high-complexity algorithm is necessary for correctness, do NOT suggest a simplified version that breaks functionality; instead, note it as 'Necessary High Compute' and do not count it as a negative finding. Avoid suggestions that compromise the intended logic."
    },
    [AgentName.MAINTAINABILITY_MAESTRO]: { 
        role: "Evaluates code readability and clarity.", 
        icon: CodeIcon, 
        color: 'text-green-400', 
        bg: 'bg-green-900/20',
        category: AnalysisCategory.MAINTAINABILITY,
        taskTemplate: "Identify all potential maintainability issues (e.g., code duplication, high complexity, lack of comments, magic numbers)."
    },
    [AgentName.DEPENDENCY_DETECTIVE]: { 
        role: "Checks for outdated or vulnerable dependencies.", 
        icon: PackageIcon, 
        color: 'text-orange-400', 
        bg: 'bg-orange-900/20',
        category: AnalysisCategory.DEPENDENCY,
        taskTemplate: "Analyze the dependency files (like package.json) and codebase. Identify all dependency-related issues (e.g., outdated packages, unused dependencies, packages with known vulnerabilities)."
    },
    [AgentName.UI_UX_ANALYST]: { 
        role: "Evaluates interface design, responsiveness, and structure.", 
        icon: LayoutIcon, 
        color: 'text-pink-400', 
        bg: 'bg-pink-900/20',
        category: AnalysisCategory.UI_UX,
        taskTemplate: "Analyze the codebase for UI/UX best practices. Identify issues such as hardcoded styles, lack of responsiveness, improper HTML semantic structure (e.g., overuse of divs), accessibility gaps (missing ARIA), and layout containment issues."
    },
    [AgentName.DRAFTING_AGENT]: { 
        role: "Collates findings and drafts the report.", 
        icon: DraftIcon, 
        color: 'text-sky-400', 
        bg: 'bg-sky-900/20' 
    },
    [AgentName.EDITING_AGENT]: { 
        role: "Reviews the draft for clarity and correctness.", 
        icon: EditIcon, 
        color: 'text-sky-400', 
        bg: 'bg-sky-900/20' 
    },
    [AgentName.REVISING_AGENT]: { 
        role: "Refines the report for a polished output.", 
        icon: ReviseIcon, 
        color: 'text-sky-400', 
        bg: 'bg-sky-900/20' 
    },
};

export const AGENT_DEFINITIONS: Agent[] = Object.values(AgentName).map(name => ({
    name,
    role: AGENT_CONFIGS[name].role,
    status: AgentStatus.IDLE
}));

export const MOCK_HISTORICAL_DATA: HistoricalData[] = [
    { date: '2024-07-01', architecture: 5, security: 2, efficiency: 4, maintainability: 6, dependency: 1, ui_ux: 3 },
    { date: '2024-07-08', architecture: 4, security: 3, efficiency: 3, maintainability: 5, dependency: 1, ui_ux: 2 },
    { date: '2024-07-15', architecture: 4, security: 1, efficiency: 2, maintainability: 3, dependency: 2, ui_ux: 4 },
    { date: '2024-07-22', architecture: 2, security: 1, efficiency: 2, maintainability: 2, dependency: 0, ui_ux: 1 },
    { date: '2024-07-29', architecture: 1, security: 0, efficiency: 1, maintainability: 1, dependency: 0, ui_ux: 0 },
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

export const buildAgentPrompt = (agentName: AgentName): string => {
    const task = AGENT_CONFIGS[agentName].taskTemplate;
    if (!task) return "";
    return `As a ${agentName}, review the entire codebase provided. Use the architecture map for context. ${task} For each finding, provide the file path, a description of the issue, and a severity level.`;
};
