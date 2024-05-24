import React from 'react';
import { IMowMaterialsTotal } from 'src/v2/features/lookup/lookup.models';
import { Alliance, Rarity } from 'src/models/enums';
import { ComponentImage } from 'src/v2/components/images/component-image';
import { numberToThousandsString } from 'src/v2/functions/number-to-thousands-string';
import { Badge } from '@mui/material';
import { BadgeImage } from 'src/v2/components/images/badge-image';
import { ForgeBadgeImage } from 'src/v2/components/images/forge-badge-image';

interface Props {
    total: IMowMaterialsTotal;
    mowAlliance: Alliance;
    label: string;
}

export const MowMaterialsTotal: React.FC<Props> = ({ total, mowAlliance, label }) => {
    return (
        <div className="flex-box gap5 wrap">
            <b>{label}</b>
            <div className="flex-box gap20 wrap">
                <div className="flex-box gap5">
                    {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(rarity => {
                        const badgesCount = total.badges[rarity];
                        return (
                            badgesCount > 0 && (
                                <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                                    <BadgeImage alliance={mowAlliance} rarity={rarity} />
                                </Badge>
                            )
                        );
                    })}
                </div>
                <div className="flex-box gap5">
                    <b>{total.components}</b>
                    <ComponentImage alliance={mowAlliance} />
                </div>
                <div className="flex-box gap5">
                    {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                        const forgeBadgesCount = total.forgeBadges[rarity];
                        return (
                            forgeBadgesCount > 0 && (
                                <Badge key={rarity} badgeContent={<b>{forgeBadgesCount}</b>}>
                                    <ForgeBadgeImage rarity={rarity} />
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
