import { Info } from '@mui/icons-material';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IXpEstimate } from '@/fsd/3-features/characters/characters.models';

export const XpTooltip: React.FC<IXpEstimate> = ({ currentLevel, targetLevel, xpLeft }) => {
    return (
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
    );
};
