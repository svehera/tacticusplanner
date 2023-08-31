import React, { useEffect, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IViewPreferences } from '../../models/interfaces';

const ViewSettings = (props: { value: IViewPreferences , valueChanges: (settings: IViewPreferences) => void }) => {
    const { value, valueChanges } = props;

    const [onlyUnlocked, setOnlyUnlocked] = useState(value.onlyUnlocked);
    const [usedInCampaigns, setUsedInCampaigns] = useState(value.usedInCampaigns);
    const [showAlpha, setShowAlpha] = useState(value.showAlpha);
    const [showBeta, setShowBeta] = useState(value.showBeta);
    const [showGamma, setShowGamma] = useState(value.showGamma);
    
    useEffect(() => {
        valueChanges({ onlyUnlocked, usedInCampaigns, showAlpha, showGamma, showBeta });
    },[onlyUnlocked, usedInCampaigns, showAlpha, showGamma, showBeta]);

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

            <FormControlLabel control={<Checkbox
                checked={showAlpha}
                disabled={!showBeta && !showGamma}
                onChange={(event) => setShowAlpha(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Show Alpha Tracks"/>

            <FormControlLabel control={<Checkbox
                checked={showBeta}
                disabled={!showAlpha && !showGamma}
                onChange={(event) => setShowBeta(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Show Beta Tracks"/>

            <FormControlLabel control={<Checkbox
                checked={showGamma}
                disabled={!showAlpha && !showBeta}
                onChange={(event) => setShowGamma(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Show Gamma Tracks"/>
        </FormGroup>
    );
};

export default ViewSettings;