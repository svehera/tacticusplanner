import React, { useEffect, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IAutoTeamsPreferences } from '../../store/personal-data/personal-data.interfaces';

const AutoTeamsSettings = (props: { value: IAutoTeamsPreferences , valueChanges: (settings: IAutoTeamsPreferences) => void }) => {
    const { value, valueChanges } = props;

    const [preferCampaign, setPreferCampaign] = useState(value.preferCampaign);
    const [ignoreRank, setIgnoreRank] = useState(value.ignoreRank);

    useEffect(() => {
        valueChanges({ preferCampaign, ignoreRank });
    },[preferCampaign, ignoreRank]);

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            <FormControlLabel control={<Checkbox
                checked={preferCampaign}
                onChange={(event) => setPreferCampaign(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Prefer Campaign Chars"/>

            <FormControlLabel control={<Checkbox
                checked={ignoreRank}
                onChange={(event) => setIgnoreRank(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Ignore Rank"/>
        </FormGroup>
    );
};

export default AutoTeamsSettings;