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
import React, { useCallback, useContext, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { DailyRaidsStrategy } from 'src/models/enums';
import { DailyRaidsCustomLocations } from 'src/shared-components/daily-raids-custom-locations';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignType, CampaignGroupType } from '@/fsd/4-entities/campaign';
import { UnitsAutocomplete } from '@/fsd/4-entities/unit';

import {
    ICharacter2,
    ICustomDailyRaidsSettings,
    IDailyRaidsFarmOrder,
    IDailyRaidsHomeScreenEvent,
    ITrainingRushStrategy,
} from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';

const defaultCustomSettings: ICustomDailyRaidsSettings = {
    [Rarity.Mythic]: [CampaignType.Extremis],
    [Rarity.Legendary]: [CampaignType.Elite, CampaignType.Extremis, CampaignType.Mirror, CampaignType.Standard],
    [Rarity.Epic]: [CampaignType.Elite, CampaignType.Extremis, CampaignType.Mirror, CampaignType.Standard],
    [Rarity.Rare]: [CampaignType.Elite, CampaignType.Extremis, CampaignType.Mirror, CampaignType.Standard],
    [Rarity.Uncommon]: [
        CampaignType.Elite,
        CampaignType.Extremis,
        CampaignType.Early,
        CampaignType.Mirror,
        CampaignType.Standard,
    ],
    [Rarity.Common]: [CampaignType.Elite, CampaignType.Extremis, CampaignType.Mirror, CampaignType.Standard],
};

const energyMarks = [
    {
        value: 288 + 30 + 60,
        label: 'Ad Only',
    },
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
    const { characters } = useContext(StoreContext);
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
    const [character, setCharacter] = useState<ICharacter2 | null>(() => {
        return (
            characters.find(
                x => x.snowprintId === dailyRaidsPreferencesForm.farmPreferences.trainingRushPreferences?.characterId
            ) || null
        );
    });

    // Keep local form state in sync if preferences change externally (e.g., API auto-detect)
    React.useEffect(() => {
        setDailyRaidsPreferencesForm(dailyRaidsPreferences);
    }, [dailyRaidsPreferences]);

    const updatePreferences = useCallback((value: IDailyRaidsFarmOrder) => {
        setDailyRaidsPreferencesForm(curr => ({
            ...curr,
            farmPreferences: { ...curr.farmPreferences, order: value },
        }));
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

    function saveHomeScreenEventChanges(event: SelectChangeEvent<IDailyRaidsHomeScreenEvent>): void {
        setDailyRaidsPreferencesForm(curr => ({
            ...curr,
            farmPreferences: {
                ...curr.farmPreferences,
                homeScreenEvent: event.target.value as IDailyRaidsHomeScreenEvent,
            },
        }));
    }

    function savePurgeOrderMinimumTyranidsCountChanges(event: SelectChangeEvent<number>): void {
        const parsed = Number(event.target.value);
        const value = Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
        setDailyRaidsPreferencesForm(curr => {
            const ret = { ...curr };
            ret.farmPreferences.purgeOrderPreferences = { minimumTyranidCount: value };
            return ret;
        });
    }

    function saveTrainingRushStrategyChanges(event: SelectChangeEvent<ITrainingRushStrategy>): void {
        setDailyRaidsPreferencesForm(curr => {
            const ret = { ...curr };
            ret.farmPreferences.trainingRushPreferences = {
                ...ret.farmPreferences.trainingRushPreferences,
                strategy: event.target.value as ITrainingRushStrategy,
            };
            return ret;
        });
    }

    function saveTrainingRushUnitChanges(unit: ICharacter2 | null): void {
        setCharacter(unit);
        setDailyRaidsPreferencesForm(curr => {
            const ret = { ...curr };
            ret.farmPreferences.trainingRushPreferences = {
                strategy:
                    ret.farmPreferences.trainingRushPreferences?.strategy ?? ITrainingRushStrategy.maximizeRewards,
                characterId: unit ? unit.snowprintId! : undefined,
            };
            return ret;
        });
    }

    function saveWarpSurgeMinimumChaosEnemyCountChanges(event: SelectChangeEvent<number>): void {
        const parsed = Number(event.target.value);
        const value = Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
        setDailyRaidsPreferencesForm(curr => {
            const ret = { ...curr };
            ret.farmPreferences.warpSurgePreferences = { minimumChaosEnemyCount: value };
            return ret;
        });
    }

    function saveMachineHuntMinimumMechanicalEnemyCountChanges(event: SelectChangeEvent<number>): void {
        const parsed = Number(event.target.value);
        const value = Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
        setDailyRaidsPreferencesForm(curr => {
            const ret = { ...curr };
            ret.farmPreferences.machineHuntPreferences = { minimumMechanicalEnemyCount: value };
            return ret;
        });
    }

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth={'md'} fullScreen={isMobile}>
            <DialogTitle>Raids settings</DialogTitle>
            <DialogContent>
                <FormGroup className="flex flex-col gap-5 py-0 px-5">
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

                    <div className="flex flex-wrap gap-10 items-[unset]">
                        <FormControl>
                            <FormLabel id="radio-buttons-group" className="font-bold">
                                Raids order/grouping:
                            </FormLabel>
                            <RadioGroup
                                className="ps-5"
                                aria-labelledby="radio-buttons-group"
                                name="controlled-radio-buttons-group"
                                value={dailyRaidsPreferencesForm.farmPreferences.order}
                                onChange={change =>
                                    updatePreferences(parseInt(change.target.value) as unknown as IDailyRaidsFarmOrder)
                                }>
                                <FormControlLabel
                                    value={IDailyRaidsFarmOrder.totalMaterials}
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
                                    value={IDailyRaidsFarmOrder.goalPriority}
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
                    <div className="flex flex-row gap-4 items-start">
                        <FormControl>
                            <InputLabel id="home-screen-event-label">Home Screen Event</InputLabel>
                            <Select
                                labelId="home-screen-event-label"
                                id="home-screen-event-select"
                                value={
                                    dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ??
                                    IDailyRaidsHomeScreenEvent.none
                                }
                                label="Home Screen Event"
                                onChange={saveHomeScreenEventChanges}
                                style={{ minWidth: 180 }}>
                                <MenuItem value={IDailyRaidsHomeScreenEvent.none}>None</MenuItem>
                                <MenuItem value={IDailyRaidsHomeScreenEvent.purgeOrder} className="flex-box gap10">
                                    <span>Purge Order</span>
                                </MenuItem>
                                <MenuItem value={IDailyRaidsHomeScreenEvent.trainingRush} className="flex-box gap10">
                                    <span>Training Rush</span>
                                </MenuItem>
                                <MenuItem value={IDailyRaidsHomeScreenEvent.warpSurge} className="flex-box gap10">
                                    <span>Warp Surge</span>
                                </MenuItem>
                                <MenuItem value={IDailyRaidsHomeScreenEvent.machineHunt} className="flex-box gap10">
                                    <span>Machine Hunt</span>
                                </MenuItem>
                            </Select>
                            <FormHelperText>Select your current Home Screen Event.</FormHelperText>
                        </FormControl>
                        {dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ===
                            IDailyRaidsHomeScreenEvent.purgeOrder && (
                            <FormControl>
                                <InputLabel id="purge-order-min-tyranids-label">Minimum Tyranids</InputLabel>
                                <Select
                                    labelId="purge-order-min-tyranids-label"
                                    id="purge-order-min-tyranids-select"
                                    value={
                                        dailyRaidsPreferencesForm.farmPreferences.purgeOrderPreferences
                                            ?.minimumTyranidCount ?? 0
                                    }
                                    label="Minimum Tyranids"
                                    onChange={savePurgeOrderMinimumTyranidsCountChanges}
                                    style={{ minWidth: 180 }}>
                                    {Array.from({ length: 15 }, (_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Minimum tyranids to consider a battle.</FormHelperText>
                            </FormControl>
                        )}

                        {dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ===
                            IDailyRaidsHomeScreenEvent.trainingRush && (
                            <FormControl>
                                <InputLabel id="training-rush-strategy-label">Training Rush Strategy</InputLabel>
                                <Select
                                    labelId="training-rush-strategy-label"
                                    id="training-rush-strategy-select"
                                    value={
                                        dailyRaidsPreferencesForm.farmPreferences.trainingRushPreferences?.strategy ??
                                        ITrainingRushStrategy.maximizeRewards
                                    }
                                    label="Training Rush Strategy"
                                    onChange={saveTrainingRushStrategyChanges}
                                    style={{ minWidth: 180 }}>
                                    <MenuItem value={ITrainingRushStrategy.maximizeRewards} className="flex-box gap10">
                                        <span>Maximize Rewards</span>
                                    </MenuItem>
                                    <MenuItem
                                        value={ITrainingRushStrategy.maximizeXpForCharacter}
                                        className="flex-box gap10">
                                        <span>Maximize XP</span>
                                    </MenuItem>
                                </Select>
                                <FormHelperText>Select your current Training Rush Strategy.</FormHelperText>
                            </FormControl>
                        )}
                        {dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ===
                            IDailyRaidsHomeScreenEvent.trainingRush &&
                            (dailyRaidsPreferencesForm.farmPreferences.trainingRushPreferences?.strategy ??
                                ITrainingRushStrategy.maximizeRewards) ===
                                ITrainingRushStrategy.maximizeXpForCharacter && (
                                <FormControl>
                                    <UnitsAutocomplete
                                        unit={character}
                                        options={characters}
                                        onUnitChange={saveTrainingRushUnitChanges}
                                    />
                                    <FormHelperText>Select your character.</FormHelperText>
                                </FormControl>
                            )}
                        {dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ===
                            IDailyRaidsHomeScreenEvent.warpSurge && (
                            <FormControl>
                                <InputLabel id="warp-surge-min-chaos-enemies-label">Minimum Chaos Enemies</InputLabel>
                                <Select
                                    labelId="warp-surge-min-chaos-enemies-label"
                                    id="warp-surge-min-chaos-enemies-select"
                                    value={
                                        dailyRaidsPreferencesForm.farmPreferences.warpSurgePreferences
                                            ?.minimumChaosEnemyCount ?? 0
                                    }
                                    label="Minimum Chaos Enemies"
                                    onChange={saveWarpSurgeMinimumChaosEnemyCountChanges}
                                    style={{ minWidth: 180 }}>
                                    {Array.from({ length: 15 }, (_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Minimum chaos enemies to consider a battle.</FormHelperText>
                            </FormControl>
                        )}
                        {dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ===
                            IDailyRaidsHomeScreenEvent.machineHunt && (
                            <FormControl>
                                <InputLabel id="machine-hunt-min-mechanical-enemies-label">
                                    Minimum Mechanical Enemies
                                </InputLabel>
                                <Select
                                    labelId="machine-hunt-min-mechanical-enemies-label"
                                    id="machine-hunt-min-mechanical-enemies-select"
                                    value={
                                        dailyRaidsPreferencesForm.farmPreferences.machineHuntPreferences
                                            ?.minimumMechanicalEnemyCount ?? 0
                                    }
                                    label="Minimum Mechanical Enemies"
                                    onChange={saveMachineHuntMinimumMechanicalEnemyCountChanges}
                                    style={{ minWidth: 180 }}>
                                    {Array.from({ length: 15 }, (_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>
                                            {i + 1}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Minimum mechanical enemies to consider a battle.</FormHelperText>
                            </FormControl>
                        )}
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
                                    disabled={
                                        dailyRaidsPreferencesForm.farmPreferences.order !==
                                        IDailyRaidsFarmOrder.totalMaterials
                                    }
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
