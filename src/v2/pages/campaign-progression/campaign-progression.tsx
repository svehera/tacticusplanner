import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { ICampaignBattleComposed, IUnitData } from 'src/models/interfaces';
import { CampaignType, Rank, Rarity, RarityStars } from 'src/models/enums';

import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { StoreContext } from 'src/reducers/store.provider';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import {
    BattleSavings,
    CampaignData,
    CampaignProgressData,
} from 'src/v2/features/campaign-progression/campaign-progression.models';
import { CampaignProgressionAscensionGoals } from 'src/v2/pages/campaign-progression/campaign-progression-ascension-goals';
import { CampaignProgressionHeader } from 'src/v2/pages/campaign-progression/campaign-progression-header';
import { CampaignProgressionUnfarmableMaterials } from 'src/v2/pages/campaign-progression/campaign-progression-unfarmable-materials';
import { CampaignsProgressionService } from 'src/v2/features/campaign-progression/campaign-progression.service';

import { GoalsService } from 'src/v2/features/goals/goals.service';
import { CharacterImage } from 'src/shared-components/character-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { MiscIcon } from 'src/shared-components/misc-icon';
import { StaticDataService } from 'src/services/static-data.service';
import { ArrowForward } from '@mui/icons-material';
import {
    ICharacterUpgradeRankGoal,
    ICharacterUpgradeMow,
    ICharacterUnlockGoal,
    ICharacterAscendGoal,
} from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { RarityImage } from 'src/shared-components/rarity-image';
import { StarsImage } from 'src/v2/components/images/stars-image';
import { Tooltip } from '@mui/material';

export const CampaignProgression = () => {
    const { goals, characters, mows, campaignsProgress } = useContext(StoreContext);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals } = useMemo(() => {
        return GoalsService.prepareGoals(goals, [...characters, ...mows], false);
    }, [goals, characters, mows]);

    const progression = useMemo(() => {
        const allGoals: Array<
            ICharacterUpgradeMow | ICharacterUpgradeRankGoal | ICharacterUnlockGoal | ICharacterAscendGoal
        > = shardsGoals;
        for (const goal of upgradeRankOrMowGoals) {
            allGoals.push(goal);
        }
        return CampaignsProgressionService.computeCampaignsProgress(allGoals, campaignsProgress);
    }, [allGoals, campaignsProgress]);

    const campaignDataArray = useMemo(() => {
        const result: CampaignData[] = [];
        for (const [campaign, data] of progression.data.entries()) {
            result.push([campaign, data]);
        }
        return result;
    }, [progression]);

    /** @returns the quantity of this upgrade material that our goals require. */
    function getRequiredMaterialCount(material: string): number {
        return progression.materialFarmData.get(material)?.count ?? 0;
    }

    /** @returns the goal with the given ID. */
    function getGoal(
        goalId: string
    ): ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow | undefined {
        let filtered: Array<
            ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow
        > = upgradeRankOrMowGoals.filter(goal => goal.goalId == goalId);
        if (filtered.length == 0) {
            filtered = shardsGoals.filter(goal => goal.goalId == goalId);
        }
        if (filtered.length == 0) {
            console.warn('goalId not found { ' + goalId + ' ' + upgradeRankOrMowGoals.length + ' }');
            return undefined;
        }
        if (filtered.length > 1) {
            console.warn('multiple goals with ID ' + goalId + ' found.');
        }
        return filtered[0];
    }

    /** @returns the unit specified in the goal with the given ID. */
    function getGoalUnit(goalId: string): IUnitData | undefined {
        if (!getGoal(goalId)) return undefined;
        return StaticDataService.getUnit(getGoal(goalId)!.unitId) ?? undefined;
    }

    /** @returns the unit specified in the goal with the given ID. */
    function getGoalShardsUnit(characterName: string): IUnitData | undefined {
        return StaticDataService.getUnit(characterName);
    }

    /**
     * @returns the starting rank of the goal. If the
     * goal is an unlock goal, returns 0, meaning 'Locked'.
     */
    function getGoalRankStart(goalId: string): number {
        const goal = getGoal(goalId);
        if (goal && 'rankStart' in goal) return goal.rankStart;
        return 0;
    }

    /**
     * @returns the starting rank of the goal. If the
     * goal is an unlock goal, returns 1, meaning stone1.
     */
    function getGoalRankEnd(goalId: string): number {
        // I have no idea why, but the typescript compiler in
        // WebStorm thinks that we have to jump through all of
        // these hoops here, but not in getGoalRankStart above.
        const goal = getGoal(goalId);
        let rankEnd: number = 1;
        if (!goal) return 1;
        Object.entries(goal).forEach(([key, value]) => {
            if (key == 'rankEnd') rankEnd = value as number;
        });
        return rankEnd;
    }

    /** @returns the web link to the rank-up lookup of the given goal. */
    function getRankLookupHref(goalId: string): string {
        const rankStart = Math.max(getGoalRankStart(goalId), 1);
        const rankEnd = getGoalRankEnd(goalId);
        return (
            '../../learn/rankLookup?character=' +
            getGoalUnit(goalId)?.id +
            '&rankStart=' +
            Rank[rankStart] +
            '&rankEnd=' +
            Rank[Math.max(rankStart + 1, rankEnd)]
        );
    }

    /**
     * @returns the rankup goal with the given ID, or undefined if it either
     *          doesn't exist, or isn't a rankup goal.
     */
    function getRankUpGoal(goalId: string): ICharacterUpgradeRankGoal | undefined {
        const goal = getGoal(goalId);
        if (goal && 'rankStart' in goal) return goal as ICharacterUpgradeRankGoal;
        return undefined;
    }

    /**
     * @returns the column defs for the grid that holds the character
     * goals related to the campaign.
     */
    function getRankUpColumnDefs(): ColDef[] {
        return [
            {
                headerName: 'A',
                width: 35,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    return (
                        <a href={getRankLookupHref(goalData.goalId)}>
                            <CharacterImage
                                icon={getGoalUnit(goalData.goalId)?.icon ?? '(undefined)'}
                                imageSize={30}
                                tooltip={getGoalUnit(goalData.goalId)?.icon}
                            />
                        </a>
                    );
                },
            },
            {
                headerName: 'B',
                width: 60,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    return <RankImage rank={getGoalRankStart(goalData.goalId)} />;
                },
            },
            {
                headerName: 'C',
                width: 35,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    return <ArrowForward />;
                },
            },
            {
                headerName: 'D',
                width: 60,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    return <RankImage rank={getGoalRankEnd(goalData.goalId)} />;
                },
            },
            {
                headerName: 'E',
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    return (
                        <span>
                            costs {goalData.goalCost} <MiscIcon icon={'energy'} height={15} width={15} />
                        </span>
                    );
                },
            },
        ];
    }

    /**
     * @returns the row data for the grid that holds the ascend-character
     *          goals related to the campaign.
     */
    function getRankUpGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getRankUpGoal(goalId);
            if (goal) rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
        }
        return rowData;
    }

    function campaignTypeToNumber(type: CampaignType): number {
        switch (type) {
            case CampaignType.Elite:
                return 0;
            case CampaignType.Early:
                return 1;
            case CampaignType.Mirror:
                return 2;
            case CampaignType.Normal:
                return 3;
            default:
                return 4;
        }
    }

    /** @returns true iff typeA is more cost-efficient at farming than typeB.  */
    function isCampaignTypeMoreEfficient(typeA: CampaignType, typeB: CampaignType): boolean {
        return campaignTypeToNumber(typeA) < campaignTypeToNumber(typeB);
    }

    /**
     * @param material The material to farm.
     * @returns The battle representing the best node to farm (picked
     *          arbitrarily if there's a tie) currently farmable for the
     *          material.
     */
    function getCheapestNode(material: string): ICampaignBattleComposed | undefined {
        let result: ICampaignBattleComposed | undefined = undefined;
        for (const loc of progression.materialFarmData.get(material)?.farmableLocations ?? []) {
            if (!result || isCampaignTypeMoreEfficient(loc.campaignType, result.campaignType)) {
                result = loc;
            }
        }
        return result;
    }

    /**
     * @returns the tooltip text to display that gives human-readable language
     *          describing how the savings were computed.
     */
    function getSavingsTooltipText(material: string): string {
        const node = getCheapestNode(material);
        if (!node) return '(unfarmable)';
        return (
            material +
            ' is currently farmable from ' +
            node.id +
            '. You need ' +
            getRequiredMaterialCount(material) +
            ' to complete your goals, which costs ' +
            CampaignsProgressionService.getCostToFarmMaterial(
                node.campaignType,
                getRequiredMaterialCount(material),
                node.rarityEnum
            ) +
            ' energy, before beating this node.'
        );
    }

    /**
     * @returns the column defs for the grid that holds the material
     * requirements related to the campaign.
     */
    function getMaterialColumnDefs(): ColDef[] {
        return [
            {
                headerName: 'A',
                autoHeight: true,
                width: 70,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    return (
                        <CampaignLocation
                            key={savings.battle.id}
                            location={savings.battle}
                            short={true}
                            unlocked={true}
                        />
                    );
                },
            },
            {
                headerName: 'B',
                autoHeight: true,
                width: 35,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    return <ArrowForward />;
                },
            },
            {
                headerName: 'C',
                autoHeight: true,
                width: 35,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return '';
                    const savings: BattleSavings = savingsData[0].savings;
                    if (UpgradesService.getUpgradeMaterial(savings.battle.reward)) {
                        return (
                            <UpgradeImage
                                material={savings.battle.reward}
                                iconPath={UpgradesService.getUpgradeMaterial(savings.battle.reward)?.icon ?? ''}
                                rarity={savings.battle.rarityEnum}
                                size={30}
                            />
                        );
                    }
                    return (
                        <CharacterImage
                            icon={getGoalShardsUnit(savings.battle.reward)?.icon ?? '(undefined)'}
                            imageSize={30}
                            tooltip={getGoalShardsUnit(savings.battle.reward)?.icon}
                        />
                    );
                },
            },
            {
                headerName: 'D',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    return <span>Goals require {getRequiredMaterialCount(savings.battle.reward)}x</span>;
                },
            },
            {
                headerName: 'E',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (!savings.canFarmPrior) {
                        return <span>Unlocks the material.</span>;
                    } else {
                        return (
                            <Tooltip title={getSavingsTooltipText(savings.battle.reward)}>
                                <span>
                                    Saves {savings.savings} <MiscIcon icon={'energy'} height={15} width={15} />
                                </span>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                headerName: 'F',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (savings && savings.canFarmPrior) {
                        return (
                            <span>
                                Cumulative {savings.cumulativeSavings}{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} />
                            </span>
                        );
                    }
                },
            },
            {
                headerName: 'G',
                autoHeight: true,
                cellStyle: { width: '100%' },
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    const characters = getCharactersNeedingMaterial(savings.battle.reward);
                    if (characters.length == 0) return <span></span>;
                    return characters.map((unitId, ignoredIndex) => {
                        return (
                            <span key={savings.battle.id + '-' + savings.battle.reward + '-' + unitId}>
                                <CharacterImage
                                    icon={StaticDataService.getUnit(unitId)?.icon ?? '(undefined)'}
                                    imageSize={30}
                                    tooltip={StaticDataService.getUnit(unitId)?.icon}
                                />
                            </span>
                        );
                    });
                },
            },
        ];
    }

    /**
     * Returns the unit ID of each character that has a goal requiring at least
     * one instance of `material`.
     */
    function getCharactersNeedingMaterial(material: string): string[] {
        return Array.from(progression.charactersNeedingMaterials.get(material) ?? []);
    }

    /**
     * @returns the row data for the grid that holds the material
     * requirements related to the campaign.
     */
    function getCampaignMaterialData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const savings of campaignData[1].savings) {
            rowData.push({ savingsData: [{ savings: savings }] });
        }
        return rowData;
    }

    /**
     * @returns the ascension goal with the given ID, or undefined if it either
     *          doesn't exist, or isn't an ascension goal.
     */
    function getAscensionGoal(goalId: string): ICharacterAscendGoal | undefined {
        const goal = getGoal(goalId);
        if (goal && 'rarityStart' in goal && 'starsStart' in goal) return goal as ICharacterAscendGoal;
        return undefined;
    }

    /**
     * @returns the row data for the grid that holds the ascend-character
     *          goals related to the campaign.
     */
    function getAscendGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getAscensionGoal(goalId);
            if (goal) {
                rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
            }
        }
        return rowData;
    }

    return (
        <div key="root">
            <CampaignProgressionHeader />
            <CampaignProgressionUnfarmableMaterials progression={progression} campaignDataArray={campaignDataArray} />
            <h1>Campaign Progression</h1>
            {campaignDataArray.map((entry, ignored) => {
                const [rankUpGoalDefs, setRankUpGoalDefs] = useState(getRankUpColumnDefs());
                const [materialDefs, setMaterialDefs] = useState(getMaterialColumnDefs());
                return (
                    <div key={'grid_' + entry[0]}>
                        <p />
                        <p />
                        <table>
                            <tbody>
                                <tr>
                                    <td>
                                        <CampaignImage campaign={entry[0]} />
                                    </td>
                                    <td>{entry[0]}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p />
                        <p />
                        {getAscendGoalData(entry).length > 0 && (
                            <CampaignProgressionAscensionGoals campaignData={entry} goals={shardsGoals} />
                        )}
                        {getRankUpGoalData(entry).length > 0 && (
                            <AgGridReact
                                columnDefs={rankUpGoalDefs}
                                rowData={getRankUpGoalData(entry)}
                                domLayout="autoHeight"
                                headerHeight={0}
                                rowHeight={32}></AgGridReact>
                        )}
                        {getCampaignMaterialData(entry).length > 0 && (
                            <AgGridReact
                                columnDefs={materialDefs}
                                rowData={getCampaignMaterialData(entry)}
                                domLayout="autoHeight"
                                headerHeight={0}
                                rowHeight={32}></AgGridReact>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
