import React, { useCallback, useContext, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IAutoTeamsPreferences } from '../../models/interfaces';
import { isMobile } from 'react-device-detect';
import { pooEmoji, starEmoji } from '../../models/constants';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';

const AutoTeamsSettings = () => {
    const dispatch = useContext(DispatchContext);
    const { autoTeamsPreferences } = useContext(StoreContext);

    const updatePreferences = useCallback((setting: keyof IAutoTeamsPreferences, value: boolean) => {
        dispatch.autoTeamsPreferences({
            type: 'Update',
            setting,
            value,
        });
    }, []);

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'column' }}>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={autoTeamsPreferences.preferCampaign}
                        onChange={event => updatePreferences('preferCampaign', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Prefer Campaign Chars"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={autoTeamsPreferences.ignoreRank}
                        onChange={event => updatePreferences('ignoreRank', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Ignore Rank"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={autoTeamsPreferences.ignoreRarity}
                        onChange={event => updatePreferences('ignoreRarity', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Ignore Rarity"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={autoTeamsPreferences.ignoreRecommendedFirst}
                        onChange={event => updatePreferences('ignoreRecommendedFirst', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label={isMobile ? 'Ignore ' + starEmoji : 'Ignore recommended first'}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={autoTeamsPreferences.ignoreRecommendedLast}
                        onChange={event => updatePreferences('ignoreRecommendedLast', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label={isMobile ? 'Ignore ' + pooEmoji : 'Ignore recommended  last'}
            />
        </FormGroup>
    );
};

export default AutoTeamsSettings;
