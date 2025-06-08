import { Button, Checkbox } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { ProgressState } from '@/fsd/3-features/lre-progress';

import { ILreBattleProgress, ILreBattleRequirementsProgress } from './lre.models';

interface Props {
    battle: ILreBattleProgress;
    toggleState: (req: ILreBattleRequirementsProgress, state: ProgressState) => void;
}

export const LreTrackBattleSummary: React.FC<Props> = ({ battle, toggleState }) => {
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const longPressDelay = 500; // Delay in ms to trigger long press

    const handleClick = (event: React.MouseEvent, req: ILreBattleRequirementsProgress) => {
        if (isMobile) {
            return;
        }

        if (event.ctrlKey) {
            if (req.blocked) {
                toggleState(req, ProgressState.none);
            } else {
                toggleState(req, ProgressState.blocked);
            }
        } else {
            if (req.completed) {
                toggleState(req, ProgressState.none);
            } else {
                toggleState(req, ProgressState.completed);
            }
        }
    };

    const handleTouchStart = (event: React.TouchEvent, req: ILreBattleRequirementsProgress) => {
        if (isMobile) {
            const timer = setTimeout(() => {
                toggleState(req, ProgressState.blocked); // Trigger block state on long press
                setLongPressTimer(null);
            }, longPressDelay);
            setLongPressTimer(timer);
        }
    };

    const handleTouchEnd = (event: React.TouchEvent, req: ILreBattleRequirementsProgress) => {
        event.preventDefault();
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
            // Trigger regular state toggle if long press didn't complete
            if (req.completed) {
                toggleState(req, ProgressState.none);
            } else {
                toggleState(req, ProgressState.completed);
            }
        }
    };

    const allCompleted = useMemo((): boolean => {
        return battle.requirementsProgress.every(req => req.completed);
    }, [battle]);

    const handleToggleAll = () => {
        console.log('handleToggleAll called');
        battle.requirementsProgress.forEach(req => {
            toggleState(req, allCompleted ? ProgressState.none : ProgressState.completed);
        });
    };

    return (
        <div className="flex-box">
            <span className="bold" style={{ marginInlineEnd: 10, minWidth: 18 }}>
                {battle.battleIndex + 1}
            </span>
            <div className="flex-box gap1">
                {battle.requirementsProgress.map(x => (
                    <Checkbox
                        key={x.id + x.completed}
                        color={x.completed ? 'success' : 'warning'}
                        checked={x.completed}
                        indeterminate={x.blocked}
                        onClick={event => handleClick(event, x)}
                        onTouchStart={event => handleTouchStart(event, x)}
                        onTouchEnd={event => handleTouchEnd(event, x)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                ))}
            </div>
            <Button variant="outlined" onClick={handleToggleAll}>
                Toggle
            </Button>
        </div>
    );
};
