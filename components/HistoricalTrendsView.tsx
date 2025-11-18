
import React from 'react';
import type { HistoricalData, AgentName } from '../types';
import { AnalysisCategory } from '../types';
import { AGENT_CONFIGS } from '../constants';

const MIN_Y_AXIS_SCALE = 10;
const Y_AXIS_ROUNDING_FACTOR = 5;

const getMaxValue = (data: HistoricalData[]): number => {
    if (data.length === 0) return MIN_Y_AXIS_SCALE;
    let max = 0;
    data.forEach(d => {
        max = Math.max(max, d.architecture, d.security, d.efficiency, d.maintainability, d.dependency, d.ui_ux);
    });
    return Math.max(MIN_Y_AXIS_SCALE, Math.ceil(max / Y_AXIS_ROUNDING_FACTOR) * Y_AXIS_ROUNDING_FACTOR);
};

const LegendItem: React.FC<{ icon: React.ElementType, color: string, label: string }> = ({ icon: Icon, color, label }) => (
    <div className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${color}`} />
        <span>{label}</span>
    </div>
);

const HistoricalTrendsView: React.FC<{ data: HistoricalData[] }> = ({ data }) => {
    const maxValue = getMaxValue(data);
    const yAxisLabels = Array.from({ length: 6 }, (_, i) => (maxValue / 5) * i).reverse();

    const getCategoryStyle = (category: AnalysisCategory) => {
        const entry = Object.values(AGENT_CONFIGS).find(cfg => cfg.category === category);
        return entry || { icon: () => null, color: 'text-gray-500' };
    };

    const architectureStyle = getCategoryStyle(AnalysisCategory.ARCHITECTURE);
    const securityStyle = getCategoryStyle(AnalysisCategory.SECURITY);
    const efficiencyStyle = getCategoryStyle(AnalysisCategory.EFFICIENCY);
    const maintainabilityStyle = getCategoryStyle(AnalysisCategory.MAINTAINABILITY);
    const dependencyStyle = getCategoryStyle(AnalysisCategory.DEPENDENCY);
    const uiStyle = getCategoryStyle(AnalysisCategory.UI_UX);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 shadow-lg">
            <h2 className="text-lg font-semibold mb-1 text-white">Historical Trend Analysis</h2>
            <p className="text-xs text-gray-400 mb-4">Weaknesses identified over the last 5 reviews.</p>
            
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 mb-3 text-[10px] text-gray-300">
                <LegendItem icon={architectureStyle.icon} color={architectureStyle.color} label="Architecture" />
                <LegendItem icon={securityStyle.icon} color={securityStyle.color} label="Security" />
                <LegendItem icon={efficiencyStyle.icon} color={efficiencyStyle.color} label="Efficiency" />
                <LegendItem icon={maintainabilityStyle.icon} color={maintainabilityStyle.color} label="Maintainability" />
                <LegendItem icon={dependencyStyle.icon} color={dependencyStyle.color} label="Dependency" />
                <LegendItem icon={uiStyle.icon} color={uiStyle.color} label="UI/UX" />
            </div>

            <div className="flex h-64">
                <div className="flex flex-col justify-between text-right text-[10px] text-gray-400 pr-2 w-8">
                    {yAxisLabels.map(label => <span key={label}>{label}</span>)}
                </div>

                <div className="flex-1 grid grid-cols-5 gap-2 border-l border-gray-700 pl-2">
                    {data.map((review, index) => (
                        <div key={index} className="flex flex-col items-center justify-end">
                            <div className="flex w-full h-full items-end justify-center gap-0.5">
                                <div title={`Architecture: ${review.architecture}`} style={{ height: `${(review.architecture / maxValue) * 100}%` }} className="flex-1 bg-purple-500 hover:bg-purple-400 transition-colors rounded-t-sm" />
                                <div title={`Security: ${review.security}`} style={{ height: `${(review.security / maxValue) * 100}%` }} className="flex-1 bg-red-500 hover:bg-red-400 transition-colors rounded-t-sm" />
                                <div title={`Efficiency: ${review.efficiency}`} style={{ height: `${(review.efficiency / maxValue) * 100}%` }} className="flex-1 bg-yellow-500 hover:bg-yellow-400 transition-colors rounded-t-sm" />
                                <div title={`Maintainability: ${review.maintainability}`} style={{ height: `${(review.maintainability / maxValue) * 100}%` }} className="flex-1 bg-green-500 hover:bg-green-400 transition-colors rounded-t-sm" />
                                <div title={`Dependency: ${review.dependency}`} style={{ height: `${(review.dependency / maxValue) * 100}%` }} className="flex-1 bg-orange-500 hover:bg-orange-400 transition-colors rounded-t-sm" />
                                <div title={`UI/UX: ${review.ui_ux}`} style={{ height: `${(review.ui_ux / maxValue) * 100}%` }} className="flex-1 bg-pink-500 hover:bg-pink-400 transition-colors rounded-t-sm" />
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400 border-t border-gray-700 pt-1 w-full text-center">
                                {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistoricalTrendsView;
