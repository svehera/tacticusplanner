import { Info } from '@mui/icons-material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IXpEstimate } from 'src/v2/features/characters/characters.models';

export const XpTotal: React.FC<IXpEstimate> = ({ legendaryBooks, currentLevel, targetLevel, xpLeft, gold }) => {
    return (
        <div className="flex-box gap5">
            <span>
                <b>{legendaryBooks}</b> Codex of War |
            </span>
            <span>
                <b>{numberToThousandsString(gold)}</b> Gold
            </span>
            <AccessibleTooltip
                title={
                    <span>
                        Current level: {currentLevel}
                        <br />
                        Target level: {targetLevel}
                        <br />
                        XP left: {numberToThousandsString(xpLeft)}
                    </span>
                }>
                <Info color="primary" />
            </AccessibleTooltip>
        </div>
    );
};
