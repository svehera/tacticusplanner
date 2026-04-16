import React from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignBattleEnemies, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { recipeDataByName, UpgradeImage } from '@/fsd/4-entities/upgrade';

interface Props {
    location: ICampaignBattleComposed;
}

const getRewardId = (location: ICampaignBattleComposed): string => {
    for (const r of location.rewards.guaranteed) {
        if (r.id !== 'gold') return r.id;
    }
    for (const r of location.rewards.potential) {
        if (r.id !== 'gold') return r.id;
    }
    return '';
};

export const LocationDetails: React.FC<Props> = ({ location }) => {
    const rewardId = getRewardId(location);
    const rewardMaterial = recipeDataByName[rewardId];
    const rewardName = rewardMaterial?.label ?? rewardMaterial?.material ?? rewardId;

    return (
        <div className="pt-1 pb-1 text-[var(--card-fg)]">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-inherit">
                <span className="inline-flex items-center gap-1">
                    <MiscIcon icon="energy" width={16} height={16} />
                    {location.energyCost}
                </span>
                {location.slots != undefined && (
                    <span className="inline-flex items-center gap-1">
                        <MiscIcon icon="deployment" width={16} height={16} />
                        {location.slots}
                    </span>
                )}
                {rewardId && (
                    <span className="inline-flex items-center gap-1">
                        Reward:
                        {rewardMaterial ? (
                            <UpgradeImage
                                material={rewardMaterial.label ?? rewardName}
                                iconPath={rewardMaterial.icon ?? ''}
                                rarity={RarityMapper.stringToRarityString(rewardMaterial.rarity ?? '')}
                                size={24}
                                tooltip={rewardName || '-'}
                            />
                        ) : (
                            <span className="text-inherit">{rewardName || '-'}</span>
                        )}
                    </span>
                )}
            </div>

            {(location.rawEnemyTypes ?? []).length > 0 && (
                <div>
                    <div className="mb-1 text-xs font-semibold text-[var(--muted-fg)] uppercase">Enemies</div>
                    <div className="flex justify-center">
                        <CampaignBattleEnemies
                            keyPrefix="expandable"
                            battleId={location.id}
                            enemies={location.rawEnemyTypes ?? []}
                            scale={0.22}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
