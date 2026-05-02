import InfoIcon from '@mui/icons-material/Info';
import {
    Checkbox,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
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

import { ICustomDailyRaidsSettings, IDailyRaidsFarmOrder, IDailyRaidsHomeScreenEvent } from '../models/interfaces';
import { DispatchContext, StoreContext } from '../reducers/store.provider';

const defaultCustomSettings: ICustomDailyRaidsSettings = {
    ['Mythic Shard']: [CampaignType.Extremis],
    ['Shard']: [
        CampaignType.Elite,
        CampaignType.Extremis,
        CampaignType.Early,
        CampaignType.Mirror,
        CampaignType.Standard,
    ],
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
];

interface Props {
    close: () => void;
    open: boolean;
}

const DailyRaidsSettings: React.FC<Props> = ({ close, open }) => {
    // const { characters } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { dailyRaidsPreferences } = useContext(StoreContext);
    const [dailyRaidsPreferencesForm, setDailyRaidsPreferencesForm] = React.useState(dailyRaidsPreferences);
    const [dailyEnergy, setDailyEnergy] = React.useState(() => {
        const index = energyMarks.findIndex(x => x.value === dailyRaidsPreferences.dailyEnergy);
        return index === -1 ? 2 : index; // Default to 50 BS refresh if not found.
    });
    const [customLocationsSettings, setCustomLocationsSettings] = React.useState<ICustomDailyRaidsSettings>(
        dailyRaidsPreferences.customSettings ?? defaultCustomSettings
    );
    /*
    const [character, setCharacter] = useState<ICharacter2>(() => {
        return (
            characters.find(
                x => x.snowprintId === dailyRaidsPreferencesForm.farmPreferences.trainingRushPreferences?.characterId
            )
        );
    });*/

    // Keep local form state in sync if preferences change externally (e.g., API auto-detect)
    React.useEffect(() => {
        setDailyRaidsPreferencesForm(dailyRaidsPreferences);
    }, [dailyRaidsPreferences]);

    const updatePreferences = useCallback((value: IDailyRaidsFarmOrder) => {
        setDailyRaidsPreferencesForm(current => ({
            ...current,
            farmPreferences: { ...current.farmPreferences, order: value },
        }));
    }, []);

    const handleEnergyChange = (_: any, value: number | number[]) => {
        if (typeof value === 'number') {
            const scaledValue = energyMarks[value]?.value || 288; // Adjust the index and default
            setDailyEnergy(value);
            setDailyRaidsPreferencesForm(current => ({ ...current, dailyEnergy: scaledValue }));
        }
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
        setDailyRaidsPreferencesForm(current => ({
            ...current,
            campaignEvent: event.target.value as CampaignGroupType | 'none',
        }));
    }

    function saveHomeScreenEventChanges(event: SelectChangeEvent<IDailyRaidsHomeScreenEvent>): void {
        setDailyRaidsPreferencesForm(current => ({
            ...current,
            farmPreferences: {
                ...current.farmPreferences,
                homeScreenEvent: event.target.value as IDailyRaidsHomeScreenEvent,
            },
        }));
    }
    /*
    function saveTrainingRushStrategyChanges(event: SelectChangeEvent<ITrainingRushStrategy>): void {
        setDailyRaidsPreferencesForm(current => {
            const ret = { ...current };
            ret.farmPreferences.trainingRushPreferences = {
                ...ret.farmPreferences.trainingRushPreferences,
                strategy: event.target.value as ITrainingRushStrategy,
            };
            return ret;
        });
    }

    function saveTrainingRushUnitChanges(unit: ICharacter2 | undefined): void {
        setCharacter(unit);
        setDailyRaidsPreferencesForm(current => {
            const ret = { ...current };
            ret.farmPreferences.trainingRushPreferences = {
                strategy:
                    ret.farmPreferences.trainingRushPreferences?.strategy ?? ITrainingRushStrategy.maximizeRewards,
                characterId: unit ? unit.snowprintId : undefined,
            };
            return ret;
        });
    }
*/
    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth={'md'} fullScreen={isMobile}>
            <DialogTitle>Raids settings</DialogTitle>
            <DialogContent>
                <FormGroup className="flex flex-col gap-5 px-5 py-0">
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

                    <div className="items-[unset] flex flex-wrap gap-10">
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
                                    updatePreferences(
                                        Number.parseInt(change.target.value) as unknown as IDailyRaidsFarmOrder
                                    )
                                }>
                                <FormControlLabel
                                    value={IDailyRaidsFarmOrder.totalMaterials}
                                    control={<Radio />}
                                    label={
                                        <div className="flex-box gap5 start">
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
                                        <div className="flex-box gap5 start">
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
                    </div>
                    <div className="flex flex-row items-start gap-4">
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
                        {(dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ??
                            IDailyRaidsHomeScreenEvent.none) !== IDailyRaidsHomeScreenEvent.none && (
                            <FormControl>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={dailyRaidsPreferencesForm.invertHse ?? false}
                                            onChange={event_ =>
                                                setDailyRaidsPreferencesForm(current => ({
                                                    ...current,
                                                    invertHse: event_.target.checked,
                                                }))
                                            }
                                        />
                                    }
                                    label={
                                        <div className="flex items-center gap-1">
                                            Invert
                                            <AccessibleTooltip title="When selected, prioritize raids that award the fewest points for the selected HSE">
                                                <InfoIcon color="primary" fontSize="small" />
                                            </AccessibleTooltip>
                                        </div>
                                    }
                                />
                            </FormControl>
                        )}

                        {/*}
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
                                */}
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
                                    setDailyRaidsPreferencesForm(current => ({ ...current, farmStrategy: value }));
                                }}>
                                <FormControlLabel
                                    value={DailyRaidsStrategy.leastEnergy}
                                    control={<Radio />}
                                    label="Least energy"
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
                                    setDailyRaidsPreferencesForm(current => ({ ...current, customSettings: value }));
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
                            <MenuItem value={CampaignGroupType.sistersCE} className="flex-box gap10">
                                <span>Adepta Sororitas</span>
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
