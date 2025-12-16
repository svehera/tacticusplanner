import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IXpEstimate } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
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
