import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import React from 'react';

import { SortMode } from './campaign-progression.utils';

interface Props {
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;
    hideNoDrops: boolean;
    setHideNoDrops: (v: boolean) => void;
    hideLocked: boolean;
    setHideLocked: (v: boolean) => void;
    hideCE: boolean;
    setHideCE: (v: boolean) => void;
}

export const CampaignProgressionControls: React.FC<Props> = ({
    sortMode,
    setSortMode,
    hideNoDrops,
    setHideNoDrops,
    hideLocked,
    setHideLocked,
    hideCE,
    setHideCE,
}) => {
    return (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border) bg-(--card-bg) px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-sm text-(--muted-fg)">Sort:</span>
                <div className="flex overflow-hidden rounded-md border border-(--border) text-xs font-medium">
                    {(
                        [
                            { value: 'savings', label: 'Savings' },
                            { value: 'earlyPayoff', label: 'Early payoff' },
                            { value: 'goalPriority', label: 'Priority' },
                            { value: 'unlocks', label: 'Most unlocks' },
                        ] as const
                    ).map((option, index) => (
                        <button
                            key={option.value}
                            onClick={() => setSortMode(option.value)}
                            className={`px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset ${index > 0 ? 'border-l border-(--border)' : ''} ${sortMode === option.value ? 'bg-(--card-fg)/10 text-(--card-fg)' : 'text-(--muted-fg) hover:bg-(--muted) hover:text-(--card-fg)'}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-y-1">
                {(
                    [
                        {
                            key: 'drops',
                            label: hideNoDrops ? 'Drops only' : 'Show all',
                            checked: hideNoDrops,
                            onChange: setHideNoDrops,
                        },
                        {
                            key: 'locked',
                            label: hideLocked ? 'Hide locked' : 'Show locked',
                            checked: hideLocked,
                            onChange: setHideLocked,
                        },
                        { key: 'ce', label: 'Hide CE', checked: hideCE, onChange: setHideCE },
                    ] as const
                ).map(toggle => (
                    <FormControlLabel
                        key={toggle.key}
                        className="!mr-3 !ml-0"
                        control={
                            <Switch
                                checked={toggle.checked}
                                onChange={event => toggle.onChange(event.target.checked)}
                                size="small"
                            />
                        }
                        label={<span className="w-[4.5rem] text-[11px] text-(--muted-fg)">{toggle.label}</span>}
                    />
                ))}
            </div>
        </div>
    );
};
