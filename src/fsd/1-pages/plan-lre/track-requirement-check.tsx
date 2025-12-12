import { Check } from '@mui/icons-material';
import { Badge } from '@mui/material';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { LreReqImage } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrackRequirement } from '@/fsd/3-features/lre';

interface Props {
    checked: boolean;
    restriction: ILegendaryEventTrackRequirement;
    onCheckboxChange: (selected: boolean) => void;
    progress: string;
}

export const TrackRequirementCheck: React.FC<Props> = ({ restriction, checked, progress, onCheckboxChange }) => {
    const handleToggle = () => {
        onCheckboxChange(!checked);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            handleToggle();
        }
    };

    return (
        <AccessibleTooltip title={restriction.name}>
            <div
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                className="flex-box column"
                onClick={handleToggle}
                onKeyDown={handleKeyDown}>
                <Badge
                    color={checked ? 'success' : 'default'}
                    badgeContent={checked ? <Check fontSize="small" /> : undefined}>
                    <span style={{ width: 40 }}>{restriction.points}</span>
                </Badge>
                <LreReqImage iconId={restriction.iconId ?? ''} />
                <span>{progress}</span>
                <span style={{ fontSize: 10, maxHeight: 10 }}>{restriction.name}</span>
            </div>
        </AccessibleTooltip>
    );
};
