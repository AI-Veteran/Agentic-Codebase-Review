import { GoogleGenAI, Type } from "@google/genai";
// Fix: Import AgentName as a value, not just a type, since it's an enum.
import { AgentName } from '../types';
import type { Severity, Finding, KVCacheEntry, AgentReport, Note, ArchitectureMap } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const codeSpecificSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        filePath: { type: Type.STRING, description: "The full path of the file where the issue is located." },
        functionName: { type: Type.STRING, description: "The name of the function where the issue is located." },
        lineStart: { type: Type.INTEGER, description: "The starting line number of the code block." },
        lineEnd: { type: Type.INTEGER, description: "The ending line number of the code block." },
        suggestion: { type: Type.STRING, description: "A concrete, code-specific suggestion for the fix." }
    },
    required: ['filePath', 'functionName', 'lineStart', 'lineEnd', 'suggestion']
};

const findingSchema = {
    type: Type.OBJECT,
    properties: {
        // Fix: Add the 'category' property to align with the 'Finding' type definition.
        category: { type: Type.STRING, enum: ['Architecture', 'Security', 'Efficiency', 'Maintainability', 'Dependency'], description: "The category of the weakness." },
        title: { type: Type.STRING, description: "A short, descriptive title for the weakness found." },
        description: { type: Type.STRING, description: "A detailed but concise explanation of the weakness." },
        severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
        suggestion: { type: Type.STRING, description: "A high-level, code-agnostic suggestion for improvement." },
        codeSpecificSuggestion: codeSpecificSuggestionSchema
    },
    // Fix: Add 'category' to the list of required properties.
    required: ['category', 'title', 'description', 'severity', 'suggestion', 'codeSpecificSuggestion']
};

const architectureMapSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the overall architecture."},
        files: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    path: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A one-sentence description of the file's purpose."},
                    components: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key functions or classes in this file."}
                },
                required: ["path", "description", "components"]
            }
        }
    },
    required: ["summary", "files"]
};

const agentNotesSchema = {
    type: Type.OBJECT,
    properties: {
        notes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    filePath: { type: Type.STRING, description: "The path to the file where the observation was made." },
                    finding: { type: Type.STRING, description: "A detailed description of the specific finding or observation."},
                    severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] }
                },
                required: ['filePath', 'finding', 'severity']
            }
        }
    },
    required: ['notes']
};

const agentReportSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A concise summary of all findings for this agent's domain." },
        findings: {
            type: Type.ARRAY,
            items: findingSchema
        }
    },
    required: ['summary', 'findings']
};


const callGemini = async <T>(prompt: string, schema: object): Promise<T> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema
        }
    });
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", response.text, e);
        throw new Error(`Could not generate a valid JSON response.`);
    }
};

export const generateArchitectureMap = (codeContext: string): Promise<ArchitectureMap> => {
    const prompt = `As an Architecture Analyst, analyze the provided codebase and generate a high-level architecture map. 
    Provide a brief summary of the overall architecture. Then, for each significant file, list its path, a one-sentence description of its purpose, and the key components (classes, functions) it contains.
    
    CODEBASE CONTEXT:
    ${codeContext}`;
    return callGemini<ArchitectureMap>(prompt, architectureMapSchema);
};

const AGENT_PROMPTS: Record<string, string> = {
    [AgentName.SECURITY_SENTINEL]: "As a Security Sentinel, review the entire codebase provided. Use the architecture map for context. Identify all potential security vulnerabilities (e.g., XSS, SQL Injection, hardcoded secrets, insecure dependencies). For each finding, provide the file path, a description of the issue, and a severity level.",
    [AgentName.EFFICIENCY_EXPERT]: "As an Efficiency Expert, review the entire codebase provided. Use the architecture map for context. Identify all potential performance bottlenecks or inefficient practices (e.g., N+1 queries, unnecessary re-renders, inefficient loops). For each finding, provide the file path, a description of the issue, and a severity level.",
    [AgentName.MAINTAINABILITY_MAESTRO]: "As a Maintainability Maestro, review the entire codebase provided. Use the architecture map for context. Identify all potential maintainability issues (e.g., code duplication, high complexity, lack of comments, magic numbers). For each finding, provide the file path, a description of the issue, and a severity level.",
    [AgentName.DEPENDENCY_DETECTIVE]: "As a Dependency Detective, analyze the dependency files (like package.json) and codebase. Use the architecture map for context. Identify all dependency-related issues (e.g., outdated packages, unused dependencies, packages with known vulnerabilities). For each finding, provide the file path (e.g., package.json), a description of the issue, and a severity level.",
    [AgentName.ARCHITECTURE_ANALYST]: "As an Architecture Analyst, you've already created an architectural map. Now, perform a deeper analysis. Identify specific architectural weaknesses (e.g., tight coupling, god objects, misplaced responsibilities). For each finding, provide the file path, a description of the issue, and a severity level."
};

export const generateAgentNotes = async (agentName: AgentName, codeContext: string, architectureMap: ArchitectureMap): Promise<Note[]> => {
    const specializedPrompt = AGENT_PROMPTS[agentName];
    if (!specializedPrompt) {
        throw new Error(`No prompt defined for agent: ${agentName}`);
    }

    const prompt = `${specializedPrompt}
    
    ARCHITECTURE MAP for context:
    ${JSON.stringify(architectureMap, null, 2)}

    Full CODEBASE CONTEXT:
    ${codeContext}
    
    Return your findings as a JSON object containing a 'notes' array.`;

    const result = await callGemini<{ notes: Note[] }>(prompt, agentNotesSchema);
    return result.notes;
};

export const generateAgentReport = (agentName: AgentName, category: Finding['category'], notes: Note[]): Promise<AgentReport> => {
    const prompt = `You are the ${agentName}. You have made the following observations (notes) about the codebase.
    
    Your task is to consolidate these raw notes into a formal, structured report. 
    1. Write a concise summary of your overall findings.
    2. For each distinct issue identified in the notes, create a detailed finding. Each finding must include a title, a full description, a severity, a high-level suggestion, and a concrete, code-specific recommendation.
    
    Raw Notes:
    ${JSON.stringify(notes, null, 2)}
    
    Please ensure the 'category' for all findings is '${category}'.`;
    
    // Fix: Create a new schema object instead of mutating the original one to avoid side effects.
    // This dynamically constrains the 'category' property to only the one relevant for the current agent.
    const dynamicFindingSchema = {
        ...findingSchema,
        properties: {
            ...findingSchema.properties,
            category: { type: Type.STRING, enum: [category] }
        }
    };

    const dynamicAgentReportSchema = {
        ...agentReportSchema,
        properties: {
            ...agentReportSchema.properties,
            findings: {
                type: Type.ARRAY,
                items: dynamicFindingSchema,
            }
        }
    };
    
    return callGemini<AgentReport>(prompt, dynamicAgentReportSchema);
};

export const generateFinalReportSummary = async (agentReports: { agentName: AgentName; report: AgentReport }[]): Promise<string> => {
    const prompt = `You are the Revising Agent, responsible for the final output. Multiple specialist agents have submitted their reports on a codebase.
    
    Synthesize these reports into a single, comprehensive executive summary. This summary should be professional, insightful, and provide a holistic overview of the code's health. 
    
    - Start with a high-level statement.
    - Weave together the key themes from each agent's report.
    - Highlight the most critical areas for immediate improvement.
    - Conclude with an encouraging and forward-looking statement.
    
    Do not simply list the individual summaries. Create a coherent narrative.
    
    Agent Reports:
    ${JSON.stringify(agentReports, null, 2)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.trim();
};