import React from 'react';
import type { HistoricalData } from '../types';
import { ArchitectIcon, SecurityIcon, CpuIcon, CodeIcon, PackageIcon } from './Icons';

const MIN_Y_AXIS_SCALE = 10;
const Y_AXIS_ROUNDING_FACTOR = 5;

const getMaxValue = (data: HistoricalData[]): number => {
    if (data.length === 0) return MIN_Y_AXIS_SCALE;
    let max = 0;
    data.forEach(d => {
        max = Math.max(max, d.architecture, d.security, d.efficiency, d.maintainability, d.dependency);
    });
    return Math.max(MIN_Y_AXIS_SCALE, Math.ceil(max / Y_AXIS_ROUNDING_FACTOR) * Y_AXIS_ROUNDING_FACTOR);
};

const LegendItem: React.FC<{ icon: React.ElementType, color: string, label: string }> = ({ icon: Icon, color, label }) => (
    <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span>{label}</span>
    </div>
);


const HistoricalTrendsView: React.FC<{ data: HistoricalData[] }> = ({ data }) => {
    const maxValue = getMaxValue(data);
    const yAxisLabels = Array.from({ length: 6 }, (_, i) => (maxValue / 5) * i).reverse();

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 text-white">Historical Trend Analysis</h2>
            <p className="text-sm text-gray-400 mb-6">Weaknesses identified over the last 5 reviews.</p>
            
            <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 mb-4 text-xs text-gray-300">
                <LegendItem icon={ArchitectIcon} color="text-purple-400" label="Architecture" />
                <LegendItem icon={SecurityIcon} color="text-red-400" label="Security" />
                <LegendItem icon={CpuIcon} color="text-yellow-400" label="Efficiency" />
                <LegendItem icon={CodeIcon} color="text-green-400" label="Maintainability" />
                <LegendItem icon={PackageIcon} color="text-orange-400" label="Dependency" />
            </div>

            <div className="flex h-72">
                <div className="flex flex-col justify-between text-right text-xs text-gray-400 pr-4 w-10">
                    {yAxisLabels.map(label => <span key={label}>{label}</span>)}
                </div>

                <div className="flex-1 grid grid-cols-5 gap-4 border-l border-gray-700 pl-4">
                    {data.map((review, index) => (
                        <div key={index} className="flex flex-col items-center justify-end">
                            <div className="flex w-full h-full items-end justify-center gap-0.5">
                                <div title={`Architecture: ${review.architecture}`} style={{ height: `${(review.architecture / maxValue) * 100}%` }} className="w-1/5 bg-purple-500 hover:bg-purple-400 transition-colors rounded-t-sm" />
                                <div title={`Security: ${review.security}`} style={{ height: `${(review.security / maxValue) * 100}%` }} className="w-1/5 bg-red-500 hover:bg-red-400 transition-colors rounded-t-sm" />
                                <div title={`Efficiency: ${review.efficiency}`} style={{ height: `${(review.efficiency / maxValue) * 100}%` }} className="w-1/5 bg-yellow-500 hover:bg-yellow-400 transition-colors rounded-t-sm" />
                                <div title={`Maintainability: ${review.maintainability}`} style={{ height: `${(review.maintainability / maxValue) * 100}%` }} className="w-1/5 bg-green-500 hover:bg-green-400 transition-colors rounded-t-sm" />
                                <div title={`Dependency: ${review.dependency}`} style={{ height: `${(review.dependency / maxValue) * 100}%` }} className="w-1/5 bg-orange-500 hover:bg-orange-400 transition-colors rounded-t-sm" />
                            </div>
                            <div className="mt-2 text-xs text-gray-400 border-t border-gray-700 pt-1 w-full text-center">
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
