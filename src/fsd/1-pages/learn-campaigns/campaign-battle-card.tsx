import React, { useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICampaignBattleComposed } from '@/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { NpcDetailModal } from '@/fsd/4-entities/npc';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CampaignBattleEnemies } from './campaign-battle-enemies';
import { getBattleReward, ResolvedEnemyData } from './models';

interface Props {
    battle: ICampaignBattleComposed;
}

export const CampaignBattleCard: React.FC<Props> = ({ battle }) => {
    const [selectedEnemy, setSelectedEnemy] = useState<ResolvedEnemyData>();

    const reward = useMemo(() => getBattleReward(battle.rewards), [battle.rewards]);

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
            <div className="flex w-full flex-col gap-3 rounded-xl border border-(--card-border) bg-(--card) p-4">
                <div className="flex items-center justify-between border-b border-(--border) pb-3">
                    <CampaignLocation key={battle.id} location={battle} short={true} unlocked={true} />
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-sm font-medium text-(--fg)">
                            <MiscIcon icon="deployment" width={18} height={18} />
                            {battle.slots ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-(--fg)">
                            <MiscIcon icon="energy" width={18} height={18} />
                            {battle.energyCost}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center">{rewardIcon}</div>
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Enemies</h4>
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

            <NpcDetailModal
                isOpen={!!selectedEnemy}
                onClose={() => setSelectedEnemy(undefined)}
                npc={selectedEnemy?.npc}
                stats={selectedEnemy?.stats}
            />
        </>
    );
};
