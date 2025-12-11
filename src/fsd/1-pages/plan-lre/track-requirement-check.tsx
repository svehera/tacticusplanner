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
            <div className="cursor-pointer flex-box column" onClick={() => onCheckboxChange(!checked)}>
                <Badge color={checked ? 'success' : 'default'} badgeContent={<Check fontSize="small" />}>
                    <span className="w-10">{restriction.points}</span>
                </Badge>
                <LreReqImage iconId={restriction.iconId!} />
                <span>{progress}</span>
                <span className="text-[10px] max-h-2.5">{restriction.name}</span>
            </div>
        </AccessibleTooltip>
    );
};
