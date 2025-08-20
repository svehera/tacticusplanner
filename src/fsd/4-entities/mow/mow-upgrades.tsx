import { Badge } from '@mui/material';
import React from 'react';

import { Alliance, RarityMapper } from '@/fsd/5-shared/model';
import { BadgeImage, ComponentImage, ForgeBadgeImage } from '@/fsd/5-shared/ui/icons';

import { IBaseUpgrade, ICraftedUpgrade, UpgradeImage } from '@/fsd/4-entities/upgrade/@x/mow';

import { IMowLevelMaterials } from './model';
import { MowsService } from './mows.service';

interface Props {
    mowId: string;
    alliance: Alliance;
    primaryLevel: number;
    secondaryLevel: number;
}

export const MowUpgrades: React.FC<Props> = ({ primaryLevel, secondaryLevel, mowId, alliance }) => {
    const size = 'medium';
    const name = MowsService.resolveToStatic(mowId)!.name;
    const [primary] = MowsService.getMaterialsList(mowId, name, alliance, [primaryLevel + 1]);
    const [secondary] = MowsService.getMaterialsList(mowId, name, alliance, [secondaryLevel + 1]);

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
                                rarity={RarityMapper.rarityToRarityString(x.rarity)}
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
