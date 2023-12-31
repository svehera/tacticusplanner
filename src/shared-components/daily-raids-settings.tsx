﻿import React, { useCallback, useContext, useMemo } from 'react';
import { Checkbox, FormControlLabel, FormGroup, Box, Slider, Input, Tooltip } from '@mui/material';
import { IDailyRaidsPreferences } from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import WarningIcon from '@mui/icons-material/Warning';

const DailyRaidsSettings = ({ close }: { close: () => void }) => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaidsPreferences } = useContext(StoreContext);
    const [dailyRaidsPreferencesForm, setDailyRaidsPreferencesForm] = React.useState(dailyRaidsPreferences);
    const [dailyEnergy, setDailyEnergy] = React.useState(dailyRaidsPreferences.dailyEnergy);
    const [shardsEnergy, setShardsEnergy] = React.useState<number | string>(dailyRaidsPreferences.shardsEnergy);

    const updatePreferences = useCallback((setting: keyof IDailyRaidsPreferences, value: boolean) => {
        setDailyRaidsPreferencesForm(curr => ({ ...curr, [setting]: value }));
    }, []);

    const handleEnergyChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setDailyEnergy(value);
            setDailyRaidsPreferencesForm(curr => ({ ...curr, dailyEnergy: value }));
        }
    };

    const handleShardsEnergyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        setShardsEnergy(rawValue);
        setDailyRaidsPreferencesForm(curr => ({ ...curr, shardsEnergy: value }));
    };

    const saveChanges = () => {
        dispatch.dailyRaidsPreferences({ type: 'Set', value: dailyRaidsPreferencesForm });
        close();
    };

    const energyMarks = useMemo(
        () => [
            {
                value: 288,
                label: '',
            },
            {
                value: 288 + 50,
                label: '25 BS',
            },
            {
                value: 288 + 50 + 100,
                label: '50 BS',
            },
            {
                value: 288 + 50 + 100 + 100,
                label: '110 BS',
            },
            {
                value: 288 + 50 + 100 + 100 + 100,
                label: '250 BS',
            },
            {
                value: 288 + 50 + 100 + 100 + 100 + 100,
                label: '500 BS',
            },
        ],
        []
    );

    function valueLabelFormat(value: number) {
        return energyMarks.find(mark => mark.value === value)?.value;
    }

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
            <Box>
                <Typography id="input-slider" gutterBottom>
                    Daily Energy
                </Typography>
                <Slider
                    aria-label="Restricted values"
                    min={288}
                    max={738}
                    valueLabelFormat={valueLabelFormat}
                    step={null}
                    value={dailyEnergy}
                    onChange={(_, value) => handleEnergyChange(value)}
                    valueLabelDisplay="on"
                    marks={energyMarks}
                />
            </Box>

            <FormControlLabel
                control={
                    <Input
                        value={shardsEnergy}
                        size="small"
                        onChange={handleShardsEnergyChange}
                        inputProps={{
                            step: 1,
                            min: 0,
                            max: 200,
                            type: 'number',
                        }}
                    />
                }
                label="Characters shards energy"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.useCampaignsProgress}
                        onChange={event => updatePreferences('useCampaignsProgress', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use campaigns progress"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.useMostEfficientNodes}
                        onChange={event => updatePreferences('useMostEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use Most efficient nodes (Elite)"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.useMoreEfficientNodes}
                        onChange={event => updatePreferences('useMoreEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use More efficient nodes (Mirror)"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.useLeastEfficientNodes}
                        onChange={event => updatePreferences('useLeastEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use Least efficient nodes (Normal)"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.useInventory}
                        onChange={event => updatePreferences('useInventory', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use inventory"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={dailyRaidsPreferencesForm.farmByPriorityOrder}
                        onChange={event => updatePreferences('farmByPriorityOrder', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Farm by priority order"
            />

            <Button type={'button'} onClick={saveChanges} variant={'outlined'}>
                Save
            </Button>
        </FormGroup>
    );
};

export default DailyRaidsSettings;
