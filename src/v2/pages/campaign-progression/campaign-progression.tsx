import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { IUnitData } from 'src/models/interfaces';
import { Rank } from 'src/models/enums';

import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { StoreContext } from 'src/reducers/store.provider';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import {
    BattleSavings,
    CampaignProgressData,
    CampaignsProgressionService,
} from 'src/v2/features/goals/campaigns-progression';
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
import { alignProperty } from '@mui/material/styles/cssUtils';

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
        return CampaignsProgressionService.computeCampaignsProgress(allGoals, campaignsProgress, {});
    }, [allGoals, campaignsProgress]);

    type CampaignData = [string, CampaignProgressData];

    const campaignDataArray = useMemo(() => {
        const result: CampaignData[] = [];
        for (const [campaign, data] of progression.data.entries()) {
            result.push([campaign, data]);
        }
        return result;
    }, [progression]);

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

    /** @returns the header to display at the top of the page. */
    function renderHeader(): any {
        return (
            <span>
                This page is in beta.If you see bugs, or have features you would like
                <br />
                added, please contact cpunerd via{' '}
                <a href="https://discord.gg/8mcWKVAYZf">
                    Discord&apos;s Tacticus
                    <br />
                    Planner channel
                </a>
                .
                <p />
                Found this site helpful ? Consider using the maintainer& apos;s Refer - A - Friend code & apos; DUG - 38
                - VAT & apos;.
                <br />
                Maybe also <a href="https://buymeacoffee.com/tacticusplanner"> buy</a> the site owner a coffee ?
                <p />
                Instructions:
                <ol>
                    <li>
                        Enter your roster in the <a href="../../input/wyo">Who You Own</a> page.
                    </li>
                    <li>
                        Enter your campaign progress in the{' '}
                        <a href="../../input/campaignsProgress">Campaigns Progress</a> page.
                    </li>
                    <li>
                        Enter your goals in the <a href="../../plan/goals">Goals</a> page.
                    </li>
                    <li>
                        Review these results and adust your goals.
                        <ol>
                            <li>
                                Consider the balance between spending energy to upgrade the necessary units and beating
                                the requisite battles.
                            </li>
                            <li>
                                Work towards the goals that have the biggest bang for your buck. Least energy spent
                                yielding the most energy saved.
                            </li>
                            <li>
                                Mark your goals complete as you progress, and revisit this page periodically for more
                                advice.
                            </li>
                        </ol>
                    </li>
                </ol>
                <p />
                Known Issues and Future Work
                <ol>
                    <li>
                        The UI is bad. But I&apos;m a backend engineer, so I&apos;d need suggestions on how to spruce it
                        up.
                    </li>
                    <li>
                        Ignores current inventory but uses applied upgrades. The savings would be hard to parse if we
                        used the current inventory.
                    </li>
                    <li>Doesn&apos;t work well with ascension/unlock goals.</li>
                    <li>
                        Doesn&apos;t list nodes that unlock already-unlocked materials, which might allow one to farm
                        more items faster (but not any more cheaply).
                    </li>
                    <li>Ignores upgrade-ability goals.</li>
                    <li>
                        Machines of war are taken into consideration in total cost, but aren&apos;t displayed anywhere
                        because they aren&apos;t relevant to campaigns.
                    </li>
                    <li>
                        <s>Rank-up goal costs should link to the rank-lookup page.</s>
                    </li>
                    <li>
                        <s>Target rank icons should link to the goal page.</s>
                    </li>
                    <li>
                        <s>The large campaign icons should link to the campaign&apos;s &apos;Learn&apos; page.</s>
                    </li>
                    <li>
                        Battles that unlock a material should display the character icons of all characters requiring
                        the material.
                    </li>
                    <li>
                        The amount saved should link to a small dialog or tooltip explaining the savings (computation
                        with farmable nodes, new computation with this node).
                    </li>
                </ol>
            </span>
        );
    }

    /**
     * @returns the column defs for the grid that holds the character
     * goals related to the campaign.
     */
    function getCampaignColumnDefs(): ColDef[] {
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
                    return (
                        <div style={{ justifyContent: 'center' }}>
                            <RankImage rank={getGoalRankStart(goalData.goalId)} />
                        </div>
                    );
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
     * @returns the row data for the grid that holds the character
     * goals related to the campaign.
     */
    function getCampaignGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
        }
        return rowData;
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
                    if (savings.wouldUnlockFor.length > 0) {
                        return <span>Unlocks the material.</span>;
                    } else {
                        return (
                            <span>
                                Saves {savings.savings} <MiscIcon icon={'energy'} height={15} width={15} />
                            </span>
                        );
                    }
                },
            },
            {
                headerName: 'E',
                autoHeight: true,
                cellRenderer: (params: any) => {
                    const savingsData = params.data.savingsData;
                    if (!savingsData) return <span>Unimplemented</span>;
                    const savings: BattleSavings = savingsData[0].savings;
                    if (savings.wouldUnlockFor.length > 0) {
                        return <span>Unlocks the material.</span>;
                    } else {
                        return (
                            <span>
                                Cumulative {savings.cumulativeSavings}{' '}
                                <MiscIcon icon={'energy'} height={15} width={15} />
                            </span>
                        );
                    }
                },
            },
        ];
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

    return (
        <div key="root">
            {renderHeader()}
            <h1>Campaign Progression</h1>
            {campaignDataArray.map((entry, ignored) => {
                const [goalDefs, setGoalDefs] = useState(getCampaignColumnDefs());
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
                        <AgGridReact
                            columnDefs={goalDefs}
                            rowData={getCampaignGoalData(entry)}
                            domLayout="autoHeight"
                            headerHeight={0}
                            rowHeight={32}></AgGridReact>
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
