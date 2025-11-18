import React from 'react';
import { AgentName } from '../types';
import type { Report, Severity, Finding } from '../types';
import { AGENT_CONFIGS } from '../constants';
import { ArchitectIcon, DownloadIcon } from './Icons';

interface ReportViewProps {
    report: Report;
}

const severityStyles: { [key in Severity]: string } = {
    'Low': 'border-gray-500 text-gray-400',
    'Medium': 'border-yellow-600 text-yellow-400',
    'High': 'border-orange-600 text-orange-400',
    'Critical': 'border-red-600 text-red-400',
};

const FindingCard: React.FC<{ weakness: Finding }> = React.memo(({ weakness }) => {
    return (
        <div className={`border border-gray-700/40 rounded overflow-hidden bg-gray-900/20`}>
            <div className="p-2">
                <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-xs font-semibold text-gray-200 leading-tight pr-2">{weakness.title}</h3>
                    <span className={`text-[9px] font-mono px-1 py-0.5 border rounded ${severityStyles[weakness.severity]}`}>{weakness.severity}</span>
                </div>

                <div className="space-y-2 text-[10px]">
                    <div>
                        <p className="text-gray-400 leading-relaxed">{weakness.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-500 mb-0.5 uppercase text-[9px] tracking-wider">Suggestion</h4>
                        <p className="text-gray-300 font-mono bg-gray-800/30 p-1.5 rounded border border-gray-700/30">{weakness.suggestion}</p>
                    </div>
                     {weakness.codeSpecificSuggestion && (
                        <div className="border-t border-gray-700/30 pt-1.5">
                            <h4 className="font-semibold text-cyan-400/80 mb-1 uppercase text-[9px] tracking-wider">Code Fix</h4>
                            <div className="font-mono bg-gray-800/30 p-1.5 rounded border border-gray-700/30">
                                <div className="text-gray-500 mb-1 border-b border-gray-700/50 pb-1 space-y-0.5">
                                    <div className="flex"><span className="font-medium text-gray-400 w-12">File:</span> <span className="truncate">{weakness.codeSpecificSuggestion.filePath}</span></div>
                                    <div className="flex"><span className="font-medium text-gray-400 w-12">Func:</span> {weakness.codeSpecificSuggestion.functionName}</div>
                                    <div className="flex"><span className="font-medium text-gray-400 w-12">Lines:</span> {weakness.codeSpecificSuggestion.lineStart}-{weakness.codeSpecificSuggestion.lineEnd}</div>
                                </div>
                                <p className="text-cyan-100 whitespace-pre-wrap text-[9px] leading-snug">{weakness.codeSpecificSuggestion.suggestion}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

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
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 shadow-lg">
            <div className="border-b border-gray-700 pb-2 mb-3">
                 <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 bg-gray-700 text-gray-200 text-[10px] font-medium rounded px-2 py-1 hover:bg-gray-600 transition-colors duration-200"
                        aria-label="Save report as Markdown"
                    >
                        <DownloadIcon className="h-3 w-3" />
                        Markdown
                    </button>
                </div>
                <p className="mt-2 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{report.report.summary}</p>
                <p className="mt-1 text-[9px] text-gray-600 font-mono">Review ID: {report.review_id}</p>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Detailed Agent Reports</h3>
                {report.report.agentReports.map(({ agentName, report: agentReportData }) => {
                    const style = AGENT_CONFIGS[agentName] || {icon: ArchitectIcon, color: 'text-gray-400', bg: 'bg-gray-900/20' };
                    const Icon = style.icon;
                    return (
                        <div key={agentName} className={`border border-gray-700/50 rounded-lg p-2.5 ${style.bg}`}>
                            <div className="flex items-center gap-2 mb-2">
                               <Icon className={`h-4 w-4 ${style.color}`} />
                               <h4 className={`text-xs font-bold ${style.color} uppercase tracking-wide`}>{agentName}</h4>
                            </div>
                            <div className="pl-1">
                               <p className="text-[10px] text-gray-300 mb-3 italic border-l-2 border-gray-600 pl-2 py-0.5 leading-relaxed">{agentReportData.summary}</p>
                               <div className="space-y-2">
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