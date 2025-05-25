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
    return (
        <AccessibleTooltip title={restriction.name}>
            <div style={{ cursor: 'pointer' }} className="flex-box column" onClick={() => onCheckboxChange(!checked)}>
                <Badge color={checked ? 'success' : 'default'} badgeContent={<Check fontSize="small" />}>
                    <span style={{ width: 40 }}>{restriction.points}</span>
                </Badge>
                <LreReqImage iconId={restriction.iconId!} />
                <span>{progress}</span>
                <span style={{ fontSize: 10, maxHeight: 10 }}>{restriction.name}</span>
            </div>
        </AccessibleTooltip>
    );
};
