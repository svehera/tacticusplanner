import React, { useEffect, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IAutoTeamsPreferences } from '../../models/interfaces';
import { isMobile } from 'react-device-detect';
import { pooEmoji, starEmoji } from '../../models/constants';

const AutoTeamsSettings = (props: { value: IAutoTeamsPreferences , valueChanges: (settings: IAutoTeamsPreferences) => void }) => {
    const { value, valueChanges } = props;

    const [preferCampaign, setPreferCampaign] = useState(value.preferCampaign);
    const [ignoreRank, setIgnoreRank] = useState(value.ignoreRank);
    const [ignoreRarity, setIgnoreRarity] = useState(value.ignoreRarity);
    const [ignoreRecommendedFirst, setIgnoreRecommendedFirst] = useState(value.ignoreRecommendedFirst);
    const [ignoreRecommendedLast, setIgnoreRecommendedLast] = useState(value.ignoreRecommendedLast);

    useEffect(() => {
        valueChanges({ preferCampaign, ignoreRank, ignoreRecommendedFirst, ignoreRecommendedLast, ignoreRarity });
    },[preferCampaign, ignoreRank, ignoreRecommendedFirst, ignoreRecommendedLast, ignoreRarity]);

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

            <FormControlLabel control={<Checkbox
                checked={ignoreRarity}
                onChange={(event) => setIgnoreRarity(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Ignore Rarity"/>

            <FormControlLabel control={<Checkbox
                checked={ignoreRecommendedFirst}
                onChange={(event) => setIgnoreRecommendedFirst(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label={ isMobile ? 'Ignore ' + starEmoji : 'Ignore recommended first'}/>

            <FormControlLabel control={<Checkbox
                checked={ignoreRecommendedLast}
                onChange={(event) => setIgnoreRecommendedLast(event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />}  label={ isMobile ? 'Ignore ' + pooEmoji : 'Ignore recommended  last'}/>
        </FormGroup>
    );
};

export default AutoTeamsSettings;