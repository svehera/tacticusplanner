import { MenuItem, Select } from '@mui/material';
import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo, useRef, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICampaignBattleComposed, IDailyRaidsHomeScreenEvent } from '@/models/interfaces';

import { RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { Campaign, CampaignImage, CampaignLocation, CampaignsService, CampaignType } from '@/fsd/4-entities/campaign';
// eslint-disable-next-line import-x/no-internal-modules
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

export const HomeScreenEvent = () => {
    const gridRef = useRef<AgGridReact<HseBattle>>(null);
    const [campaignsToConsider, setCampaignsToConsider] = useState<Campaign[]>(() => {
        return CampaignsService.allCampaigns.map(x => x.id);
    });

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

    const bestMachineHunt = useMemo(() => {
        const pointsPerEnergy: Record<number, HseBattle[]> = {};
        Object.entries(CampaignsService.campaignsGrouped)
            .filter(([campaignId]) => campaignsToConsider.includes(campaignId as Campaign))
            .forEach(([, battles]) => {
                battles.forEach(battle => {
                    const points =
                        battle.detailedEnemyTypes
                            ?.filter(x => {
                                const npc = NpcService.getNpcById(x.id);
                                return (
                                    npc !== undefined &&
                                    npc!.traits.includes('Mechanical') &&
                                    !npc!.traits.includes('Summon')
                                );
                            })
                            ?.map(x => x.count)
                            .reduce((a, b) => a + b, 0) ?? 0;
                    const details: HseBattle = {
                        id: battle.id,
                        battle: battle,
                        energyCost: battle.energyCost,
                        points: points,
                        pointsPerEnergy: points / battle.energyCost,
                        reward: getReward(battle.rewards),
                        dropChance: battle.dropRate,
                    };
                    if (points > 0) {
                        const arr = pointsPerEnergy[details.pointsPerEnergy] || [];
                        arr.push(details);
                        pointsPerEnergy[details.pointsPerEnergy] = arr;
                    }
                });
            });
        let arr = Object.values(pointsPerEnergy);
        arr = arr.sort((a, b) => b[0].pointsPerEnergy - a[0].pointsPerEnergy);
        return arr;
    }, [campaignsToConsider]);

    const bestPurgeOrder = useMemo(() => {
        const pointsPerEnergy: Record<number, HseBattle[]> = {};
        Object.entries(CampaignsService.campaignsGrouped)
            .filter(([campaignId]) => campaignsToConsider.includes(campaignId as Campaign))
            .forEach(([, battles]) => {
                battles.forEach(battle => {
                    let points =
                        battle.detailedEnemyTypes
                            ?.filter(x => {
                                const npc = NpcService.getNpcById(x.id);
                                if (npc === undefined) {
                                    console.warn('battle ', battle.id, ' has undefined npc ', x);
                                }
                                return npc!.faction! === 'Tyranids' && !npc!.traits.includes('Summon');
                            })
                            ?.map(x => x.count)
                            .reduce((a, b) => a + b, 0) ?? 0;
                    if (battle.campaignType === CampaignType.Elite) points *= 5;
                    else points *= 3;
                    const details: HseBattle = {
                        id: battle.id,
                        battle: battle,
                        energyCost: battle.energyCost,
                        points: points,
                        pointsPerEnergy: points / battle.energyCost,
                        reward: getReward(battle.rewards),
                        dropChance: battle.dropRate,
                    };
                    if (points > 0) {
                        const arr = pointsPerEnergy[details.pointsPerEnergy] || [];
                        arr.push(details);
                        pointsPerEnergy[details.pointsPerEnergy] = arr;
                    }
                });
            });
        let arr = Object.values(pointsPerEnergy);
        arr = arr.sort((a, b) => b[0].pointsPerEnergy - a[0].pointsPerEnergy);
        return arr;
    }, [campaignsToConsider]);

    const bestTrainingRush = useMemo(() => {
        const pointsPerEnergy: Record<number, HseBattle[]> = {};
        Object.entries(CampaignsService.campaignsGrouped)
            .filter(([campaignId]) => campaignsToConsider.includes(campaignId as Campaign))
            .forEach(([, battles]) => {
                battles.forEach(battle => {
                    let points =
                        battle.detailedEnemyTypes
                            ?.filter(x => {
                                const npc = NpcService.getNpcById(x.id);
                                if (npc === undefined) {
                                    console.warn('battle ', battle.id, ' has undefined npc ', x);
                                }
                                return !npc!.traits.includes('Summon');
                            })
                            ?.map(x => x.count)
                            .reduce((a, b) => a + b, 0) ?? 0;
                    if (battle.campaignType === CampaignType.Elite) points *= 5;
                    else points *= 3;
                    const details: HseBattle = {
                        id: battle.id,
                        battle: battle,
                        energyCost: battle.energyCost,
                        points: points,
                        pointsPerEnergy: points / battle.energyCost,
                        reward: getReward(battle.rewards),
                        dropChance: battle.dropRate,
                    };
                    if (points > 0) {
                        const arr = pointsPerEnergy[details.pointsPerEnergy] || [];
                        arr.push(details);
                        pointsPerEnergy[details.pointsPerEnergy] = arr;
                    }
                });
            });
        let arr = Object.values(pointsPerEnergy);
        arr = arr.sort((a, b) => b[0].pointsPerEnergy - a[0].pointsPerEnergy);
        return arr;
    }, [campaignsToConsider]);

    const bestWarpSurge = useMemo(() => {
        const pointsPerEnergy: Record<number, HseBattle[]> = {};
        Object.entries(CampaignsService.campaignsGrouped)
            .filter(([campaignId]) => campaignsToConsider.includes(campaignId as Campaign))
            .forEach(([, battles]) => {
                battles.forEach(battle => {
                    let points =
                        battle.detailedEnemyTypes
                            ?.filter(x => {
                                const npc = NpcService.getNpcById(x.id);
                                if (npc === undefined) {
                                    console.warn('battle ', battle.id, ' has undefined npc ', x);
                                }
                                return npc!.alliance! === 'Chaos' && !npc!.traits.includes('Summon');
                            })
                            ?.map(x => x.count)
                            .reduce((a, b) => a + b, 0) ?? 0;
                    if (battle.campaignType === CampaignType.Elite) points *= 5;
                    else points *= 3;
                    const details: HseBattle = {
                        id: battle.id,
                        battle: battle,
                        energyCost: battle.energyCost,
                        points: points,
                        pointsPerEnergy: points / battle.energyCost,
                        reward: getReward(battle.rewards),
                        dropChance: battle.dropRate,
                    };
                    if (points > 0) {
                        const arr = pointsPerEnergy[details.pointsPerEnergy] || [];
                        arr.push(details);
                        pointsPerEnergy[details.pointsPerEnergy] = arr;
                    }
                });
            });
        let arr = Object.values(pointsPerEnergy);
        arr = arr.sort((a, b) => b[0].pointsPerEnergy - a[0].pointsPerEnergy);
        return arr;
    }, [campaignsToConsider]);

    const rewardIcon = (reward: string) => {
        const upgrade = UpgradesService.getUpgrade(reward);
        if (!upgrade) {
            if (!reward) {
                return <span>Unknown Reward</span>;
            }
            if (reward.startsWith('shards_')) {
                const char = CharactersService.getUnit(reward.substring(7));
                if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                return reward.substring(7);
            }
            if (reward.startsWith('mythicShards_')) {
                const char = CharactersService.getUnit(reward.substring(13));
                if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                return reward.substring(13);
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
            case IDailyRaidsHomeScreenEvent.machineHunt:
                return bestMachineHunt.flat();
            case IDailyRaidsHomeScreenEvent.purgeOrder:
                return bestPurgeOrder.flat();
            case IDailyRaidsHomeScreenEvent.trainingRush:
                return bestTrainingRush.flat();
            case IDailyRaidsHomeScreenEvent.warpSurge:
                return bestWarpSurge.flat();
            default:
                return [];
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
                for (let i = 0; i <= rowIndex; i++) {
                    const data = params.api.getDisplayedRowAtIndex(i)?.data;
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
                for (let i = 0; i <= rowIndex; i++) {
                    const data = params.api.getDisplayedRowAtIndex(i)?.data;
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
            <div>
                <h1>
                    This page is informational only. You most likely want the Daily Raids page instead, where you can go
                    to settings and tell it to optimize for whichever home-screen event is ongoing, so you make progress
                    on the event without derailing your goals.
                </h1>
            </div>
            <div>
                <div className="m-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="event-select">Choose an event:</label>
                        <Select
                            name="events"
                            id="event-select"
                            value={selectedEvent}
                            onChange={e => setSelectedEvent(e.target.value as IDailyRaidsHomeScreenEvent)}
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
                            onChange={e => {
                                const {
                                    target: { value },
                                } = e;
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
                </div>
            </div>
            <div className="ag-theme-material w-full h-[calc(100vh-220px)]">
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    ref={gridRef}
                    suppressCellFocus={true}
                    defaultColDef={{ resizable: true, sortable: true, autoHeight: true }}
                    columnDefs={columnDefs}
                    rowData={rowData}
                />
            </div>
        </div>
    );
};
