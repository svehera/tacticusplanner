import { IHeaderParams } from 'ag-grid-community';
import React from 'react';
import { Check } from '@mui/icons-material';
import { ILegendaryEventTrackRequirement } from 'src/models/interfaces';
import { Badge } from '@mui/material';
import { LreReqImage } from 'src/v2/components/images/lre-req-image';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

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
            </div>
        </AccessibleTooltip>
    );
};
