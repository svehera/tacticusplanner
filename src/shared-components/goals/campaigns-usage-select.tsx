import { FormControl, FormHelperText, MenuItem, Select } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import React from 'react';

import { CampaignsLocationsUsage } from 'src/models/enums';

interface Props {
    value?: number;
    valueChange: (value: number) => void;
    disabled: boolean;
    allowIgnore?: boolean;
}

export const CampaignsUsageSelect: React.FC<Props> = ({ value, valueChange, disabled, allowIgnore = true }) => {
    return (
        <FormControl fullWidth disabled={disabled}>
            <InputLabel id="priority-label">Campaigns Usage</InputLabel>
            <Select<number>
                id="priority"
                labelId="priority-label"
                label="Campaigns Usage"
                value={value}
                onChange={event => valueChange(+event.target.value)}>
                {allowIgnore && (
                    <MenuItem value={CampaignsLocationsUsage.None}>Ignore all locations (Use only Onslaught)</MenuItem>
                )}
                <MenuItem value={CampaignsLocationsUsage.LeastEnergy}>Use Elite or lower (Less energy used)</MenuItem>
                <MenuItem value={CampaignsLocationsUsage.BestTime}>Use all locations (Less time spent)</MenuItem>
            </Select>
            {disabled && (
                <FormHelperText>
                    You don&apos;t have any location unlocked to farm this characters&apos; shards
                </FormHelperText>
            )}
        </FormControl>
    );
};
