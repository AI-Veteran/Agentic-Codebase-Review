
import { Type } from "@google/genai";
import { AnalysisCategory } from "../types";

export const codeSpecificSuggestionSchema = {
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

export const findingSchema = {
    type: Type.OBJECT,
    properties: {
        category: { 
            type: Type.STRING, 
            enum: Object.values(AnalysisCategory), 
            description: "The category of the weakness." 
        },
        title: { type: Type.STRING, description: "A short, descriptive title for the weakness found." },
        description: { type: Type.STRING, description: "A detailed but concise explanation of the weakness." },
        severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
        suggestion: { type: Type.STRING, description: "A high-level, code-agnostic suggestion for improvement." },
        codeSpecificSuggestion: codeSpecificSuggestionSchema
    },
    required: ['category', 'title', 'description', 'severity', 'suggestion', 'codeSpecificSuggestion']
};

export const architectureMapSchema = {
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

export const agentNotesSchema = {
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

export const agentReportSchema = {
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
