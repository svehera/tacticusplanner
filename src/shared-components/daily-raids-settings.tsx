import { Warning } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import {
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Input,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    SelectChangeEvent,
    Slider,
} from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import React, { useCallback, useContext } from 'react';
import { isMobile } from 'react-device-detect';

import { DailyRaidsStrategy } from 'src/models/enums';
import { DailyRaidsCustomLocations } from 'src/shared-components/daily-raids-custom-locations';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignType, CampaignGroupType } from '@/fsd/4-entities/campaign';

import { ICustomDailyRaidsSettings, IDailyRaidsPreferences } from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';

const defaultCustomSettings: ICustomDailyRaidsSettings = {
    [Rarity.Mythic]: [CampaignType.Extremis],
    [Rarity.Legendary]: [CampaignType.Elite, CampaignType.Mirror],
    [Rarity.Epic]: [CampaignType.Elite, CampaignType.Mirror],
    [Rarity.Rare]: [CampaignType.Elite, CampaignType.Mirror],
    [Rarity.Uncommon]: [CampaignType.Elite, CampaignType.Early, CampaignType.Mirror],
    [Rarity.Common]: [CampaignType.Elite, CampaignType.Early, CampaignType.Mirror],
};

const energyMarks = [
    {
        value: 288 + 30 + 60 + 60,
        label: '25 BS',
    },
    {
        value: 288 + 30 + 60 + 60 + 100,
        label: '50 BS',
    },
    {
        value: 288 + 30 + 60 + 60 + 100 + 100,
        label: '110 BS',
    },
    {
        value: 288 + 30 + 60 + 60 + 100 + 100 + 100,
        label: '250 BS',
    },
    {
        value: 288 + 30 + 60 + 60 + 100 + 100 + 100 + 100,
        label: '500 BS',
    },
    {
        value: 288 + 30 + 60 + 60 + 100 + 100 + 100 + 100 + 100,
        label: '1000 BS',
    },
    {
        value: 888888,
        label: '∞',
    },
];

interface Props {
    close: () => void;
    open: boolean;
}

const DailyRaidsSettings: React.FC<Props> = ({ close, open }) => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaidsPreferences } = useContext(StoreContext);
    const [dailyRaidsPreferencesForm, setDailyRaidsPreferencesForm] = React.useState(dailyRaidsPreferences);
    const [dailyEnergy, setDailyEnergy] = React.useState(() => {
        const index = energyMarks.findIndex(x => x.value === dailyRaidsPreferences.dailyEnergy);
        return index >= 0 ? index : 0; // Default to first option if not found
    });
    const [shardsEnergy, setShardsEnergy] = React.useState<number | string>(dailyRaidsPreferences.shardsEnergy);
    const [customLocationsSettings, setCustomLocationsSettings] = React.useState<ICustomDailyRaidsSettings>(
        dailyRaidsPreferences.customSettings ?? defaultCustomSettings
    );

    // Keep local form state in sync if preferences change externally (e.g., API auto-detect)
    React.useEffect(() => {
        setDailyRaidsPreferencesForm(dailyRaidsPreferences);
    }, [dailyRaidsPreferences]);

    const updatePreferences = useCallback((setting: keyof IDailyRaidsPreferences, value: boolean) => {
        setDailyRaidsPreferencesForm(curr => ({ ...curr, [setting]: value }));
    }, []);

    const handleEnergyChange = (_: any, value: number | number[]) => {
        if (typeof value === 'number') {
            const scaledValue = energyMarks[value]?.value || 288; // Adjust the index and default
            setDailyEnergy(value);
            setDailyRaidsPreferencesForm(curr => ({ ...curr, dailyEnergy: scaledValue }));
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

    function valueLabelFormat(value: number) {
        const mark = energyMarks.find(mark => mark.value === value);
        return mark ? mark.label : value;
    }

    function saveCampaignEventChanges(event: SelectChangeEvent<CampaignGroupType | 'none'>): void {
        setDailyRaidsPreferencesForm(curr => ({
            ...curr,
            campaignEvent: event.target.value as CampaignGroupType | 'none',
        }));
    }

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth={'md'} fullScreen={isMobile}>
            <DialogTitle>Raids settings</DialogTitle>
            <DialogContent>
                <FormGroup style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 20px' }}>
                    <div>
                        <Typography className="flex items-center gap-1">
                            <b>{energyMarks[dailyEnergy].value}</b> <MiscIcon icon={'energy'} width={20} height={20} />{' '}
                            per day
                        </Typography>
                        <Slider
                            aria-label="Restricted values"
                            min={0}
                            max={energyMarks.length - 1} // Align with the number of marks
                            step={1}
                            valueLabelFormat={valueLabelFormat}
                            value={dailyEnergy}
                            onChange={handleEnergyChange}
                            marks={energyMarks.map((mark, index) => ({
                                ...mark,
                                value: index, // Distribute marks evenly
                            }))}
                        />
                    </div>

                    <div className="flex flex-wrap gap-10" style={{ alignItems: 'unset' }}>
                        <FormControl>
                            <FormLabel id="radio-buttons-group" className="font-bold">
                                Raids order/grouping:
                            </FormLabel>
                            <RadioGroup
                                className="ps-5"
                                aria-labelledby="radio-buttons-group"
                                name="controlled-radio-buttons-group"
                                value={dailyRaidsPreferencesForm.farmByPriorityOrder + ''}
                                onChange={change =>
                                    updatePreferences('farmByPriorityOrder', change.target.value === 'true')
                                }>
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label={
                                        <div className="flex-box start gap5">
                                            By total materials{' '}
                                            <AccessibleTooltip
                                                title={
                                                    <p>
                                                        Materials required to accomplish all selected goals will be
                                                        combined together.
                                                        <br /> Pros: You will farm materials for all characters at once
                                                        and overall it will take less time to accomplish all selected
                                                        goals
                                                        <br /> Cons: Goals priority is ignored and it will take more
                                                        time to accomplish your high priority goals
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
                                                        <br /> Pros: You will farm materials for each character
                                                        individually and will faster accomplish your high priority goals
                                                        <br /> Cons: Overall it will take more time to accomplish all
                                                        selected goals. It is especially noticeable when you need to
                                                        farm Legendary upgrades for characters of different factions
                                                    </p>
                                                }>
                                                <InfoIcon color="primary" />
                                            </AccessibleTooltip>
                                        </div>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel htmlFor="shardsEnergy" className="font-bold">
                                Characters shards energy
                            </FormLabel>
                            <Input
                                className="ms-5"
                                value={shardsEnergy}
                                size="small"
                                id="shardsEnergy"
                                onChange={handleShardsEnergyChange}
                                inputProps={{
                                    step: 1,
                                    min: 0,
                                    max: 200,
                                    type: 'number',
                                }}
                            />
                        </FormControl>
                    </div>

                    <div className="flex flex-wrap gap-10">
                        <FormControl>
                            <FormLabel id="radio-buttons-group2" className="font-bold">
                                Locations selection:
                            </FormLabel>
                            <RadioGroup
                                className="ps-5"
                                aria-labelledby="radio-buttons-group2"
                                name="controlled-radio-buttons-group"
                                value={dailyRaidsPreferencesForm.farmStrategy}
                                onChange={change => {
                                    const value = +change.target.value as DailyRaidsStrategy;
                                    setDailyRaidsPreferencesForm(curr => ({ ...curr, farmStrategy: value }));
                                }}>
                                <FormControlLabel
                                    value={DailyRaidsStrategy.leastEnergy}
                                    control={<Radio />}
                                    label="Least energy"
                                />
                                <FormControlLabel
                                    value={DailyRaidsStrategy.leastTime}
                                    disabled={dailyRaidsPreferencesForm.farmByPriorityOrder}
                                    control={<Radio />}
                                    label={
                                        <AccessibleTooltip
                                            title="Experimental/unstable feature. 
                                Please report any issues you have while using this feature in the Discord. 
                                It doesn't work yet with 'By goals priority'.">
                                            <div className="flex-box gap-0.5">
                                                <Warning color="warning" /> Least time
                                            </div>
                                        </AccessibleTooltip>
                                    }
                                />
                                <FormControlLabel
                                    value={DailyRaidsStrategy.allLocations}
                                    control={<Radio />}
                                    label="All locations"
                                />
                                <FormControlLabel
                                    value={DailyRaidsStrategy.custom}
                                    control={<Radio />}
                                    label="Custom"
                                />
                            </RadioGroup>
                        </FormControl>

                        {dailyRaidsPreferencesForm.farmStrategy === DailyRaidsStrategy.custom && (
                            <DailyRaidsCustomLocations
                                hasCE={
                                    !!dailyRaidsPreferencesForm.campaignEvent &&
                                    dailyRaidsPreferencesForm.campaignEvent !== 'none'
                                }
                                settings={customLocationsSettings}
                                settingsChange={value => {
                                    setCustomLocationsSettings(value);
                                    setDailyRaidsPreferencesForm(curr => ({ ...curr, customSettings: value }));
                                }}
                            />
                        )}
                    </div>

                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Campaign Event</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={dailyRaidsPreferencesForm.campaignEvent ?? 'none'}
                            label="Campaign Event"
                            onChange={saveCampaignEventChanges}>
                            <MenuItem value={'none'}>None</MenuItem>
                            <MenuItem value={CampaignGroupType.adMechCE} className="flex-box gap10">
                                <span>Adeptus Mechanicus</span>
                            </MenuItem>
                            <MenuItem value={CampaignGroupType.tyranidCE} className="flex-box gap10">
                                <span>Tyranids</span>
                            </MenuItem>
                            <MenuItem value={CampaignGroupType.tauCE} className="flex-box gap10">
                                <span>T&apos;au Empire</span>
                            </MenuItem>
                            <MenuItem value={CampaignGroupType.deathGuardCE} className="flex-box gap10">
                                <span>Death Guard</span>
                            </MenuItem>
                        </Select>
                        <FormHelperText>
                            Select your current Campaign Event to make it available for raids suggestions
                        </FormHelperText>
                    </FormControl>
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button variant={'outlined'} onClick={close}>
                    Cancel
                </Button>
                <Button variant={'contained'} color="success" onClick={saveChanges}>
                    Save changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DailyRaidsSettings;
