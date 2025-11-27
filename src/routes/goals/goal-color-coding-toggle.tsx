import Button from '@mui/material/Button';
import React, { useCallback, useMemo } from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui/tooltip';

export type GoalColorMode = 'None' | 'Battle Pass Season' | 'Guild Raid Season';
const COLOR_MODES: GoalColorMode[] = ['None', 'Battle Pass Season', 'Guild Raid Season'];

interface ColorCodingToggleProps {
    currentMode: GoalColorMode;
    onToggle: (newMode: GoalColorMode) => void;
}

export const GoalColorCodingToggle: React.FC<ColorCodingToggleProps> = ({ currentMode, onToggle }) => {
    const getNextMode = useCallback((current: GoalColorMode): GoalColorMode => {
        const currentIndex = COLOR_MODES.indexOf(current);
        const nextIndex = (currentIndex + 1) % COLOR_MODES.length;
        return COLOR_MODES[nextIndex];
    }, []);

    const handleClick = useCallback(() => {
        const nextMode = getNextMode(currentMode);
        onToggle(nextMode);
    }, [currentMode, getNextMode, onToggle]);

    const buttonLabel = useMemo(() => {
        if (currentMode === 'None') {
            return 'Color Coding';
        }
        return `Code: ${currentMode}`;
    }, [currentMode]);

    const tooltipText = useMemo(() => {
        const nextMode = getNextMode(currentMode);
        if (currentMode === 'None') {
            return `Currently disabled. Click to enable ${nextMode}.`;
        }
        return `Currently colored by ${currentMode}. Click to switch to ${nextMode}.`;
    }, [currentMode, getNextMode]);

    return (
        <AccessibleTooltip title={tooltipText}>
            <Button onClick={handleClick} size="small" variant="contained">
                {buttonLabel}
            </Button>
        </AccessibleTooltip>
    );
};
