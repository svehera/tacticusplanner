import React, { useMemo, useState } from 'react';

import { ConfirmationDialog } from '@/fsd/5-shared/ui';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId, ProgressState } from '@/fsd/3-features/lre-progress';

import { BattleStatusCheckbox } from './battle-status-checkbox';
import { ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';
import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';

interface Props {
    battle: ILreBattleProgress;
    maxKillPoints: number;
    toggleState: (req: ILreBattleRequirementsProgress, state: ProgressState, forceOverwrite?: boolean) => void;
}

export const LreTrackBattleSummary: React.FC<Props> = ({ battle, maxKillPoints, toggleState }) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

    // Cycle through statuses for non-killScore requirements
    // NotCleared (0) → Cleared (1) → MaybeClear (2) → StopHere (3) → NotCleared (0)
    const getNextStatus = (currentStatus: RequirementStatus): RequirementStatus => {
        switch (currentStatus) {
            case RequirementStatus.NotCleared:
                return RequirementStatus.Cleared;
            case RequirementStatus.Cleared:
                return RequirementStatus.MaybeClear;
            case RequirementStatus.MaybeClear:
                return RequirementStatus.StopHere;
            case RequirementStatus.StopHere:
                return RequirementStatus.NotCleared;
            default:
                return RequirementStatus.NotCleared;
        }
    };

    // Handle cycling button click for non-killScore requirements
    const handleCycleStatus = (req: ILreBattleRequirementsProgress) => {
        const currentStatus = getRequirementStatus(req);
        const nextStatus = getNextStatus(currentStatus);
        handleStatusChange(req, nextStatus);
    };

    // Convert RequirementStatus back to ProgressState for toggleState
    const handleStatusChange = (
        req: ILreBattleRequirementsProgress,
        status: RequirementStatus,
        score?: number,
        forceOverwrite?: boolean
    ) => {
        // Update the requirement with new status
        req.status = status;

        // Set the appropriate score field based on requirement type
        if (req.id === LrePointsCategoryId.killScore) {
            req.killScore = score;
        } else if (req.id === LrePointsCategoryId.highScore) {
            req.highScore = score;
        }

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

    const handleOpenConfirmDialog = () => {
        setConfirmDialogOpen(true);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };

    const handleConfirmToggleAll = () => {
        setConfirmDialogOpen(false);
        handleToggleAll();
    };

    const handleBattleNumberKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            handleOpenConfirmDialog();
        }
    };

    const handleToggleAll = () => {
        battle.requirementsProgress.forEach(req => {
            // Use handleStatusChange to properly set status and clear killScore
            const newStatus = allCompleted ? RequirementStatus.NotCleared : RequirementStatus.Cleared;
            handleStatusChange(req, newStatus, undefined, true); // Force overwrite when toggling
        });
    };

    return (
        <>
            <div className="flex flex-row w-full">
                <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle all requirements for battle ${battle.battleIndex + 1}`}
                    className="cursor-pointer min-w-6 md:min-w-8 p-0.5 md:p-0.5 my-0.5 mr-1 md:mr-2 text-xs md:text-base font-bold text-center border-2 border-blue-300/75 size-6 md:size-8 rounded-xs shrink-0"
                    onClick={handleOpenConfirmDialog}
                    onKeyDown={handleBattleNumberKeyDown}>
                    {battle.battleIndex + 1}
                </span>
                <div className="flex flex-row justify-between flex-1">
                    {battle.requirementsProgress.map(req => {
                        const isKillScore = req.id === LrePointsCategoryId.killScore;
                        const isHighScore = req.id === LrePointsCategoryId.highScore;
                        const status = getRequirementStatus(req);

                        // Use BattleStatusCheckbox with dropdown for score requirements (killScore or highScore)
                        const isScoreRequirement = isKillScore || isHighScore;
                        if (isScoreRequirement) {
                            return (
                                <BattleStatusCheckbox
                                    key={req.id}
                                    status={status}
                                    score={isKillScore ? req.killScore : req.highScore}
                                    scoreType={isKillScore ? 'killScore' : 'highScore'}
                                    maxScore={maxKillPoints}
                                    onChange={(newStatus, newScore) => handleStatusChange(req, newStatus, newScore)}
                                />
                            );
                        }

                        // Use simple cycling button for other requirements
                        return (
                            <button
                                key={req.id}
                                onClick={() => handleCycleStatus(req)}
                                className="p-1 md:p-1.5 text-sm md:text-base font-bold text-center size-8 md:size-10 border-2 rounded"
                                style={{
                                    color: STATUS_COLORS[status],
                                    borderColor: `${STATUS_COLORS[status]}20`,
                                }}>
                                {STATUS_LABELS[status]}
                            </button>
                        );
                    })}
                </div>
            </div>

            <ConfirmationDialog
                open={confirmDialogOpen}
                title="Confirm Action"
                message="Are you sure you want to toggle all selections for this battle?"
                onConfirm={handleConfirmToggleAll}
                onCancel={handleCloseConfirmDialog}
            />
        </>
    );
};
