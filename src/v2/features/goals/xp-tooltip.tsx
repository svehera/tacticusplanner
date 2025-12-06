import { Info } from '@mui/icons-material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IXpEstimate } from 'src/v2/features/characters/characters.models';

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
