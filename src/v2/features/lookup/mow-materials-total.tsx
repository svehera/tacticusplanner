import { Badge } from '@mui/material';
import React from 'react';

import { Alliance, Rarity } from 'src/models/enums';
import { BadgeImage } from 'src/v2/components/images/badge-image';
import { ComponentImage } from 'src/v2/components/images/component-image';
import { ForgeBadgeImage } from 'src/v2/components/images/forge-badge-image';
import { IMowMaterialsTotal } from 'src/v2/features/lookup/lookup.models';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';

interface Props {
    total: IMowMaterialsTotal;
    mowAlliance: Alliance;
    label?: string;
    size?: 'small' | 'medium';
}

export const MowMaterialsTotal: React.FC<Props> = ({ total, mowAlliance, label, size = 'medium' }) => {
    return (
        <div className="flex-box gap5 wrap">
            {label && <b>{label}</b>}
            <div className="flex-box gap20 wrap">
                <div className="flex-box gap5">
                    {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(rarity => {
                        const badgesCount = total.badges[rarity];
                        return (
                            badgesCount > 0 && (
                                <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                                    <BadgeImage alliance={mowAlliance} rarity={rarity} size={size} />
                                </Badge>
                            )
                        );
                    })}
                </div>
                <div className="flex-box gap5">
                    <b>{total.components}</b>
                    <ComponentImage alliance={mowAlliance} size={size} />
                </div>
                <div className="flex-box gap5">
                    {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                        const forgeBadgesCount = total.forgeBadges[rarity];
                        return (
                            forgeBadgesCount > 0 && (
                                <Badge key={rarity} badgeContent={<b>{forgeBadgesCount}</b>}>
                                    <ForgeBadgeImage rarity={rarity} size={size} />
                                </Badge>
                            )
                        );
                    })}
                </div>
                <div className="flex-box gap5">
                    <b>{numberToThousandsString(total.gold)}</b>
                    <span>Gold</span>
                </div>
            </div>
        </div>
    );
};
