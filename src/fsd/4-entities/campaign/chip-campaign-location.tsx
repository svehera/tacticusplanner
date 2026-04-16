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
    compact?: boolean;
    widthClass?: string;
    clickable?: boolean;
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
        <div className="mx-auto flex w-fit max-w-full flex-col gap-3 rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--card-fg)] shadow-md">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--card-border)] pb-3 text-inherit">
                <CampaignImage campaign={battle.campaign} size={26} showTooltip={false} />
                <div className="ml-auto flex flex-wrap items-center gap-3 text-inherit">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-inherit">
                        <MiscIcon icon="deployment" width={18} height={18} />
                        <span className="text-sm font-medium text-inherit">{battle.slots ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap text-inherit">
                        <MiscIcon icon="energy" width={18} height={18} />
                        <span className="text-sm font-medium text-inherit">{battle.energyCost}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-inherit">
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
                            <span className="text-inherit">{rewardName || '-'}</span>
                        )}
                    </span>
                </div>
            </div>

            <div>
                <h4 className="mb-2 text-xs font-semibold text-inherit uppercase">Enemies</h4>
                {(battle.rawEnemyTypes ?? []).length === 0 ? (
                    <div className="text-sm text-inherit">No enemy info available.</div>
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

export const ChipCampaignLocation: React.FC<Props> = ({
    location,
    unlocked,
    compact = true,
    widthClass,
    clickable = true,
}) => {
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
    }, [location]);

    const campaignShort = campaignDisplayNames[location.campaign] ?? location.campaign;
    const fullLocationName = `Battle ${locationNumber} - ${location.campaign}`;

    const locationText = compact ? campaignShort : location.campaign;
    const setWidthClass = widthClass ?? (compact ? 'w-[96px]' : 'w-full');
    const isOnslaught = location.campaign === Campaign.Onslaught;

    return location === undefined ? (
        <span className="text-[var(--card-fg)]">undefined</span>
    ) : (
        <>
            <Tooltip title={location.campaign} placement="top">
                <button
                    type="button"
                    onClick={clickable ? () => setOpenDetails(true) : undefined}
                    tabIndex={clickable ? undefined : -1}
                    aria-disabled={clickable ? undefined : true}
                    className={`border-muted-fg/40 inline-flex items-center gap-1 overflow-hidden rounded-full border bg-transparent px-2 py-0.5 ${setWidthClass} text-[var(--card-fg)] ${clickable ? 'cursor-pointer' : 'cursor-default'}`.trim()}
                    style={{
                        opacity: unlocked ? 1 : 0.5,
                    }}>
                    <CampaignImage campaign={location.campaign} size={20} showTooltip={false} />
                    <div
                        className={`flex flex-1 items-center justify-between text-[12px] leading-none text-inherit ${compact ? '' : 'overflow-hidden'}`.trim()}>
                        <span className={compact ? undefined : 'min-w-0 truncate'}>{locationText}</span>
                        {!isOnslaught && <span className="shrink-0 pl-1">{locationNumber}</span>}
                    </div>
                </button>
            </Tooltip>

            <Dialog
                open={clickable && openDetails}
                onClose={() => setOpenDetails(false)}
                maxWidth="sm"
                aria-labelledby="campaign-location-dialog-title">
                <DialogTitle
                    id="campaign-location-dialog-title"
                    className="flex items-center justify-between gap-3 pr-2 text-[var(--card-fg)]">
                    <span className="text-inherit">{fullLocationName}</span>
                    <IconButton aria-label="close" onClick={() => setOpenDetails(false)} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="pt-2! pb-3! text-[var(--card-fg)]">
                    <div className="flex justify-center text-inherit">
                        <CampaignBattleCardPreview battle={location} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
