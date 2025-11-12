import { ArrowForward } from '@mui/icons-material';
import { ColDef, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo } from 'react';

import { UnitShardIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, ICharacterData } from '@/fsd/4-entities/character';
import { ICharacterAscendGoal, ICharacterUnlockGoal } from '@/fsd/4-entities/goal';

import { CampaignData } from './campaign-progression.models';

interface Props {
    campaignData: CampaignData;
    goals: Array<ICharacterUnlockGoal | ICharacterAscendGoal>;
}

export const CampaignProgressionAscensionGoals: React.FC<Props> = ({ campaignData, goals }) => {
    /** @returns the goal with the given ID. */
    function getGoal(goalId: string): ICharacterAscendGoal | ICharacterUnlockGoal | undefined {
        const filtered: Array<ICharacterAscendGoal | ICharacterUnlockGoal> = goals.filter(
            goal => goal.goalId == goalId
        );
        if (filtered.length == 0) return undefined;
        if (filtered.length > 1) {
            console.warn('multiple goals with ID ' + goalId + ' found.');
        }
        return filtered[0];
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
    function getGoalData(campaignData: CampaignData): any[] {
        const rowData: any[] = [];
        for (const [goalId, cost] of campaignData[1].goalCost) {
            const goal = getAscensionGoal(goalId);
            if (goal) {
                rowData.push({ goalData: [{ goalId: goalId, goalCost: cost }] });
            }
        }
        return rowData;
    }

    /** @returns the unit specified in the goal with the given ID. */
    function getGoalUnit(goalId: string): ICharacterData | undefined {
        if (!getGoal(goalId)) return undefined;
        return CharactersService.getUnit(getGoal(goalId)!.unitId) ?? undefined;
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
                        <UnitShardIcon
                            icon={getGoalUnit(goalData.goalId)?.roundIcon ?? '(undefined)'}
                            height={30}
                            tooltip={getGoalUnit(goalData.goalId)?.name}
                        />
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
                    const goal: ICharacterAscendGoal = getAscensionGoal(goalData.goalId)!;
                    return <RarityIcon rarity={goal.rarityStart} />;
                },
            },
            {
                headerName: 'C',
                width: 60,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    const goal: ICharacterAscendGoal = getAscensionGoal(goalData.goalId)!;
                    return <StarsIcon stars={goal.starsStart} />;
                },
            },
            {
                headerName: 'D',
                width: 35,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    return <ArrowForward />;
                },
            },
            {
                headerName: 'E',
                width: 60,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    const goal: ICharacterAscendGoal = getAscensionGoal(goalData.goalId)!;
                    return <RarityIcon rarity={goal.rarityEnd} />;
                },
            },
            {
                headerName: 'F',
                width: 60,
                cellStyle: { align: 'center' },
                cellRenderer: (params: any) => {
                    if (!params.data.goalData || !params.data.goalData[0]) return '';
                    const goalData = params.data.goalData[0];
                    const goal: ICharacterAscendGoal = getAscensionGoal(goalData.goalId)!;
                    return <StarsIcon stars={goal.starsEnd} />;
                },
            },
        ];
    }

    // Note: this was previously a useState, but since the column defs are
    // static `setGoalDefs` is never called. I switched it to useMemo to keep
    // it more similar but it's probably best left as a simple constant where
    // React compiler handles the optimization.
    const goalDefs = useMemo(() => getColumnDefs(), []);

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
