import React from 'react';

import { XpIncomeState } from '../models';

interface OtherInnerProps {
    additionalCodicesPerWeek: number;
    onUpdate: (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => void;
}

export const OtherInner: React.FC<OtherInnerProps> = ({ additionalCodicesPerWeek, onUpdate }) => (
    <div className="space-y-2 py-1">
        <p className="text-xs text-[var(--muted-fg)]">Extra codices/week from sources not listed above.</p>
        <div className="flex items-center gap-2">
            <input
                type="number"
                min="0"
                step="1"
                value={additionalCodicesPerWeek}
                onChange={event_ =>
                    onUpdate('additionalCodicesPerWeek', event_.target.value === '' ? 0 : Number(event_.target.value))
                }
                className="w-36 rounded-[var(--radius-lg)] border border-[var(--input)] bg-[var(--bg)] px-3 py-2 text-sm font-semibold text-[var(--fg)] tabular-nums focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:outline-none"
            />
            <span className="text-xs text-[var(--muted-fg)]">codices / week</span>
        </div>
    </div>
);
