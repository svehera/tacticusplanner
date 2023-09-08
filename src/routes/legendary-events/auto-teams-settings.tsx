import React, { useCallback, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IAutoTeamsPreferences } from '../../models/interfaces';
import { isMobile } from 'react-device-detect';
import { pooEmoji, starEmoji } from '../../models/constants';

const AutoTeamsSettings = (props: {
    value: IAutoTeamsPreferences,
    valueChanges: (settings: IAutoTeamsPreferences) => void
}) => {
    const [preferences, setPreferences] = useState<IAutoTeamsPreferences>(props.value);

    const updatePreferences = useCallback((setting: keyof IAutoTeamsPreferences, value: boolean) => {
        
        setPreferences((previousValue) => {
            const newValue = { ...previousValue, [setting]: value };
            props.valueChanges(newValue);
            return newValue;
        });
    }, []);

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            <FormControlLabel control={<Checkbox
                checked={preferences.onlyUnlocked}
                onChange={(event) => updatePreferences('onlyUnlocked', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Only unlocked"/>
            
            <FormControlLabel control={<Checkbox
                checked={preferences.preferCampaign}
                onChange={(event) => updatePreferences('preferCampaign', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Prefer Campaign Chars"/>

            <FormControlLabel control={<Checkbox
                checked={preferences.ignoreRank}
                onChange={(event) => updatePreferences('ignoreRank', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Ignore Rank"/>

            <FormControlLabel control={<Checkbox
                checked={preferences.ignoreRarity}
                onChange={(event) => updatePreferences('ignoreRarity', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Ignore Rarity"/>

            <FormControlLabel control={<Checkbox
                checked={preferences.ignoreRecommendedFirst}
                onChange={(event) => updatePreferences('ignoreRecommendedFirst', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label={isMobile ? 'Ignore ' + starEmoji : 'Ignore recommended first'}/>

            <FormControlLabel control={<Checkbox
                checked={preferences.ignoreRecommendedLast}
                onChange={(event) => updatePreferences('ignoreRecommendedLast', event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label={isMobile ? 'Ignore ' + pooEmoji : 'Ignore recommended  last'}/>
        </FormGroup>
    );
};

export default AutoTeamsSettings;