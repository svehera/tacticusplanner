import React, { useEffect, useMemo, useRef, useState } from 'react';

import { ConfirmationDialog } from '@/fsd/5-shared/ui';

import { RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { BattleStatusCheckbox } from './battle-status-checkbox';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';
import { STATUS_COLORS, STATUS_LABELS, STATUS_LABEL_TEXT } from './requirement-status-constants';

interface Props {
    battle: ILreBattleProgress;
    maxKillPoints: number;
    projectedRestrictions: Set<string>;
    setState: (
        requirement: ILreBattleRequirementsProgress,
        status: RequirementStatus,
        forceOverwrite?: boolean
    ) => void;
}

// Convert legacy boolean flags to RequirementStatus
const getRequirementStatus = (requirement: ILreBattleRequirementsProgress): RequirementStatus => {
    // If new status field exists, use it
    if (requirement.status !== undefined) {
        return requirement.status as RequirementStatus;
    }

    // Legacy conversion
    if (requirement.completed) {
        return RequirementStatus.Cleared;
    }
    if (requirement.blocked) {
        return RequirementStatus.StopHere;
    }
    return RequirementStatus.NotCleared;
};

// Cycle through statuses for non-killScore requirements
// NotCleared (0) → Cleared (1) → MaybeClear (2) → StopHere (3) → NotCleared (0)
const getNextStatus = (currentStatus: RequirementStatus): RequirementStatus => {
    switch (currentStatus) {
        case RequirementStatus.NotCleared: {
            return RequirementStatus.Cleared;
        }
        case RequirementStatus.Cleared: {
            return RequirementStatus.MaybeClear;
        }
        case RequirementStatus.MaybeClear: {
            return RequirementStatus.StopHere;
        }
        case RequirementStatus.StopHere: {
            return RequirementStatus.NotCleared;
        }
        default: {
            return RequirementStatus.NotCleared;
        }
    }
};

export const LreTrackBattleSummary: React.FC<Props> = ({ battle, maxKillPoints, projectedRestrictions, setState }) => {
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState<string | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const longPressTriggered = useRef<boolean>(false);
    const resetTriggerTimer = useRef<NodeJS.Timeout | null>(null);
    const buttonReferences = useRef<Map<string, HTMLButtonElement>>(new Map());

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
                const button = buttonReferences.current.get(showDropdown);
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
    const handlePressStart = (requirement: ILreBattleRequirementsProgress) => {
        longPressTriggered.current = false;
        longPressTimer.current = setTimeout(() => {
            longPressTriggered.current = true;
            // Calculate dropdown position
            const button = buttonReferences.current.get(requirement.id);
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
                setShowDropdown(requirement.id);
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

    const handleDirectStatusChange = (requirement: ILreBattleRequirementsProgress, newStatus: RequirementStatus) => {
        setShowDropdown(null);
        handleStatusChange(requirement, newStatus);
    };

    // Handle cycling button click for non-killScore requirements
    const handleCycleStatus = (requirement: ILreBattleRequirementsProgress) => {
        const currentStatus = getRequirementStatus(requirement);
        const nextStatus = getNextStatus(currentStatus);
        handleStatusChange(requirement, nextStatus);
    };

    // Convert RequirementStatus back to ProgressState for toggleState
    const handleStatusChange = (
        requirement: ILreBattleRequirementsProgress,
        status: RequirementStatus,
        score?: number,
        forceOverwrite?: boolean
    ) => {
        // Update the requirement with new status
        requirement.status = status;

        // Set the appropriate score field based on requirement type
        if (requirement.id === LrePointsCategoryId.killScore) {
            requirement.killScore = score;
        } else if (requirement.id === LrePointsCategoryId.highScore) {
            requirement.highScore = score;
        }

        // Also update legacy fields for backward compatibility
        requirement.completed = status === RequirementStatus.Cleared;
        requirement.blocked = status === RequirementStatus.StopHere;

        setState(requirement, status, forceOverwrite);
    };

    const allCompleted = useMemo((): boolean => {
        return battle.requirementsProgress.every(requirement => requirement.completed);
    }, [battle]);

    const handleToggle = () => {
        if (
            battle.requirementsProgress.some(
                requirement =>
                    requirement.status === RequirementStatus.MaybeClear ||
                    requirement.status === RequirementStatus.StopHere
            )
        ) {
            handleOpenConfirmDialog();
        } else {
            handleToggleAll();
        }
    };

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
            handleToggle();
        }
    };

    const handleToggleAll = () => {
        for (const requirement of battle.requirementsProgress) {
            // Use handleStatusChange to properly set status and clear killScore
            const newStatus = allCompleted ? RequirementStatus.NotCleared : RequirementStatus.Cleared;
            handleStatusChange(requirement, newStatus, undefined, true); // Force overwrite when toggling
        }
    };

    return (
        <>
            <div className="flex w-full flex-row">
                <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Toggle all requirements for battle ${battle.battleIndex + 1}`}
                    className="my-0.5 mr-1 size-6 min-w-6 shrink-0 cursor-pointer rounded-xs border-2 border-blue-300/75 p-0.5 text-center text-xs font-bold md:mr-2 md:size-8 md:min-w-8 md:p-0.5 md:text-base"
                    onClick={handleToggle}
                    onKeyDown={handleBattleNumberKeyDown}>
                    {battle.battleIndex + 1}
                </span>
                <div className="flex flex-1 flex-row justify-between">
                    {(() => {
                        const firstRestrictionIndex = LreRequirementStatusService.getFirstRestrictionIndex(
                            battle.requirementsProgress
                        );
                        return battle.requirementsProgress.map((requirement, index) => {
                            const isKillScore = requirement.id === LrePointsCategoryId.killScore;
                            const isHighScore = requirement.id === LrePointsCategoryId.highScore;
                            const isFirstRestriction = index === firstRestrictionIndex;

                            const status = getRequirementStatus(requirement);

                            // Use BattleStatusCheckbox with dropdown for score requirements (killScore or highScore)
                            const isScoreRequirement = isKillScore || isHighScore;
                            if (isScoreRequirement) {
                                return (
                                    <BattleStatusCheckbox
                                        key={requirement.id}
                                        status={status}
                                        score={isKillScore ? requirement.killScore : requirement.highScore}
                                        scoreType={isKillScore ? 'killScore' : 'highScore'}
                                        maxScore={maxKillPoints}
                                        onChange={(newStatus, newScore) =>
                                            handleStatusChange(requirement, newStatus, newScore)
                                        }
                                    />
                                );
                            }

                            // Use simple cycling button for other requirements
                            const isProjected = projectedRestrictions.has(requirement.id);
                            const isNotSet = status === RequirementStatus.NotCleared;
                            const shouldShowGreenBorder = isProjected && isNotSet;

                            return (
                                <div
                                    key={requirement.id}
                                    className={`relative inline-block ${isFirstRestriction ? 'ml-4' : ''}`}>
                                    <button
                                        ref={element => {
                                            if (element) {
                                                buttonReferences.current.set(requirement.id, element);
                                            } else {
                                                buttonReferences.current.delete(requirement.id);
                                            }
                                        }}
                                        onClick={() => {
                                            // Don't cycle if dropdown is showing or long press was just triggered
                                            if (showDropdown !== requirement.id && !longPressTriggered.current) {
                                                handleCycleStatus(requirement);
                                            }
                                        }}
                                        onContextMenu={event => event.preventDefault()}
                                        onMouseDown={() => handlePressStart(requirement)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={() => handlePressStart(requirement)}
                                        onTouchEnd={handlePressEnd}
                                        aria-label={`${requirement.id} - ${STATUS_LABEL_TEXT[status] || 'Unknown'}`}
                                        aria-pressed={status === RequirementStatus.Cleared}
                                        aria-haspopup="menu"
                                        aria-expanded={showDropdown === requirement.id}
                                        aria-controls={`dropdown-${requirement.id}`}
                                        className="size-8 rounded border-2 p-1 text-center text-sm font-bold select-none md:size-10 md:p-1.5 md:text-base"
                                        style={{
                                            color: shouldShowGreenBorder
                                                ? `${STATUS_COLORS[RequirementStatus.Cleared]}60`
                                                : STATUS_COLORS[status],
                                            borderColor: `${STATUS_COLORS[status]}20`,
                                        }}>
                                        {STATUS_LABELS[status]}
                                    </button>

                                    {showDropdown === requirement.id && (
                                        <div
                                            id={`dropdown-${requirement.id}`}
                                            role="menu"
                                            className="absolute z-50 rounded border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
                                            style={
                                                dropdownPosition === 'top'
                                                    ? { bottom: '100%', marginBottom: '4px' }
                                                    : { top: '100%', marginTop: '4px' }
                                            }
                                            onClick={event => event.stopPropagation()}
                                            onMouseDown={event => event.stopPropagation()}
                                            onMouseUp={event => event.stopPropagation()}
                                            onTouchStart={event => event.stopPropagation()}
                                            onTouchEnd={event => event.stopPropagation()}>
                                            {[
                                                RequirementStatus.NotCleared,
                                                RequirementStatus.Cleared,
                                                RequirementStatus.MaybeClear,
                                                RequirementStatus.StopHere,
                                            ].map(statusOption => (
                                                <button
                                                    key={statusOption}
                                                    role="menuitem"
                                                    onClick={event => {
                                                        event.stopPropagation();
                                                        handleDirectStatusChange(requirement, statusOption);
                                                    }}
                                                    className="flex w-full items-center justify-center px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        });
                    })()}
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
