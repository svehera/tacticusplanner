import React, { useContext } from 'react';
import { Divider, FormControlLabel, FormGroup, Switch, Tooltip } from '@mui/material';
import { IViewPreferences } from '../../models/interfaces';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';

const ViewSettings = ({ options }: { options?: Array<keyof IViewPreferences> }) => {
    const dispatch = useContext(DispatchContext);
    const { viewPreferences } = useContext(StoreContext);

    const updatePreferences = (setting: keyof IViewPreferences, value: boolean) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    function checkOptions(key: keyof IViewPreferences, node: React.ReactNode): React.ReactNode {
        if (!options) {
            if (key === 'craftableItemsInInventory') {
                return;
            }
            return node;
        } else if (options.includes(key)) {
            return node;
        }
    }

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            {checkOptions(
                'showAlpha',
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.showAlpha}
                            disabled={
                                viewPreferences.showAlpha && !viewPreferences.showBeta && !viewPreferences.showGamma
                            }
                            onChange={event => updatePreferences('showAlpha', event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                    label="Alpha"
                />
            )}

            {checkOptions(
                'showBeta',
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.showBeta}
                            disabled={
                                viewPreferences.showBeta && !viewPreferences.showAlpha && !viewPreferences.showGamma
                            }
                            onChange={event => updatePreferences('showBeta', event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                    label="Beta"
                />
            )}

            {checkOptions(
                'showGamma',
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.showGamma}
                            disabled={
                                viewPreferences.showGamma && !viewPreferences.showAlpha && !viewPreferences.showBeta
                            }
                            onChange={event => updatePreferences('showGamma', event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                    label="Gamma"
                />
            )}

            {checkOptions('showAlpha', <Divider style={{ height: 42, margin: '0 10px' }} orientation={'vertical'} />)}

            {checkOptions(
                'hideSelectedTeams',
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
            )}

            {checkOptions(
                'lightWeight',
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
            )}

            {checkOptions(
                'autoTeams',
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
            )}

            {checkOptions(
                'onlyUnlocked',
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
            )}

            {checkOptions(
                'hideCompleted',
                <Tooltip title={'Hide tracks where you have completed battle 12'}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={viewPreferences.hideCompleted}
                                onChange={event => updatePreferences('hideCompleted', event.target.checked)}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                        label="Hide completed"
                    />
                </Tooltip>
            )}

            {checkOptions(
                'craftableItemsInInventory',
                <FormControlLabel
                    control={
                        <Switch
                            checked={viewPreferences.craftableItemsInInventory}
                            onChange={event => updatePreferences('craftableItemsInInventory', event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                    label="Show craftable items"
                />
            )}
        </FormGroup>
    );
};

export default ViewSettings;
