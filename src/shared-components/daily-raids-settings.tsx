import React, { useCallback, useContext, useMemo } from 'react';
import {
    Checkbox,
    FormControlLabel,
    FormGroup,
    Box,
    Slider,
    Input,
    Tooltip,
    FormControl,
    FormLabel,
    RadioGroup,
    Radio,
} from '@mui/material';
import { IDailyRaidsPreferences } from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

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

            <FormControl style={{ marginTop: 20 }}>
                <FormLabel id="radio-buttons-group">Raids order/grouping:</FormLabel>
                <RadioGroup
                    aria-labelledby="radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={dailyRaidsPreferencesForm.farmByPriorityOrder + ''}
                    onChange={change => updatePreferences('farmByPriorityOrder', change.target.value === 'true')}>
                    <FormControlLabel
                        value="false"
                        control={<Radio />}
                        label={
                            <div className="flex-box start gap5">
                                By total materials{' '}
                                <AccessibleTooltip
                                    title={
                                        <p>
                                            Materials required to accomplish all selected goals will be combined
                                            together.
                                            <br /> Pros: You will farm materials for all characters at once and overall
                                            it will take less time to accomplish all selected goals
                                            <br /> Cons: Goals priority is ignored and it will take more time to
                                            accomplish your high priority goals
                                        </p>
                                    }>
                                    <InfoIcon color="primary" />
                                </AccessibleTooltip>
                            </div>
                        }
                    />
                    <FormControlLabel
                        value="true"
                        control={<Radio />}
                        label={
                            <div className="flex-box start gap5">
                                By goals priority{' '}
                                <AccessibleTooltip
                                    title={
                                        <p>
                                            Materials grouped by goals priority.
                                            <br /> Pros: You will farm materials for each character individually and
                                            will faster accomplish your high priority goals
                                            <br /> Cons: Overall it will take more time to accomplish all selected
                                            goals. It is especially noticeable when you need to farm Legendary upgrades
                                            for characters of different factions
                                        </p>
                                    }>
                                    <InfoIcon color="primary" />
                                </AccessibleTooltip>
                            </div>
                        }
                    />
                </RadioGroup>
            </FormControl>

            <Button type={'button'} onClick={saveChanges} variant={'outlined'}>
                Save
            </Button>
        </FormGroup>
    );
};

export default DailyRaidsSettings;
