
export enum AgentName {
    SUPERVISOR = 'Supervisor',
    ARCHITECTURE_ANALYST = 'Architecture Analyst',
    SECURITY_SENTINEL = 'Security Sentinel',
    EFFICIENCY_EXPERT = 'Efficiency Expert',
    MAINTAINABILITY_MAESTRO = 'Maintainability Maestro',
    DEPENDENCY_DETECTIVE = 'Dependency Detective',
    UI_UX_ANALYST = 'UI/UX Analyst',
    DRAFTING_AGENT = 'Drafting Agent',
    EDITING_AGENT = 'Editing Agent',
    REVISING_AGENT = 'Revising Agent'
}

export enum AgentStatus {
    IDLE = 'Idle',
    WORKING = 'Working',
    COMPLETED = 'Completed',
    ERROR = 'Error'
}

export enum Severity {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical'
}

export enum AnalysisCategory {
    ARCHITECTURE = 'Architecture',
    SECURITY = 'Security',
    EFFICIENCY = 'Efficiency',
    MAINTAINABILITY = 'Maintainability',
    DEPENDENCY = 'Dependency',
    UI_UX = 'UI/UX'
}

export interface Agent {
    name: AgentName;
    role: string;
    status: AgentStatus;
    task?: string;
}

export interface CodeSpecificSuggestion {
    filePath: string;
    functionName: string;
    lineStart: number;
    lineEnd: number;
    suggestion: string;
}

export interface Finding {
    category: AnalysisCategory;
    title: string;
    description: string;
    severity: Severity;
    suggestion: string; 
    codeSpecificSuggestion: CodeSpecificSuggestion;
}

export type KVCacheDataType = 'ARCHITECTURE_MAP' | 'NOTE' | 'AGENT_REPORT';

export interface BaseKVCacheEntry {
    id: number;
    type: KVCacheDataType;
    agentName: AgentName;
}

export interface ArchitectureMap {
    summary: string;
    files: Array<{
        path: string;
        description: string;
        components: string[];
    }>;
}

export interface ArchitectureMapEntry extends BaseKVCacheEntry {
    type: 'ARCHITECTURE_MAP';
    payload: ArchitectureMap;
}

export interface Note {
    filePath: string;
    finding: string;
    severity: Severity;
}

export interface NoteEntry extends BaseKVCacheEntry {
    type: 'NOTE';
    payload: Note;
}

export interface AgentReport {
    summary: string;
    findings: Finding[];
}

export interface AgentReportEntry extends BaseKVCacheEntry {
    type: 'AGENT_REPORT';
    payload: AgentReport;
}

export type KVCacheEntry = ArchitectureMapEntry | NoteEntry | AgentReportEntry;

export interface Report {
    review_id: string;
    status: 'completed' | 'in_progress' | 'error';
    report: {
        summary: string;
        agentReports: {
            agentName: AgentName;
            report: AgentReport;
        }[];
    }
}

export type ReviewStatus = 'idle' | 'in_progress' | 'completed' | 'error';

export interface HistoricalData {
    date: string;
    architecture: number;
    security: number;
    efficiency: number;
    maintainability: number;
    dependency: number;
    ui_ux: number;
}

export interface CICDLog {
    id: number;
    message: string;
    status: 'pending' | 'success' | 'error';
}

export type WorkflowEvent = 
    | { type: 'AGENT_STATUS'; agentName: AgentName; status: AgentStatus; task?: string }
    | { type: 'KV_UPDATE'; entry: Omit<KVCacheEntry, 'id'> }
    | { type: 'LOG'; message: string; status: 'pending' | 'success' | 'error' }
    | { type: 'LOG_UPDATE'; status: 'success' | 'error'; message?: string }
    | { type: 'REPORT'; report: Report }
    | { type: 'ERROR'; error: string }
    | { type: 'STATUS'; status: ReviewStatus };
