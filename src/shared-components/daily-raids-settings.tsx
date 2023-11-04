import React, { useCallback, useContext } from 'react';
import { Switch, FormControlLabel, FormGroup, Box, Slider } from '@mui/material';
import { IDailyRaidsPreferences } from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import Typography from '@mui/material/Typography';

const DailyRaidsSettings = () => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaidsPreferences } = useContext(StoreContext);
    const [dailyEnergy, setDailyEnergy] = React.useState(dailyRaidsPreferences.dailyEnergy);
    const [updateTimeout, setUpdateTimeout] = React.useState<NodeJS.Timeout | undefined>();

    const updatePreferences = useCallback((setting: keyof IDailyRaidsPreferences, value: boolean) => {
        dispatch.dailyRaidsPreferences({
            type: 'Update',
            setting,
            value,
        });
    }, []);

    const handleEnergyChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setDailyEnergy(value);

            if (updateTimeout) {
                clearTimeout(updateTimeout);
            }
            const timeoutId = setTimeout(() => {
                dispatch.dailyRaidsPreferences({
                    type: 'UpdateEnergy',
                    value,
                });
            }, 500);

            setUpdateTimeout(timeoutId);
        }
    };

    const energyMarks = [
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
    ];

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
                    <Switch
                        checked={dailyRaidsPreferences.useCampaignsProgress}
                        onChange={event => updatePreferences('useCampaignsProgress', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use campaigns progress"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={dailyRaidsPreferences.useMostEfficientNodes}
                        onChange={event => updatePreferences('useMostEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use Most efficient nodes"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={dailyRaidsPreferences.useMoreEfficientNodes}
                        onChange={event => updatePreferences('useMoreEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use More efficient nodes"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={dailyRaidsPreferences.useLeastEfficientNodes}
                        onChange={event => updatePreferences('useLeastEfficientNodes', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use Least efficient nodes"
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={dailyRaidsPreferences.useInventory}
                        onChange={event => updatePreferences('useInventory', event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label="Use inventory"
            />
        </FormGroup>
    );
};

export default DailyRaidsSettings;
