import { ArrowForward } from '@mui/icons-material';
import { ColDef, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { Rank } from '@/fsd/5-shared/model';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

import { CampaignData } from 'src/v2/features/campaign-progression/campaign-progression.models';
import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from 'src/v2/features/goals/goals.models';

interface Props {
    campaignData: CampaignData;
    goals: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow>;
}

export const CampaignProgressionRankupGoals: React.FC<Props> = ({ campaignData, goals }) => {
    const [goalDefs] = useState(getColumnDefs());

    /** @returns the goal with the given ID. */
    function getGoal(goalId: string): ICharacterUpgradeRankGoal | ICharacterUpgradeMow | undefined {
        const filtered: Array<ICharacterUpgradeRankGoal | ICharacterUpgradeMow> = goals.filter(
            goal => goal.goalId == goalId
        );
        if (filtered.length == 0) {
            return undefined;
        }
        if (filtered.length > 1) {
            console.warn('multiple goals with ID ' + goalId + ' found.');
        }
        return filtered[0];
    }

    /**
     * @returns the row data for the grid that holds the ascend-character
     *          goals related to the campaign.
     */
    function getGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getGoal(goalId);
            if (goal) rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
        }
        return rowData;
    }

    /** @returns the unit specified in the goal with the given ID. */
    function getGoalUnit(goalId: string): ICharacterData | undefined {
        if (!getGoal(goalId)) return undefined;
        return CharactersService.getUnit(getGoal(goalId)!.unitId) ?? undefined;
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
     * @returns the column defs for the grid that holds the character
     * goals related to the campaign.
     */
    function getColumnDefs(): ColDef[] {
        return [
            {
                headerName: 'A',
                width: 45,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    return (
                        <a href={getRankLookupHref(goalData.goalId)}>
                            <UnitShardIcon
                                icon={getGoalUnit(goalData.goalId)?.icon ?? '(undefined)'}
                                height={30}
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
                    return <RankIcon rank={getGoalRankStart(goalData.goalId)} />;
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
                    return <RankIcon rank={getGoalRankEnd(goalData.goalId)} />;
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

    return (
        <AgGridReact
            modules={[AllCommunityModule]}
            theme={themeBalham}
            columnDefs={goalDefs}
            rowData={getGoalData(campaignData)}
            domLayout="autoHeight"
            headerHeight={0}
            rowHeight={32}
        />
    );
};
