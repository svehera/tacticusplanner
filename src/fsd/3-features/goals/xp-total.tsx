import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';

import { IXpEstimate } from '@/fsd/3-features/characters/characters.models';
import { XpTooltip } from '@/fsd/3-features/goals/xp-tooltip';

export const XpTotal: React.FC<IXpEstimate> = ({ legendaryBooks, gold, currentLevel, targetLevel, xpLeft }) => {
    return (
        <div className="flex-box gap5">
            <span>
                <b>{legendaryBooks}</b> Codex of War |
            </span>
            <span>
                <b>{numberToThousandsString(gold)}</b> Gold
            </span>
            <XpTooltip
                legendaryBooks={legendaryBooks}
                gold={gold}
                currentLevel={currentLevel}
                targetLevel={targetLevel}
                xpLeft={xpLeft}
            />
        </div>
    );
};
