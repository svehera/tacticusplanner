import React, { useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICampaignBattleComposed } from '@/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

// eslint-disable-next-line boundaries/element-types
import { NpcDetailModal } from '../learn-npcs';

import { CampaignBattleEnemies } from './campaign-battle-enemies';
import { ResolvedEnemyData } from './models';

interface Props {
    battle: ICampaignBattleComposed;
}

export const CampaignBattleCard: React.FC<Props> = ({ battle }) => {
    // 1. Add State for the modal
    const [selectedEnemy, setSelectedEnemy] = useState<ResolvedEnemyData | null>(null);

    /**
     * @returns The ID of the upgrade material (or shards) rewarded when completing this battle.
     */
    const reward = useMemo((): string => {
        // Elite battles give a guaranteed material, so return that.
        for (const reward of battle.rewards.guaranteed) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        // Otherwise, return the first potential reward that is not gold.
        for (const reward of battle.rewards.potential) {
            if (reward.id === 'gold') continue;
            return reward.id;
        }
        return '';
    }, [battle.rewards]);

    const rewardIcon = useMemo(() => {
        const upgrade = UpgradesService.getUpgrade(reward);
        if (upgrade === undefined) return <span>{reward}</span>;
        if (upgrade.rarity === 'Shard' || upgrade.rarity === 'Mythic Shard') {
            const char = CharactersService.getUnit(reward.slice(Math.max(0, reward.indexOf('_') + 1)));
            if (char) {
                return <UnitShardIcon name={reward} icon={char.roundIcon} mythic={upgrade.rarity === 'Mythic Shard'} />;
            }
            return <span>{reward}</span>;
        }

        return (
            <UpgradeImage
                material={upgrade.label}
                iconPath={upgrade.iconPath}
                rarity={RarityMapper.rarityToRarityString(upgrade.rarity)}
            />
        );
    }, [reward]);

    return (
        <>
            <div className="flex w-full max-w-[400px] flex-col gap-3 rounded-md border border-gray-300 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:shadow-lg">
                <div className="flex flex-col gap-3">
                    {/* Header with battle info */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                        <CampaignLocation key={battle.id} location={battle} short={true} unlocked={true} />
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1">
                                <MiscIcon icon="deployment" width={18} height={18} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {battle.slots ?? 0}
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <MiscIcon icon="energy" width={18} height={18} />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {battle.energyCost}
                                </span>
                            </span>
                            <div className="flex h-[32px] w-[32px] items-center justify-center">{rewardIcon}</div>
                        </div>
                    </div>

                    {/* Enemies */}
                    <div>
                        <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                            Enemies
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            <CampaignBattleEnemies
                                keyPrefix="cards"
                                battleId={battle.id}
                                enemies={battle.rawEnemyTypes ?? []}
                                scale={0.3}
                                onEnemyClick={data => setSelectedEnemy(data)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={() => setSelectedEnemy(null)}
                npc={selectedEnemy?.npc || null}
                stats={selectedEnemy?.stats || null}
            />
        </>
    );
};
