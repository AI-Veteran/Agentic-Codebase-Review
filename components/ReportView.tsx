import React from 'react';
import { AgentName } from '../types';
import type { Report, Severity, Finding } from '../types';
import { AGENT_METADATA } from '../constants';
import { ArchitectIcon, DownloadIcon } from './Icons';

interface ReportViewProps {
    report: Report;
}

const severityStyles: { [key in Severity]: string } = {
    'Low': 'border-gray-500 text-gray-300',
    'Medium': 'border-yellow-500 text-yellow-300',
    'High': 'border-orange-500 text-orange-300',
    'Critical': 'border-red-500 text-red-300',
};

const FindingCard: React.FC<{ weakness: Finding }> = ({ weakness }) => {
    return (
        <div className={`border border-gray-700/50 rounded-lg overflow-hidden bg-gray-900/30`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{weakness.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 border rounded-full ${severityStyles[weakness.severity]}`}>{weakness.severity}</span>
                </div>

                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-gray-400 mb-1">Description</h4>
                        <p className="text-gray-300">{weakness.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-400 mb-1">Algorithmic Suggestion</h4>
                        <p className="text-gray-300 font-mono text-xs bg-gray-800/50 p-3 rounded-md">{weakness.suggestion}</p>
                    </div>
                     {weakness.codeSpecificSuggestion && (
                        <div className="border-t border-gray-700/50 pt-4">
                            <h4 className="font-semibold text-cyan-300 mb-2">Actionable Recommendation</h4>
                            <div className="font-mono text-xs bg-gray-800/50 p-3 rounded-md">
                                <div className="text-gray-400 mb-2 border-b border-gray-700 pb-2 space-y-1">
                                    <p><span className="font-semibold text-gray-200 w-20 inline-block">File:</span> {weakness.codeSpecificSuggestion.filePath}</p>
                                    <p><span className="font-semibold text-gray-200 w-20 inline-block">Function:</span> {weakness.codeSpecificSuggestion.functionName}</p>
                                    <p><span className="font-semibold text-gray-200 w-20 inline-block">Lines:</span> {weakness.codeSpecificSuggestion.lineStart}-{weakness.codeSpecificSuggestion.lineEnd}</p>
                                </div>
                                <p className="text-gray-200 whitespace-pre-wrap pt-1">{weakness.codeSpecificSuggestion.suggestion}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const generateMarkdownFinding = (finding: Finding, index: number): string => {
    let md = `#### ${index + 1}. ${finding.title}\n\n`;
    md += `- **Category:** ${finding.category}\n`;
    md += `- **Severity:** ${finding.severity}\n\n`;
    md += `**Description:**\n${finding.description}\n\n`;
    md += `**Algorithmic Suggestion:**\n`;
    md += `> ${finding.suggestion.replace(/\n/g, '\n> ')}\n\n`;

    if (finding.codeSpecificSuggestion) {
        const { filePath, functionName, lineStart, lineEnd, suggestion } = finding.codeSpecificSuggestion;
        md += `**Actionable Recommendation:**\n`;
        md += `- **File:** \`${filePath}\`\n`;
        md += `- **Function:** \`${functionName}\`\n`;
        md += `- **Lines:** \`${lineStart}-${lineEnd}\`\n\n`;
        md += `\`\`\`diff\n- (Existing Code)\n+ ${suggestion.replace(/\n/g, '\n+ ')}\n\`\`\`\n\n`;
    }
    return md;
}

const generateMarkdownFromReport = (report: Report): string => {
    const agentReportsMd = report.report.agentReports.map(agentReport => `
## ${agentReport.agentName} Report

### Summary

${agentReport.report.summary}

### Detailed Findings

${agentReport.report.findings.map(generateMarkdownFinding).join('')}
---
`).join('\n');

    return `
# Code Review Report

**Review ID:** \`${report.review_id}\`

## Executive Summary

${report.report.summary}

---

${agentReportsMd}
    `.trim();
};

const ReportView: React.FC<ReportViewProps> = ({ report }) => {
    const handleDownload = () => {
        const markdownContent = generateMarkdownFromReport(report);
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `code-review-report-${report.review_id}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
            <div className="border-b border-gray-700 pb-4 mb-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Executive Summary</h3>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-gray-700 text-gray-200 text-sm font-semibold rounded-md px-3 py-1.5 hover:bg-gray-600 transition-colors duration-200"
                        aria-label="Save report as Markdown"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        Save as Markdown
                    </button>
                </div>
                <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{report.report.summary}</p>
                <p className="mt-4 text-xs text-gray-500 font-mono">Review ID: {report.review_id}</p>
            </div>

            <div className="space-y-8">
                <h3 className="text-lg font-semibold text-white">Detailed Agent Reports</h3>
                {report.report.agentReports.map(({ agentName, report: agentReportData }) => {
                    const style = AGENT_METADATA[agentName] || {icon: ArchitectIcon, color: 'text-gray-400', bg: 'bg-gray-900/20' };
                    const Icon = style.icon;
                    return (
                        <div key={agentName} className={`border border-gray-700 rounded-lg p-5 ${style.bg}`}>
                            <div className="flex items-center gap-3 mb-4">
                               <Icon className={`h-7 w-7 ${style.color}`} />
                               <h4 className={`text-xl font-bold ${style.color}`}>{agentName} Report</h4>
                            </div>
                            <div className="pl-10">
                               <p className="text-sm text-gray-300 mb-6 italic border-l-2 border-gray-600 pl-4 py-1">{agentReportData.summary}</p>
                               <div className="space-y-4">
                                {agentReportData.findings.map((finding, index) => (
                                    <FindingCard key={index} weakness={finding} />
                                ))}
                               </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default ReportView;
