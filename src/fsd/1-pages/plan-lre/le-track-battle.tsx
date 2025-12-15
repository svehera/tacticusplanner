import React, { useMemo } from 'react';

import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId, ProgressState } from '@/fsd/3-features/lre-progress';

import { BattleStatusCheckbox } from './battle-status-checkbox';
import { ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';

interface Props {
    battle: ILreBattleProgress;
    trackId: LreTrackId;
    legendaryEventId: LegendaryEventEnum;
    maxKillPoints: number;
    toggleState: (req: ILreBattleRequirementsProgress, state: ProgressState, forceOverwrite?: boolean) => void;
}

export const LreTrackBattleSummary: React.FC<Props> = ({
    battle,
    //trackId,
    //legendaryEventId,
    maxKillPoints,
    toggleState,
}) => {
    //const { leSelectedTeams } = useContext(StoreContext);
    //const selectedTeams: ILreTeam[] = leSelectedTeams[legendaryEventId]?.teams ?? [];

    // Convert legacy boolean flags to RequirementStatus
    const getRequirementStatus = (req: ILreBattleRequirementsProgress): RequirementStatus => {
        // If new status field exists, use it
        if (req.status !== undefined) {
            return req.status as RequirementStatus;
        }

        // Legacy conversion
        if (req.completed) {
            return RequirementStatus.Cleared;
        }
        if (req.blocked) {
            return RequirementStatus.StopHere;
        }
        return RequirementStatus.NotCleared;
    };

    // Convert RequirementStatus back to ProgressState for toggleState
    const handleStatusChange = (
        req: ILreBattleRequirementsProgress,
        status: RequirementStatus,
        killScore?: number,
        forceOverwrite?: boolean
    ) => {
        // Update the requirement with new status
        req.status = status;
        req.killScore = killScore;

        // Also update legacy fields for backward compatibility
        req.completed = status === RequirementStatus.Cleared;
        req.blocked = status === RequirementStatus.StopHere;

        // Convert to ProgressState for the toggle function
        let progressState: ProgressState;
        if (status === RequirementStatus.Cleared) {
            progressState = ProgressState.completed;
        } else if (status === RequirementStatus.StopHere) {
            progressState = ProgressState.blocked;
        } else {
            progressState = ProgressState.none;
        }

        toggleState(req, progressState, forceOverwrite);
    };

    const allCompleted = useMemo((): boolean => {
        return battle.requirementsProgress.every(req => req.completed);
    }, [battle]);

    const handleToggleAll = () => {
        battle.requirementsProgress.forEach(req => {
            // Use handleStatusChange to properly set status and clear killScore
            const newStatus = allCompleted ? RequirementStatus.NotCleared : RequirementStatus.Cleared;
            handleStatusChange(req, newStatus, undefined, true); // Force overwrite when toggling
        });
    };

    /*     const estimatedTokens = () => {
        const numTokens = TokenEstimationService.computeMinimumTokensToClearBattle(
            selectedTeams
                .filter(team => team.section === trackId)
                .filter(team => (team.expectedBattleClears ?? 1) >= battle.battleIndex + 1)
        );
        return (
            <span className="bold me-2.5 min-w-[42px]">
                <center>{numTokens === undefined ? '-' : numTokens}</center>
            </span>
        );
    }; */

    return (
        <div className="flex flex-row w-full">
            <span
                className="min-w-6 md:min-w-8 p-0.5 md:p-0.5 my-0.5 mr-1 md:mr-2 text-xs md:text-base font-bold text-center border-2 border-blue-300/75 size-6 md:size-8 rounded-xs flex-shrink-0"
                onClick={handleToggleAll}>
                {battle.battleIndex + 1}
            </span>
            <div className="flex flex-row justify-between flex-1">
                {battle.requirementsProgress.map(req => {
                    const isKillScore = req.id === LrePointsCategoryId.killScore;
                    const status = getRequirementStatus(req);

                    return (
                        <BattleStatusCheckbox
                            key={req.id}
                            status={status}
                            killScore={req.killScore}
                            isKillScore={isKillScore}
                            maxKillPoints={maxKillPoints}
                            onChange={(newStatus, newKillScore) => handleStatusChange(req, newStatus, newKillScore)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
