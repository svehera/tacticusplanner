import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';
import { Info } from '@mui/icons-material';
import React from 'react';
import { IXpEstimate } from 'src/v2/features/characters/characters.models';

export const XpTotal: React.FC<IXpEstimate> = ({
    legendaryBooks,
    mythicBooks,
    currentLevel,
    targetLevel,
    xpLeft,
    legendaryGold,
    mythicGold,
}) => {
    return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'left' }}>
                    <span>
                        <b>{legendaryBooks}</b> Codex of War | <b>{numberToThousandsString(legendaryGold)}</b> Gold
                    </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                    <span>
                        <b>{mythicBooks}</b> Grimoire of War | <b>{numberToThousandsString(mythicGold)}</b> Gold
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
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
        </div>
    );
};
