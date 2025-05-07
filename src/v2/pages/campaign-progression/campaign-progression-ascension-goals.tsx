import { ArrowForward } from '@mui/icons-material';
import { ColDef, AllCommunityModule, ModuleRegistry, provideGlobalGridOptions, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services/static-data.service';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { StarsImage } from 'src/v2/components/images/stars-image';

import { CharacterShardIcon } from '@/fsd/4-entities/character';

import { CampaignData } from 'src/v2/features/campaign-progression/campaign-progression.models';
import { ICharacterUnlockGoal, ICharacterAscendGoal } from 'src/v2/features/goals/goals.models';

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
    function getGoalUnit(goalId: string): IUnitData | undefined {
        if (!getGoal(goalId)) return undefined;
        return StaticDataService.getUnit(getGoal(goalId)!.unitId) ?? undefined;
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
                        <CharacterShardIcon
                            icon={getGoalUnit(goalData.goalId)?.icon ?? '(undefined)'}
                            height={30}
                            tooltip={getGoalUnit(goalData.goalId)?.icon}
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
                    return <RarityImage rarity={goal.rarityStart} />;
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
                    return <StarsImage stars={goal.starsStart} />;
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
                    return <RarityImage rarity={goal.rarityEnd} />;
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
                    return <StarsImage stars={goal.starsEnd} />;
                },
            },
        ];
    }

    const [goalDefs, setGoalDefs] = useState(getColumnDefs());

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
