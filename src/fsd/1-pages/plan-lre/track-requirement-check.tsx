import React from 'react';

import { ILegendaryEventTrackRequirement, IRequirementProgress, RequirementStatus } from '@/fsd/3-features/lre';

import { StatusCheckbox } from './status-checkbox';

interface Props {
    checked: boolean;
    restriction: ILegendaryEventTrackRequirement;
    onCheckboxChange: (selected: boolean) => void;
    onStatusChange?: (progress: IRequirementProgress) => void;
    progress: string;
    requirementProgress?: IRequirementProgress;
    isKillScore?: boolean;
}

export const TrackRequirementCheck: React.FC<Props> = ({
    restriction,
    checked,
    progress,
    onCheckboxChange,
    onStatusChange,
    requirementProgress,
    isKillScore,
}) => {
    // If new status system is being used
    if (onStatusChange && requirementProgress) {
        return (
            <StatusCheckbox
                restriction={restriction}
                progress={requirementProgress}
                onChange={onStatusChange}
                displayProgress={progress}
                isKillScore={isKillScore}
            />
        );
    }

    // Legacy fallback - convert boolean to status
    const legacyProgress: IRequirementProgress = {
        status: checked ? RequirementStatus.Cleared : RequirementStatus.NotCleared,
    };

    return (
        <StatusCheckbox
            restriction={restriction}
            progress={legacyProgress}
            onChange={newProgress => {
                // Convert status back to boolean for legacy mode
                onCheckboxChange(newProgress.status === RequirementStatus.Cleared);
            }}
            displayProgress={progress}
            isKillScore={isKillScore}
        />
    );
};
