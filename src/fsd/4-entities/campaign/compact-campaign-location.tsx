import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import React, { useMemo, useState } from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { recipeDataByName, UpgradeImage } from '@/fsd/4-entities/upgrade/@x/campaign';

import { CampaignBattleEnemies } from './campaign-battle-enemies';
import { CampaignImage } from './campaign.icon';
import { Campaign, campaignDisplayNames } from './enums';
import { ICampaignBattleComposed } from './model';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
}

interface CampaignBattleCardPreviewProps {
    battle: ICampaignBattleComposed;
}

const CampaignBattleCardPreview: React.FC<CampaignBattleCardPreviewProps> = ({ battle }) => {
    const reward = useMemo((): string => {
        for (const guaranteedReward of battle.rewards.guaranteed) {
            if (guaranteedReward.id === 'gold') continue;
            return guaranteedReward.id;
        }

        for (const potentialReward of battle.rewards.potential) {
            if (potentialReward.id === 'gold') continue;
            return potentialReward.id;
        }

        return '';
    }, [battle.rewards]);

    const rewardName = useMemo(() => {
        const material = recipeDataByName[reward];
        if (material?.label) return material.label;
        if (material?.material) return material.material;

        if (reward.startsWith('mythicShards_')) {
            return `Mythic Shards (${reward.slice('mythicShards_'.length)})`;
        }

        if (reward.startsWith('shards_')) {
            return `Shards (${reward.slice('shards_'.length)})`;
        }

        return reward;
    }, [reward]);

    const rewardMaterial = recipeDataByName[reward];
    const rewardRarity = RarityMapper.stringToRarityString(rewardMaterial?.rarity ?? '');

    return (
        <div className="mx-auto flex w-fit max-w-full flex-col gap-3 rounded-md border border-gray-300 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:shadow-lg">
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
                <CampaignImage campaign={battle.campaign} size={26} showTooltip={false} />
                <div className="ml-auto flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MiscIcon icon="deployment" width={18} height={18} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {battle.slots ?? 0}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <MiscIcon icon="energy" width={18} height={18} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {battle.energyCost}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reward:
                        {rewardMaterial ? (
                            <UpgradeImage
                                material={rewardMaterial.label ?? rewardName}
                                iconPath={rewardMaterial.icon ?? ''}
                                rarity={rewardRarity}
                                size={28}
                                tooltip={rewardName || '-'}
                            />
                        ) : (
                            <span>{rewardName || '-'}</span>
                        )}
                    </span>
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Enemies</h4>
                {(battle.rawEnemyTypes ?? []).length === 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400">No enemy info available.</div>
                ) : (
                    <div className="flex justify-center">
                        <CampaignBattleEnemies
                            keyPrefix="compact"
                            battleId={battle.id}
                            enemies={battle.rawEnemyTypes ?? []}
                            scale={0.22}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export const CompactCampaignLocation: React.FC<Props> = ({ location, unlocked }) => {
    const [openDetails, setOpenDetails] = useState(false);

    const locationNumber = useMemo(() => {
        if (location === undefined) return 'undefined';
        const challengeCampaigns = [
            Campaign.AMSC,
            Campaign.AMEC,
            Campaign.DGSC,
            Campaign.DGEC,
            Campaign.TSC,
            Campaign.TEC,
            Campaign.TASC,
            Campaign.TAEC,
            Campaign.ASSC,
            Campaign.ASEC,
        ];
        if (challengeCampaigns.includes(location.campaign)) {
            return location.nodeNumber + 'B';
        }
        return location.nodeNumber;
    }, []);

    const campaignShort = campaignDisplayNames[location.campaign] ?? location.campaign;
    const fullLocationName = `Battle ${locationNumber} - ${location.campaign}`;

    return location === undefined ? (
        <span>undefined</span>
    ) : (
        <>
            <Tooltip title={location.campaign} placement="top">
                <button
                    type="button"
                    onClick={() => setOpenDetails(true)}
                    className="border-muted-fg/40 inline-flex cursor-pointer items-center gap-1 rounded-full border bg-transparent px-1.5 py-0.5"
                    style={{
                        opacity: unlocked ? 1 : 0.5,
                    }}>
                    <CampaignImage campaign={location.campaign} size={18} showTooltip={false} />
                    <span className="text-secondary-fg text-[10px] leading-none">
                        {campaignShort} {locationNumber}
                    </span>
                </button>
            </Tooltip>

            <Dialog
                open={openDetails}
                onClose={() => setOpenDetails(false)}
                maxWidth="sm"
                aria-labelledby="campaign-location-dialog-title">
                <DialogTitle
                    id="campaign-location-dialog-title"
                    className="flex items-center justify-between gap-3 pr-2">
                    <span>{fullLocationName}</span>
                    <IconButton aria-label="close" onClick={() => setOpenDetails(false)} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="!pt-2 !pb-3">
                    <div className="flex justify-center">
                        <CampaignBattleCardPreview battle={location} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
