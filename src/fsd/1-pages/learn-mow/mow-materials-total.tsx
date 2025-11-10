import { Badge } from '@mui/material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib';
import { Rarity, Alliance } from '@/fsd/5-shared/model';
import { BadgeImage, ComponentImage, ForgeBadgeImage } from '@/fsd/5-shared/ui/icons';

import { IMowMaterialsTotal } from './lookup.models';

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
                    {[Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common].map(
                        rarity => {
                            const badgesCount = total.badges[rarity] ?? 0;
                            return (
                                badgesCount > 0 && (
                                    <Badge key={rarity} badgeContent={<b>{badgesCount}</b>}>
                                        <BadgeImage alliance={mowAlliance} rarity={rarity} size={size} />
                                    </Badge>
                                )
                            );
                        }
                    )}
                </div>
                <div className="flex-box gap5">
                    <b>{total.components}</b>
                    <ComponentImage alliance={mowAlliance} size={size} />
                </div>
                <div className="flex-box gap5">
                    {[Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                        const forgeBadgesCount = total.forgeBadges.get(rarity) ?? 0;
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
