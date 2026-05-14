import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

interface Props {
    material: string;
    size?: number;
}

/** Renders the icon for a campaign material — either an upgrade item or a character shard. */
export const MaterialIcon: React.FC<Props> = ({ material, size = 30 }) => {
    // shards_<unitId> / mythicShards_<unitId> keys are not in recipeDataByName — handle directly.
    if (material.startsWith('shards_') || material.startsWith('mythicShards_')) {
        const unitId = material.startsWith('shards_')
            ? material.slice('shards_'.length)
            : material.slice('mythicShards_'.length);
        const char = CharactersService.getUnit(unitId);
        if (char) {
            return (
                <UnitShardIcon
                    name={unitId}
                    icon={char.roundIcon}
                    height={size}
                    width={size}
                    tooltip={`${char.name} shards`}
                />
            );
        }
    }

    const upgrade = UpgradesService.getUpgradeMaterial(material);
    if (upgrade?.stat === 'Shard') {
        const char = CharactersService.getUnit(upgrade.material);
        if (char) {
            return (
                <UnitShardIcon
                    name={upgrade.material}
                    icon={char.roundIcon}
                    height={size}
                    width={size}
                    tooltip={`${upgrade.material} shards`}
                />
            );
        }
    } else if (upgrade) {
        return (
            <UpgradeImage
                material={material}
                iconPath={upgrade.icon ?? ''}
                rarity={RarityMapper.stringToRarityString(upgrade.rarity)}
                size={size}
            />
        );
    }

    return;
};
