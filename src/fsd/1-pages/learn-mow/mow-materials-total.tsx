import { Badge, Tooltip } from '@mui/material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib';
import { Rarity, Alliance } from '@/fsd/5-shared/model';
import { BadgeImage, ForgeBadgeImage, MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IMowMaterialsTotal } from '@/fsd/3-features/goals';

interface Props {
    total: IMowMaterialsTotal;
    mowAlliance: Alliance;
    label?: string;
    size?: 'small' | 'medium';
}

export const MowMaterialsTotal: React.FC<Props> = ({ total, mowAlliance, label, size = 'medium' }) => {
    const componentName = Alliance[mowAlliance].toLowerCase() + 'Component';
    return (
        <div className="flex-box gap5 wrap">
            {label && <b>{label}</b>}
            <div className="flex-box gap20 wrap">
                <div className="flex-box gap5">
                    {[Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(
                        rarity => {
                            const badgesCount = total.badges[rarity] ?? 0;
                            return (
                                badgesCount > 0 && (
                                    <Tooltip key={rarity} title={`${Rarity[rarity]} ${Alliance[mowAlliance]} Badges`}>
                                        <Badge badgeContent={<b>{badgesCount}</b>}>
                                            <BadgeImage alliance={mowAlliance} rarity={rarity} size={size} />
                                        </Badge>
                                    </Tooltip>
                                )
                            );
                        }
                    )}
                </div>

                <div className="flex-box gap5">
                    <Tooltip title={`${Alliance[mowAlliance]} Components`}>
                        <Badge badgeContent={<b>{total.components}</b>}>
                            <MiscIcon icon={componentName} width={25} height={25} />
                        </Badge>
                    </Tooltip>
                </div>
                <div className="flex-box gap5">
                    {[Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                        const forgeBadgesCount = total.forgeBadges[rarity] ?? 0;
                        return (
                            forgeBadgesCount > 0 && (
                                <Tooltip key={rarity} title={`${Rarity[rarity]} Forge Badges`}>
                                    <Badge badgeContent={<b>{forgeBadgesCount}</b>}>
                                        <ForgeBadgeImage rarity={rarity} size={size} />
                                    </Badge>
                                </Tooltip>
                            )
                        );
                    })}
                </div>
                <div className="flex-box gap5">
                    <Tooltip title="Gold">
                        <span>
                            <MiscIcon icon={'coin'} width={25} height={25} />
                        </span>
                    </Tooltip>
                    <b>{numberToThousandsString(total.gold)}</b>
                </div>
            </div>
        </div>
    );
};
