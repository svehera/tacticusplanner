import React, { useEffect, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IViewPreferences } from '../../models/interfaces';

const ViewSettings = (props: { value: IViewPreferences , valueChanges: (settings: IViewPreferences) => void }) => {
    const { value, valueChanges } = props;

    const [onlyUnlocked, setOnlyUnlocked] = useState(value.onlyUnlocked);
    const [usedInCampaigns, setUsedInCampaigns] = useState(value.usedInCampaigns);
    
    useEffect(() => {
        valueChanges({ onlyUnlocked, usedInCampaigns });
    },[onlyUnlocked, usedInCampaigns]);

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            <FormControlLabel control={<Checkbox
                checked={onlyUnlocked}
                onChange={(event) => setOnlyUnlocked(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Unlocked Only"/>
           
            <FormControlLabel control={<Checkbox
                checked={usedInCampaigns}
                onChange={(event) => setUsedInCampaigns(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Used in Campaigns"/>
        </FormGroup>
    );
};

export default ViewSettings;