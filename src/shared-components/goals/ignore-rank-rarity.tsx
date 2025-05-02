import { Info } from '@mui/icons-material';
import { FormControlLabel, Switch } from '@mui/material';
import React from 'react';

import { AccessibleTooltip } from 'src/v2/components/tooltip';

import { FlexBox } from '@/fsd/5-shared/ui';

export const IgnoreRankRarity: React.FC<{
    value: boolean;
    onChange: (value: boolean) => void;
}> = ({ value, onChange }) => {
    return (
        <FlexBox>
            <FormControlLabel
                label="Ignore Unlock/Rarity restrictions"
                control={
                    <Switch
                        checked={value}
                        onChange={event => onChange(event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
            />
            <AccessibleTooltip
                title={
                    'If you toggle on this switch then you will be able to set goal for a character you have not unlocked or ascended to required rarity yet'
                }>
                <Info color="primary" />
            </AccessibleTooltip>
        </FlexBox>
    );
};
