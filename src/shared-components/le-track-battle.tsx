import React, { useMemo } from 'react';
import { Checkbox } from '@mui/material';
import { ILreBattleProgress, ILreBattleRequirementsProgress, ILreTrackProgress } from 'src/v2/features/lre/lre.models';

interface Props {
    battle: ILreBattleProgress;
    toggleState: (req: ILreBattleRequirementsProgress) => void;
}

export const LreTrackBattleSummary: React.FC<Props> = ({ battle, toggleState }) => {
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
                        onClick={() => toggleState(x)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                ))}
            </div>
        </div>
    );
};
