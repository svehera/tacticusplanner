import React, { useContext } from 'react';
import { Divider, FormControlLabel, FormGroup, Switch } from '@mui/material';
import { IViewPreferences } from '../../models/interfaces';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';

const ViewSettings = ({ onlyUnlocked }: { onlyUnlocked?: boolean }) => {
    const dispatch = useContext(DispatchContext);
    const { viewPreferences } = useContext(StoreContext);

    const updatePreferences = (setting: keyof IViewPreferences, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    if (onlyUnlocked) {
        return (
            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.onlyUnlocked}
                        onChange={event => updatePreferences('onlyUnlocked', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Only unlocked"
            />
        );
    }

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.showAlpha}
                        disabled={viewPreferences.showAlpha && !viewPreferences.showBeta && !viewPreferences.showGamma}
                        onChange={event => updatePreferences('showAlpha', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Alpha"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.showBeta}
                        disabled={viewPreferences.showBeta && !viewPreferences.showAlpha && !viewPreferences.showGamma}
                        onChange={event => updatePreferences('showBeta', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Beta"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.showGamma}
                        disabled={viewPreferences.showGamma && !viewPreferences.showAlpha && !viewPreferences.showBeta}
                        onChange={event => updatePreferences('showGamma', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Gamma"
            />

            <Divider style={{ height: 42, margin: '0 10px' }} orientation={'vertical'} />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.hideSelectedTeams}
                        onChange={event => updatePreferences('hideSelectedTeams', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Hide selected teams"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.lightWeight}
                        onChange={event => updatePreferences('lightWeight', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Lightweight view"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.autoTeams}
                        onChange={event => updatePreferences('autoTeams', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Auto-teams"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={viewPreferences.onlyUnlocked}
                        onChange={event => updatePreferences('onlyUnlocked', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Only unlocked"
            />
        </FormGroup>
    );
};

export default ViewSettings;
