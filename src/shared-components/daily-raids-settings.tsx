import { Info } from 'lucide-react';
import React, { useCallback, useContext, useState } from 'react';

import { DailyRaidsStrategy } from 'src/models/enums';
import { DailyRaidsCustomLocations } from 'src/shared-components/daily-raids-custom-locations';

import { Rarity } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Button, PortalDialog, RadioOption, Slider, Switch } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { Select } from '@/fsd/5-shared/ui/selects';

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
    { value: 288 + 30 + 60, label: 'Ad Only' },
    { value: 288 + 30 + 60 + 60, label: '25 BS' },
    { value: 288 + 30 + 60 + 60 + 100, label: '50 BS' },
    { value: 288 + 30 + 60 + 60 + 100 + 100, label: '110 BS' },
    { value: 288 + 30 + 60 + 60 + 100 + 100 + 100, label: '250 BS' },
    { value: 288 + 30 + 60 + 60 + 100 + 100 + 100 + 100, label: '500 BS' },
    { value: 288 + 30 + 60 + 60 + 100 + 100 + 100 + 100 + 100, label: '1000 BS' },
];

const HSE_OPTIONS = [
    IDailyRaidsHomeScreenEvent.none,
    IDailyRaidsHomeScreenEvent.purgeOrder,
    IDailyRaidsHomeScreenEvent.trainingRush,
    IDailyRaidsHomeScreenEvent.warpSurge,
    IDailyRaidsHomeScreenEvent.machineHunt,
];

const HSE_LABELS: Record<number, string> = {
    [IDailyRaidsHomeScreenEvent.none]: 'None',
    [IDailyRaidsHomeScreenEvent.purgeOrder]: 'Purge Order',
    [IDailyRaidsHomeScreenEvent.trainingRush]: 'Training Rush',
    [IDailyRaidsHomeScreenEvent.warpSurge]: 'Warp Surge',
    [IDailyRaidsHomeScreenEvent.machineHunt]: 'Machine Hunt',
};

const CAMPAIGN_EVENT_OPTIONS: Array<CampaignGroupType | 'none'> = [
    'none',
    CampaignGroupType.adMechCE,
    CampaignGroupType.tyranidCE,
    CampaignGroupType.tauCE,
    CampaignGroupType.deathGuardCE,
    CampaignGroupType.sistersCE,
    CampaignGroupType.darkAngelsCE,
];

const CAMPAIGN_EVENT_LABELS: Record<string, string> = {
    none: 'None',
    [CampaignGroupType.adMechCE]: 'Adeptus Mechanicus',
    [CampaignGroupType.tyranidCE]: 'Tyranids',
    [CampaignGroupType.tauCE]: "T'au Empire",
    [CampaignGroupType.deathGuardCE]: 'Death Guard',
    [CampaignGroupType.sistersCE]: 'Adepta Sororitas',
    [CampaignGroupType.darkAngelsCE]: 'Dark Angels',
};

const farmOrderOptions = [
    {
        value: IDailyRaidsFarmOrder.totalMaterials,
        label: 'By total materials',
        tooltip: (
            <p>
                Materials required to accomplish all selected goals will be combined together.
                <br /> Pros: You will farm materials for all characters at once and overall it will take less time to
                accomplish all selected goals
                <br /> Cons: Goals priority is ignored and it will take more time to accomplish your high priority goals
            </p>
        ),
    },
    {
        value: IDailyRaidsFarmOrder.goalPriority,
        label: 'By goals priority',
        tooltip: (
            <p>
                Materials grouped by goals priority.
                <br /> Pros: You will farm materials for each character individually and will faster accomplish your
                high priority goals
                <br /> Cons: Overall it will take more time to accomplish all selected goals. It is especially
                noticeable when you need to farm Legendary upgrades for characters of different factions
            </p>
        ),
    },
];

const locationStrategyOptions = [
    { value: DailyRaidsStrategy.leastEnergy, label: 'Least energy' },
    { value: DailyRaidsStrategy.allLocations, label: 'All locations' },
    { value: DailyRaidsStrategy.custom, label: 'Custom' },
];

interface Props {
    close: () => void;
    open: boolean;
}

const DailyRaidsSettings: React.FC<Props> = ({ close, open }) => {
    const dispatch = useContext(DispatchContext);
    const { dailyRaidsPreferences, viewPreferences } = useContext(StoreContext);
    const [dailyRaidsPreferencesForm, setDailyRaidsPreferencesForm] = React.useState(dailyRaidsPreferences);
    const [shopVisibility, setShopVisibility] = useState({
        showGuildShop: viewPreferences.showGuildShop ?? true,
        showWarShop: viewPreferences.showWarShop ?? true,
        showRogueTrader: viewPreferences.showRogueTrader ?? true,
    });
    const [dailyEnergy, setDailyEnergy] = React.useState(() => {
        const index = energyMarks.findIndex(x => x.value === dailyRaidsPreferences.dailyEnergy);
        return index === -1 ? 2 : index;
    });
    const [customLocationsSettings, setCustomLocationsSettings] = React.useState<ICustomDailyRaidsSettings>(
        dailyRaidsPreferences.customSettings ?? defaultCustomSettings
    );

    React.useEffect(() => {
        setDailyRaidsPreferencesForm(dailyRaidsPreferences);
    }, [dailyRaidsPreferences]);

    React.useEffect(() => {
        if (open) {
            setShopVisibility({
                showGuildShop: viewPreferences.showGuildShop ?? true,
                showWarShop: viewPreferences.showWarShop ?? true,
                showRogueTrader: viewPreferences.showRogueTrader ?? true,
            });
        }
    }, [open, viewPreferences]);

    const updatePreferences = useCallback((value: IDailyRaidsFarmOrder) => {
        setDailyRaidsPreferencesForm(current => ({
            ...current,
            farmPreferences: { ...current.farmPreferences, order: value },
        }));
    }, []);

    const handleEnergyChange = (value: number) => {
        const scaledValue = energyMarks[value]?.value || 288;
        setDailyEnergy(value);
        setDailyRaidsPreferencesForm(current => ({ ...current, dailyEnergy: scaledValue }));
    };

    const saveChanges = () => {
        dispatch.dailyRaidsPreferences({ type: 'Set', value: dailyRaidsPreferencesForm });
        dispatch.viewPreferences({ type: 'Update', setting: 'showGuildShop', value: shopVisibility.showGuildShop });
        dispatch.viewPreferences({ type: 'Update', setting: 'showWarShop', value: shopVisibility.showWarShop });
        dispatch.viewPreferences({ type: 'Update', setting: 'showRogueTrader', value: shopVisibility.showRogueTrader });
        close();
    };

    const selectedHse = dailyRaidsPreferencesForm.farmPreferences.homeScreenEvent ?? IDailyRaidsHomeScreenEvent.none;
    const selectedCampaignEvent = dailyRaidsPreferencesForm.campaignEvent ?? 'none';

    return (
        <PortalDialog open={open} onClose={close} aria-label="Raids settings" size="2xl">
            <PortalDialog.Header>Raids settings</PortalDialog.Header>

            <PortalDialog.Body>
                {/* Energy per day */}
                <div className="px-2">
                    <span className="flex items-center gap-1 text-sm font-semibold">
                        <span>{energyMarks[dailyEnergy].value}</span>
                        <MiscIcon icon={'energy'} width={20} height={20} /> per day
                    </span>
                    <Slider
                        aria-label="Daily energy"
                        min={0}
                        max={energyMarks.length - 1}
                        value={dailyEnergy}
                        onChange={handleEnergyChange}
                        marks={energyMarks.map((mark, index) => ({
                            value: index,
                            label: mark.label,
                        }))}
                    />
                </div>

                {/* Raids order + Home Screen Event — side by side */}
                <div className="flex flex-wrap gap-6">
                    <fieldset className="min-w-[200px] flex-1">
                        <legend className="mb-2 text-sm font-semibold text-(--fg)">Raids order/grouping:</legend>
                        <div className="flex flex-col gap-2 ps-2">
                            {farmOrderOptions.map(opt => (
                                <RadioOption
                                    key={opt.value}
                                    name="farm-order"
                                    value={opt.value}
                                    checked={dailyRaidsPreferencesForm.farmPreferences.order === opt.value}
                                    onChange={() => updatePreferences(opt.value)}>
                                    <span className="flex items-center gap-1">
                                        {opt.label}
                                        <AccessibleTooltip title={opt.tooltip}>
                                            <Info className="size-4 text-(--primary)" />
                                        </AccessibleTooltip>
                                    </span>
                                </RadioOption>
                            ))}
                        </div>
                    </fieldset>

                    <div className="flex min-w-[200px] flex-1 flex-col gap-3">
                        <Select<IDailyRaidsHomeScreenEvent>
                            options={HSE_OPTIONS}
                            value={selectedHse}
                            onChange={value => {
                                setDailyRaidsPreferencesForm(current => ({
                                    ...current,
                                    farmPreferences: {
                                        ...current.farmPreferences,
                                        homeScreenEvent: value,
                                    },
                                }));
                            }}
                            renderOption={opt => HSE_LABELS[opt]}
                            label="Home Screen Event"
                        />

                        {selectedHse !== IDailyRaidsHomeScreenEvent.none && (
                            <div className="flex items-center gap-1">
                                <Switch
                                    isSelected={dailyRaidsPreferencesForm.invertHse ?? false}
                                    onChange={checked =>
                                        setDailyRaidsPreferencesForm(current => ({
                                            ...current,
                                            invertHse: checked,
                                        }))
                                    }>
                                    Invert
                                </Switch>
                                <AccessibleTooltip title="When selected, prioritize raids that award the fewest points for the selected HSE">
                                    <Info className="size-4 text-(--primary)" />
                                </AccessibleTooltip>
                            </div>
                        )}
                    </div>
                </div>

                {/* Locations selection + Campaign Event — side by side */}
                <div className="flex flex-wrap gap-6">
                    <fieldset className="min-w-[200px] flex-1">
                        <legend className="mb-2 text-sm font-semibold text-(--fg)">Locations selection:</legend>
                        <div className="flex flex-col gap-2 ps-2">
                            {locationStrategyOptions.map(opt => (
                                <RadioOption
                                    key={opt.value}
                                    name="location-strategy"
                                    value={opt.value}
                                    checked={dailyRaidsPreferencesForm.farmStrategy === opt.value}
                                    onChange={() =>
                                        setDailyRaidsPreferencesForm(current => ({
                                            ...current,
                                            farmStrategy: opt.value,
                                        }))
                                    }>
                                    {opt.label}
                                </RadioOption>
                            ))}
                        </div>
                    </fieldset>

                    <div className="min-w-[200px] flex-1">
                        <Select<CampaignGroupType | 'none'>
                            options={CAMPAIGN_EVENT_OPTIONS}
                            value={selectedCampaignEvent}
                            onChange={value => {
                                setDailyRaidsPreferencesForm(current => ({
                                    ...current,
                                    campaignEvent: value as CampaignGroupType | 'none',
                                }));
                            }}
                            renderOption={opt => CAMPAIGN_EVENT_LABELS[opt]}
                            label="Campaign Event"
                        />
                    </div>
                </div>

                {/* Custom locations (only when strategy is custom) */}
                {dailyRaidsPreferencesForm.farmStrategy === DailyRaidsStrategy.custom && (
                    <DailyRaidsCustomLocations
                        hasCE={!!dailyRaidsPreferencesForm.campaignEvent && selectedCampaignEvent !== 'none'}
                        settings={customLocationsSettings}
                        settingsChange={value => {
                            setCustomLocationsSettings(value);
                            setDailyRaidsPreferencesForm(current => ({ ...current, customSettings: value }));
                        }}
                    />
                )}

                {/* Shop visibility */}
                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-(--fg)">Shop visibility:</legend>
                    <div className="flex flex-col gap-2 ps-2">
                        <Switch
                            isSelected={shopVisibility.showGuildShop}
                            onChange={checked =>
                                setShopVisibility(current => ({ ...current, showGuildShop: checked }))
                            }>
                            Guild Shop
                        </Switch>
                        <Switch
                            isSelected={shopVisibility.showWarShop}
                            onChange={checked => setShopVisibility(current => ({ ...current, showWarShop: checked }))}>
                            War Shop
                        </Switch>
                        <Switch
                            isSelected={shopVisibility.showRogueTrader}
                            onChange={checked =>
                                setShopVisibility(current => ({ ...current, showRogueTrader: checked }))
                            }>
                            Rogue Trader
                        </Switch>
                    </div>
                </fieldset>
            </PortalDialog.Body>

            <PortalDialog.Footer>
                <Button intent="secondary" appearance="plain" onPress={close}>
                    Cancel
                </Button>
                <Button onPress={saveChanges}>Save changes</Button>
            </PortalDialog.Footer>
        </PortalDialog>
    );
};

export default DailyRaidsSettings;
