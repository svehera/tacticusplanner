import React from 'react';

import { CampaignDifficulty } from './enums';

interface Props {
    difficulty: CampaignDifficulty;
    compact?: boolean;
    label?: string;
}

const DIFFICULTY_CONFIG: Record<CampaignDifficulty, { label: string; token: string }> = {
    [CampaignDifficulty.standard]: { label: 'Standard', token: 'var(--diff-standard)' },
    [CampaignDifficulty.mirror]: { label: 'Mirror', token: 'var(--diff-mirror)' },
    [CampaignDifficulty.elite]: { label: 'Elite', token: 'var(--diff-elite)' },
    [CampaignDifficulty.eventStandard]: { label: 'Standard', token: 'var(--diff-event-std)' },
    [CampaignDifficulty.eventExtremis]: { label: 'Extremis', token: 'var(--diff-event-ext)' },
    [CampaignDifficulty.eventChallenge]: { label: 'Challenge', token: 'var(--diff-event-chal)' },
};

export const DifficultyChip = ({ difficulty, compact = false, label: labelOverride }: Props) => {
    const { label: defaultLabel, token } =
        DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[CampaignDifficulty.standard];
    const label = labelOverride ?? defaultLabel;

    return (
        <span
            style={
                {
                    '--c': token,
                    background: 'color-mix(in oklab, var(--c) 14%, var(--card-bg))',
                    border: '1px solid color-mix(in oklab, var(--c) 45%, transparent)',
                    color: 'color-mix(in oklab, var(--c) 70%, var(--fg))',
                } as React.CSSProperties
            }
            className={[
                'inline-flex items-center gap-1.5 rounded-full leading-none font-bold tracking-wide whitespace-nowrap',
                compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[10.5px]',
            ].join(' ')}>
            <span
                aria-hidden="true"
                className="inline-block shrink-0 rounded-full"
                style={{ width: 6, height: 6, background: 'var(--c)' }}
            />
            {label}
        </span>
    );
};
