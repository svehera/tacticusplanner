import { Card, CardContent, CardHeader } from '@mui/material';
import React, { useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { ICampaignBattleComposed } from '@/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';
import { UpgradeImage, UpgradesService } from '@/fsd/4-entities/upgrade';

import { CampaignBattleEnemies } from './campaign-battle-enemies';

interface Props {
    battle: ICampaignBattleComposed;
}

export const CampaignBattleCard: React.FC<Props> = ({ battle }) => {
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
        if (!upgrade) {
            if (reward.startsWith('shards_')) {
                const char = CharactersService.getUnit(reward.substring(7));
                if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                return reward.substring(7);
            }
            if (reward.startsWith('mythicShards_')) {
                const char = CharactersService.getUnit(reward.substring(13));
                if (char) return <UnitShardIcon name={reward} icon={char.roundIcon} />;
                return reward.substring(13);
            }
            return reward;
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
        <Card
            variant="outlined"
            sx={{
                width: 350,
                minHeight: 200,
            }}>
            <CardHeader
                title={
                    <div className="flex-box gap5">
                        <div className="flex gap-x-5">
                            <CampaignLocation key={battle.id} location={battle} short={true} unlocked={true} />
                            <span className="flex-box gap-0.5">
                                <MiscIcon icon="deployment" width={24} height={24} />
                                <span>{battle.slots ?? 0}</span>
                            </span>
                            <span className="flex-box gap-0.5">
                                <MiscIcon icon="energy" width={24} height={24} />
                                <span>{battle.energyCost}</span>
                            </span>
                            <span>{rewardIcon}</span>
                        </div>
                    </div>
                }
            />
            <CardContent>
                <div className="flex-box column center gap10">
                    <div className="flex-box gap10 center">
                        <CampaignBattleEnemies
                            keyPrefix="cards"
                            battleId={battle.id}
                            enemies={battle.detailedEnemyTypes ?? []}
                            scale={0.3}
                        />
                    </div>

                    <div className="flex-box gap5 center"></div>
                </div>
            </CardContent>
        </Card>
    );
};
