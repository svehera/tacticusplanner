import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmationDialog } from '@/fsd/5-shared/ui';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId, ProgressState } from '@/fsd/3-features/lre-progress';

import { BattleStatusCheckbox } from './battle-status-checkbox';
import { ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';
import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';

interface Props {
    battle: ILreBattleProgress;
    maxKillPoints: number;
    projectedRestrictions: Set<string>;
    toggleState: (req: ILreBattleRequirementsProgress, state: ProgressState, forceOverwrite?: boolean) => void;
}

export const LreTrackBattleSummary: React.FC<Props> = ({
    battle,
    maxKillPoints,
    projectedRestrictions,
    toggleState,
}) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef<boolean>(false);
    const resetTriggerTimer = useRef<NodeJS.Timeout | null>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
            if (resetTriggerTimer.current) {
                clearTimeout(resetTriggerTimer.current);
            }
        };
    }, []);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: Event) => {
            if (showDropdown) {
                const button = buttonRefs.current.get(showDropdown);
                const target = event.target as Node;
                if (button && target && !button.contains(target)) {
                    setShowDropdown(null);
                }
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showDropdown]);

    // Long press handlers for both mouse and touch
    const handlePressStart = (req: ILreBattleRequirementsProgress) => {
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            // Calculate dropdown position
            const button = buttonRefs.current.get(req.id);
            if (button) {
                const buttonRect = button.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - buttonRect.bottom;
                const spaceAbove = buttonRect.top;
                const dropdownHeight = 200; // Estimated dropdown height

                if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                    setDropdownPosition('top');
                } else {
                    setDropdownPosition('bottom');
                }
                setShowDropdown(req.id);
            }
        }, 500); // 500ms for long press
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // Only reset the flag if a long press was actually triggered
        if (longPressTriggered.current) {
            // Clear any existing reset timer
            if (resetTriggerTimer.current) {
                clearTimeout(resetTriggerTimer.current);
            }
            // Reset the flag after a short delay to prevent immediate click
            resetTriggerTimer.current = setTimeout(() => {
                longPressTriggered.current = false;
                resetTriggerTimer.current = null;
            }, 100);
        }
    };

    const handleDirectStatusChange = (req: ILreBattleRequirementsProgress, newStatus: RequirementStatus) => {
        setShowDropdown(null);
        handleStatusChange(req, newStatus);
    };

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
                        const isProjected = projectedRestrictions.has(req.id);
                        const isNotSet = status === RequirementStatus.NotCleared;
                        const shouldShowGreenBorder = isProjected && isNotSet;

                        return (
                            <div key={req.id} className="relative inline-block">
                                <button
                                    ref={el => {
                                        if (el) {
                                            buttonRefs.current.set(req.id, el);
                                        }
                                    }}
                                    onClick={() => {
                                        // Don't cycle if dropdown is showing or long press was just triggered
                                        if (showDropdown !== req.id && !longPressTriggered.current) {
                                            handleCycleStatus(req);
                                        }
                                    }}
                                    onContextMenu={e => e.preventDefault()}
                                    onMouseDown={() => handlePressStart(req)}
                                    onMouseUp={handlePressEnd}
                                    onMouseLeave={handlePressEnd}
                                    onTouchStart={() => handlePressStart(req)}
                                    onTouchEnd={handlePressEnd}
                                    className="select-none p-1 md:p-1.5 text-sm md:text-base font-bold text-center size-8 md:size-10 border-2 rounded"
                                    style={{
                                        color: shouldShowGreenBorder
                                            ? `${STATUS_COLORS[RequirementStatus.Cleared]}60`
                                            : STATUS_COLORS[status],
                                        borderColor: `${STATUS_COLORS[status]}20`,
                                    }}>
                                    {STATUS_LABELS[status]}
                                </button>

                                {showDropdown === req.id && (
                                    <div
                                        className="absolute z-50 bg-white border border-gray-300 rounded shadow-lg dark:bg-gray-800 dark:border-gray-600"
                                        style={
                                            dropdownPosition === 'top'
                                                ? { bottom: '100%', marginBottom: '4px' }
                                                : { top: '100%', marginTop: '4px' }
                                        }
                                        onClick={e => e.stopPropagation()}
                                        onMouseDown={e => e.stopPropagation()}
                                        onMouseUp={e => e.stopPropagation()}
                                        onTouchStart={e => e.stopPropagation()}
                                        onTouchEnd={e => e.stopPropagation()}>
                                        {[
                                            RequirementStatus.NotCleared,
                                            RequirementStatus.Cleared,
                                            RequirementStatus.MaybeClear,
                                            RequirementStatus.StopHere,
                                        ].map(statusOption => (
                                            <button
                                                key={statusOption}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleDirectStatusChange(req, statusOption);
                                                }}
                                                className="flex items-center justify-center w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                                style={{
                                                    color: STATUS_COLORS[statusOption],
                                                }}>
                                                {STATUS_LABELS[statusOption]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
