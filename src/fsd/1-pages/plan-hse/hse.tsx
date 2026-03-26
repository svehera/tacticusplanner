/* eslint-disable import-x/no-internal-modules */
import { MenuItem, Select } from '@mui/material';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useContext, useMemo, useRef, useState } from 'react';

import { ICampaignBattleComposed, IDailyRaidsHomeScreenEvent } from '@/models/interfaces';
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { Campaign, CampaignImage, CampaignLocation, CampaignsService, CampaignType } from '@/fsd/4-entities/campaign';
import { IRewards } from '@/fsd/4-entities/campaign/model';
import { CharactersService } from '@/fsd/4-entities/character';
import { NpcService } from '@/fsd/4-entities/npc';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

interface HseBattle {
    id: string;
    battle: ICampaignBattleComposed;
    energyCost: number;
    points: number;
    pointsPerEnergy: number;
    reward: string;
    dropChance: number;
}

/**
 * @returns The ID of the upgrade material (or shards) rewarded when completing this battle.
 */
const getReward = (rewards: IRewards): string => {
    // Elite battles give a guaranteed material, so return that.
    for (const reward of rewards.guaranteed) {
        if (reward.id === 'gold') continue;
        return reward.id;
    }
    // Otherwise, return the first potential reward that is not gold.
    for (const reward of rewards.potential) {
        if (reward.id === 'gold') continue;
        return reward.id;
    }
    return '';
};

export const HomeScreenEvent = () => {
    const { dailyRaids, viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const gridReference = useRef<AgGridReact<HseBattle>>(null);
    const [campaignsToConsider, setCampaignsToConsider] = useState<Campaign[]>(() => {
        return CampaignsService.allCampaigns.map(x => x.id);
    });
    const [includeRewardlessBattles, setIncludeRewardlessBattles] = useState<boolean>(true);
    const includeExhaustedBattles = viewPreferences.includeExhaustedBattlesInHse ?? true;
    const showHseWarning = viewPreferences.showHseWarning ?? true;

    const exhaustedBattleIds = useMemo(() => {
        return new Set(
            dailyRaids.raidedLocations
                .filter(location => location.raidsAlreadyPerformed >= location.dailyBattleCount)
                .map(location => location.id)
        );
    }, [dailyRaids.raidedLocations]);

    const calculateBestBattles = (
        campaigns: Campaign[],
        includeRewardlessBattles: boolean,
        includeExhaustedBattles: boolean,
        enemyFilter: (npc: ReturnType<typeof NpcService.getNpcById>) => boolean,
        applyEliteCampaignMultiplier: boolean
    ): HseBattle[] => {
        const pointsPerEnergy: Record<number, HseBattle[]> = {};

        for (const [, battles] of Object.entries(CampaignsService.campaignsGrouped).filter(([campaignId]) =>
            campaigns.includes(campaignId as Campaign)
        )) {
            for (const battle of battles) {
                if (!includeExhaustedBattles && exhaustedBattleIds.has(battle.id)) {
                    continue;
                }

                let points =
                    battle.detailedEnemyTypes
                        ?.filter(x => {
                            const npc = NpcService.getNpcById(x.id);
                            if (!npc) {
                                console.warn('battle', battle.id, 'has undefined npc', x);
                                return false;
                            }
                            return !npc.traits.includes('Summon') && enemyFilter(npc);
                        })
                        .map(x => x.count)
                        .reduce((a, b) => a + b, 0) ?? 0;

                if (applyEliteCampaignMultiplier) {
                    points *= battle.campaignType === CampaignType.Elite ? 5 : 3;
                }

                if (points > 0 && (includeRewardlessBattles || getReward(battle.rewards) !== '')) {
                    const details: HseBattle = {
                        id: battle.id,
                        battle: battle,
                        energyCost: battle.energyCost,
                        points: points,
                        pointsPerEnergy: points / battle.energyCost,
                        reward: getReward(battle.rewards),
                        dropChance: battle.dropRate,
                    };
                    const array = pointsPerEnergy[details.pointsPerEnergy] || [];
                    array.push(details);
                    pointsPerEnergy[details.pointsPerEnergy] = array;
                }
            }
        }

        return Object.values(pointsPerEnergy)
            .flat()
            .sort((a, b) => b.dropChance - a.dropChance)
            .sort((a, b) => b.pointsPerEnergy - a.pointsPerEnergy);
    };

    const bestMachineHunt = useMemo(
        () =>
            calculateBestBattles(
                campaignsToConsider,
                includeRewardlessBattles,
                includeExhaustedBattles,
                npc => npc?.traits.includes('Mechanical') ?? false,
                /*applyEliteCampaignMultiplier=*/ false
            ),
        [
            calculateBestBattles,
            campaignsToConsider,
            includeRewardlessBattles,
            includeExhaustedBattles,
            exhaustedBattleIds,
        ]
    );

    const bestPurgeOrder = useMemo(
        () =>
            calculateBestBattles(
                campaignsToConsider,
                includeRewardlessBattles,
                includeExhaustedBattles,
                npc => npc?.faction === 'Tyranids',
                /*applyEliteCampaignMultiplier=*/ true
            ),
        [
            calculateBestBattles,
            campaignsToConsider,
            includeRewardlessBattles,
            includeExhaustedBattles,
            exhaustedBattleIds,
        ]
    );

    const bestTrainingRush = useMemo(
        () =>
            calculateBestBattles(
                campaignsToConsider,
                includeRewardlessBattles,
                includeExhaustedBattles,
                () => true,
                /*applyEliteCampaignMultiplier=*/ true
            ),
        [
            calculateBestBattles,
            campaignsToConsider,
            includeRewardlessBattles,
            includeExhaustedBattles,
            exhaustedBattleIds,
        ]
    );
    const bestWarpSurge = useMemo(
        () =>
            calculateBestBattles(
                campaignsToConsider,
                includeRewardlessBattles,
                includeExhaustedBattles,
                npc => npc?.alliance === 'Chaos',
                /*applyEliteCampaignMultiplier=*/ true
            ),
        [
            calculateBestBattles,
            campaignsToConsider,
            includeRewardlessBattles,
            includeExhaustedBattles,
            exhaustedBattleIds,
        ]
    );

    const rewardIcon = (reward: string) => {
        const upgrade = UpgradesService.getUpgrade(reward);
        if (!upgrade) return reward;
        if (upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
            const char = CharactersService.getUnit(reward.slice(Math.max(0, reward.indexOf('_') + 1)));
            if (char) {
                return <UnitShardIcon name={reward} icon={char.roundIcon} mythic={upgrade.rarity === 'Mythic Shard'} />;
            }
            return reward;
        }

        return (
            <UpgradeImage
                material={upgrade.label}
                iconPath={upgrade.iconPath}
                rarity={RarityMapper.rarityToRarityString(upgrade.rarity)}
            />
        );
    };

    const [selectedEvent, setSelectedEvent] = useState<IDailyRaidsHomeScreenEvent>(
        IDailyRaidsHomeScreenEvent.machineHunt
    );

    const rowData = useMemo(() => {
        switch (selectedEvent) {
            case IDailyRaidsHomeScreenEvent.machineHunt: {
                return bestMachineHunt;
            }
            case IDailyRaidsHomeScreenEvent.purgeOrder: {
                return bestPurgeOrder;
            }
            case IDailyRaidsHomeScreenEvent.trainingRush: {
                return bestTrainingRush;
            }
            case IDailyRaidsHomeScreenEvent.warpSurge: {
                return bestWarpSurge;
            }
            default: {
                return [];
            }
        }
    }, [selectedEvent, bestMachineHunt, bestPurgeOrder, bestWarpSurge, bestTrainingRush]);

    const [columnDefs] = useState<Array<ColDef>>([
        {
            headerName: 'Battle',
            pinned: true,
            maxWidth: 100,
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt) return <span>undefined</span>;
                return <CampaignLocation key={hunt.id} location={hunt.battle} short={true} unlocked={true} />;
            },
        },
        {
            headerName: 'Points per Energy',
            maxWidth: 150,
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt || hunt.pointsPerEnergy === undefined) return <span>undefined</span>;
                return hunt.pointsPerEnergy.toFixed(2);
            },
        },
        { headerName: 'Points', field: 'points', maxWidth: 100 },
        {
            headerName: 'Cumulative Points',
            maxWidth: 130,
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt) return null;
                const rowIndex = params.node.rowIndex ?? 0;
                let cumulativeGears = 0;
                for (let index = 0; index <= rowIndex; index++) {
                    const data = params.api.getDisplayedRowAtIndex(index)?.data;
                    if (data) {
                        cumulativeGears += data.points * data.battle.dailyBattleCount;
                    }
                }
                return <span>{cumulativeGears}</span>;
            },
        },
        {
            headerName: 'Energy Cost',
            field: 'energyCost',
            maxWidth: 130,
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt) return null;
                return (
                    <>
                        <MiscIcon icon="energy" width={24} height={24} />
                        <span>{hunt.energyCost}</span>
                    </>
                );
            },
        },
        {
            headerName: 'Cumulative Energy Cost',
            maxWidth: 130,
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt) return null;
                const rowIndex = params.node.rowIndex ?? 0;
                let cumulativeEnergy = 0;
                for (let index = 0; index <= rowIndex; index++) {
                    const data = params.api.getDisplayedRowAtIndex(index)?.data;
                    if (data) {
                        cumulativeEnergy += data.energyCost * data.battle.dailyBattleCount;
                    }
                }
                return (
                    <>
                        <MiscIcon icon="energy" width={24} height={24} />
                        <span>{cumulativeEnergy}</span>
                    </>
                );
            },
        },
        {
            headerName: 'Reward',
            field: 'reward',
            cellRenderer: (params: ICellRendererParams<HseBattle>) => {
                const hunt = params.data;
                if (!hunt) return null;
                return rewardIcon(hunt.reward);
            },
        },
        {
            headerName: 'Drop Chance',
            field: 'dropChance',
            maxWidth: 130,
            valueFormatter: params => ((params.data?.dropChance ?? 0) * 100).toFixed(2) + '%',
        },
    ]);

    return (
        <div>
            {showHseWarning && (
                <div className="mb-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-red-100">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="m-0 text-base leading-relaxed font-semibold">
                            This page is informational only. You most likely want the Daily Raids page instead, where
                            you can go to settings and tell it to optimize for whichever home-screen event is ongoing,
                            so you make progress on the event without derailing your goals.
                        </h1>
                        <button
                            type="button"
                            aria-label="Dismiss warning permanently"
                            className="rounded px-2 py-0.5 text-red-200 hover:bg-red-500/20 hover:text-red-100"
                            onClick={() =>
                                dispatch.viewPreferences({
                                    type: 'Update',
                                    setting: 'showHseWarning',
                                    value: false,
                                })
                            }>
                            ×
                        </button>
                    </div>
                </div>
            )}
            <div>
                <div className="m-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="event-select">Choose an event:</label>
                        <Select
                            name="events"
                            id="event-select"
                            value={selectedEvent}
                            onChange={event => setSelectedEvent(event.target.value as IDailyRaidsHomeScreenEvent)}
                            size="small"
                            className="rounded-md bg-slate-700">
                            <MenuItem value={IDailyRaidsHomeScreenEvent.purgeOrder}>Purge Order</MenuItem>
                            <MenuItem value={IDailyRaidsHomeScreenEvent.trainingRush}>Training Rush</MenuItem>
                            <MenuItem value={IDailyRaidsHomeScreenEvent.warpSurge}>Warp Surge</MenuItem>
                            <MenuItem value={IDailyRaidsHomeScreenEvent.machineHunt}>Machine Hunt</MenuItem>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="campaign-select">Campaigns to consider:</label>
                        <Select
                            name="campaigns"
                            id="campaign-select"
                            multiple
                            value={campaignsToConsider}
                            onChange={event => {
                                const {
                                    target: { value },
                                } = event;
                                setCampaignsToConsider(
                                    // On autofill we get a stringified value.
                                    (typeof value === 'string' ? value.split(',') : value).map(id => id as Campaign)
                                );
                            }}
                            size="small"
                            className="rounded-md bg-slate-700"
                            style={{ minWidth: 200, maxWidth: 500 }}>
                            {CampaignsService.allCampaigns.map(campaign => (
                                <MenuItem key={campaign.id} value={campaign.id} className="flex items-center gap-2">
                                    <CampaignImage campaign={campaign.id} size={30} />
                                    {campaign.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="ignore-early-indom"
                            checked={includeRewardlessBattles}
                            onChange={event => setIncludeRewardlessBattles(event.target.checked)}
                        />
                        <label htmlFor="ignore-early-indom">Include battles with no rewards</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="include-exhausted-battles"
                            checked={includeExhaustedBattles}
                            onChange={event =>
                                dispatch.viewPreferences({
                                    type: 'Update',
                                    setting: 'includeExhaustedBattlesInHse',
                                    value: event.target.checked,
                                })
                            }
                        />
                        <label htmlFor="include-exhausted-battles">Include exhausted battles</label>
                    </div>
                </div>
            </div>
            <div className="ag-theme-material h-[calc(100vh-220px)] w-full">
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    ref={gridReference}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                    columnDefs={columnDefs}
                    rowData={rowData}
                />
            </div>
        </div>
    );
};
