import { Badge } from '@mui/material';
import React from 'react';

import { BadgeImage } from 'src/v2/components/images/badge-image';
import { ComponentImage } from 'src/v2/components/images/component-image';
import { ForgeBadgeImage } from 'src/v2/components/images/forge-badge-image';

import { Alliance } from '@/fsd/5-shared/model';

import { IBaseUpgrade, ICraftedUpgrade } from '@/fsd/4-entities/upgrade';
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { IMowLevelMaterials } from 'src/v2/features/lookup/lookup.models';
import { MowLookupService } from 'src/v2/features/lookup/mow-lookup.service';

interface Props {
    mowId: string;
    alliance: Alliance;
    primaryLevel: number;
    secondaryLevel: number;
}

export const MowUpgrades: React.FC<Props> = ({ primaryLevel, secondaryLevel, mowId, alliance }) => {
    const size = 'medium';
    const [primary] = MowLookupService.getMaterialsList(mowId, mowId, alliance, [primaryLevel + 1]);
    const [secondary] = MowLookupService.getMaterialsList(mowId, mowId, alliance, [secondaryLevel + 1]);

    const renderAbility = (
        label: string,
        materials: IMowLevelMaterials,
        upgrades: Array<IBaseUpgrade | ICraftedUpgrade>
    ) => {
        return (
            <div className="flex flex-col gap-3">
                <span>{label}</span>
                <div className="flex gap-3">
                    <div style={{ width: 40, height: 40 }}>
                        <Badge badgeContent={<b>{materials.badges}</b>}>
                            <BadgeImage alliance={alliance} rarity={materials.rarity} size={size} />
                        </Badge>
                    </div>

                    <div style={{ width: 40, height: 40 }}>
                        <Badge badgeContent={<b>{materials.components}</b>}>
                            <ComponentImage alliance={alliance} size={size} />
                        </Badge>
                    </div>

                    {materials.forgeBadges ? (
                        <div style={{ width: 40, height: 40 }}>
                            <Badge badgeContent={<b>{materials.forgeBadges}</b>}>
                                <ForgeBadgeImage rarity={materials.rarity} size={size} />
                            </Badge>
                        </div>
                    ) : (
                        <div style={{ width: 40, height: 40 }}></div>
                    )}
                </div>
                <div className="flex items-center">
                    <div className="flex gap-1">
                        {upgrades.map((x, index) => (
                            <UpgradeImage
                                key={x.id + index}
                                material={x.label}
                                iconPath={x.iconPath}
                                rarity={x.rarity}
                                size={40}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-box center gap20">
            {!!primary && renderAbility('Primary', primary, primary.primaryUpgrades)}
            {!!secondary && renderAbility('Secondary', secondary, secondary.secondaryUpgrades)}
        </div>
    );
};
