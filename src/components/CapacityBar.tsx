import React, { useId } from 'react';

interface CapacityBarProps {
    discipline: string;
    used: number;
    licensed: number;
    max: number | 'UNLIMITED';
    compactLimit?: number;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({ discipline, used, licensed, max, compactLimit }) => {
    const islimited = max !== 'UNLIMITED';
    const limitValue = islimited ? (max as number) : Math.max(licensed * 1.5, used * 1.5, 100);

    const rawId = useId();
    const id = `cb-${rawId.replace(/[:\s]/g, '')}`; // Sanitize for CSS class

    // Calculate width %
    const usedPct = Math.min(100, (used / limitValue) * 100);
    const licensedPct = Math.min(100, (licensed / limitValue) * 100);

    // Check violations for coloring
    let barColor = 'bg-blue-500';
    let message = '';

    if (used > licensed) {
        barColor = 'bg-yellow-500';
    }

    // Compact Hard Limit check handling visually
    let limitMarker = null;
    let limitCss = '';

    if (compactLimit) {
        const limitPct = Math.min(100, (compactLimit / limitValue) * 100);
        limitCss = `.${id}-limit { left: ${limitPct}%; }`;

        limitMarker = (
            <div
                className={`absolute top-0 bottom-0 w-0.5 bg-red-600 z-10 ${id}-limit`}
                title={`Compact Limit: ${compactLimit}`}
            ></div>
        );

        if (used > compactLimit) {
            barColor = 'bg-red-600';
            message = 'Exceeds Compact Limit';
        }
    }

    return (
        <div className="mb-4">
            {/* Dynamic Styles to avoid inline style attribute */}
            <style>{`
        .${id}-lic { width: ${licensedPct}%; }
        .${id}-used { width: ${usedPct}%; }
        ${limitCss}
      `}</style>

            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-gray-700">{discipline}</span>
                <span className="text-gray-500 font-mono">
                    {used} / {licensed} (Max: {max === 'UNLIMITED' ? '∞' : max})
                </span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                {/* Licensed Capacity Background */}
                <div
                    className={`absolute top-0 left-0 h-full bg-blue-100 transition-all duration-500 ${id}-lic`}
                ></div>

                {/* Used Capacity Foreground */}
                <div
                    className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-500 ${id}-used`}
                ></div>

                {/* Limit Marker */}
                {limitMarker}
            </div>
            {message && <div className="text-xs text-red-600 mt-1 font-bold">{message}</div>}
        </div>
    );
};
