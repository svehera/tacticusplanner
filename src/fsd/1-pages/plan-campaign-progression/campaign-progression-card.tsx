import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Tooltip from '@mui/material/Tooltip';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignDifficulty, CampaignImage, CampaignsService } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character';

import { CampaignProgressionAscensionGoals } from './campaign-progression-ascension-goals';
import { AscensionGoalRow, RankupGoalRow } from './campaign-progression-goal-rows';
import { CampaignProgressionMaterialGoals } from './campaign-progression-material-goals';
import { CampaignProgressionRankupGoals } from './campaign-progression-rankup-goals';
import { CampaignData, CampaignsProgressData } from './campaign-progression.models';

export type CampaignProgressionTabId = 'ascend' | 'rankup' | 'mats';

interface Props {
    activeTab: CampaignProgressionTabId;
    ascendRows: AscensionGoalRow[];
    campaignData: CampaignData;
    expanded: boolean;
    lastCleared: number;
    onTabChange: (tab: CampaignProgressionTabId) => void;
    onToggle: () => void;
    ownedCharacterIds: Set<string>;
    progression: CampaignsProgressData;
    rankupRows: RankupGoalRow[];
    lockReason?: string;
    tags: string[];
    totalBattles: number;
}

export const CampaignProgressionCard: React.FC<Props> = ({
    activeTab,
    ascendRows,
    campaignData,
    expanded,
    lockReason,
    lastCleared,
    onTabChange,
    onToggle,
    ownedCharacterIds,
    progression,
    rankupRows,
    tags,
    totalBattles,
}) => {
    const [campaign] = campaignData;
    const upcoming = Math.max(0, totalBattles - lastCleared);
    const progress = totalBattles > 0 ? lastCleared / totalBattles : 0;
    const cumulativeSavings = campaignData[1].savings.at(-1)?.cumulativeSavings ?? 0;
    const unlockCount = campaignData[1].savings.filter(s => !s.canFarmPrior).length;
    const hasAscend = !isMobile && ascendRows.length > 0;
    const hasRankup = !isMobile && rankupRows.length > 0;
    const hasMats = campaignData[1].savings.length > 0;
    const showTabs = hasAscend || hasRankup;
    const tabs: Array<{ id: CampaignProgressionTabId; label: string; count: number; visible: boolean }> = [
        { id: 'ascend', label: 'Ascension & Unlock', count: ascendRows.length, visible: hasAscend },
        { id: 'rankup', label: 'Rank-Up', count: rankupRows.length, visible: hasRankup },
        { id: 'mats', label: 'Materials', count: campaignData[1].savings.length, visible: hasMats },
    ];
    const visibleTabs = tabs.filter(tab => tab.visible);
    const effectiveTab =
        showTabs && !visibleTabs.some(t => t.id === activeTab) ? (visibleTabs[0]?.id ?? activeTab) : activeTab;

    return (
        <div
            className={`flex flex-col overflow-hidden rounded-xl border bg-(--card-bg) shadow-sm ${lockReason ? 'border-l-[3px] border-(--border) border-l-amber-500' : 'border-(--border)'}`}>
            <button
                aria-expanded={expanded}
                aria-controls={`campaign-detail-${campaign}`}
                className="flex w-full cursor-pointer items-start gap-2 border-b border-(--border) px-3 py-2.5 text-left transition-colors hover:bg-(--muted) focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset sm:gap-3 sm:px-4 sm:py-3"
                onClick={onToggle}>
                <div className="flex h-[50px] w-[70px] flex-shrink-0 items-center justify-center overflow-hidden">
                    <CampaignImage campaign={campaign} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {lockReason && (
                            <Tooltip title={lockReason}>
                                <LockOutlinedIcon
                                    sx={{ fontSize: 14 }}
                                    className="text-amber-500"
                                    aria-label={lockReason}
                                />
                            </Tooltip>
                        )}
                        <span className="text-sm font-semibold">{campaign}</span>
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    tag === 'Campaign Event'
                                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                }`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className="font-mono text-xs text-(--muted-fg)">
                        Cleared {lastCleared}/{totalBattles} · {upcoming} upcoming · {campaignData[1].goalCost.size}{' '}
                        goal{campaignData[1].goalCost.size === 1 ? '' : 's'}
                        {unlockCount > 0 && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-(--muted-fg)">
                                · <LockOpenOutlinedIcon sx={{ fontSize: 11, verticalAlign: 'middle' }} /> {unlockCount}{' '}
                                unlock{unlockCount === 1 ? '' : 's'}
                            </span>
                        )}
                    </p>
                    {totalBattles > 0 && (
                        <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-(--border)">
                            <div
                                className="h-full rounded-full bg-blue-500 dark:bg-blue-400"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                    )}
                    {(() => {
                        const model = CampaignsService.allCampaigns.find(c => c.id === campaign);
                        const isBase =
                            model?.difficulty === CampaignDifficulty.standard ||
                            model?.difficulty === CampaignDifficulty.mirror ||
                            model?.difficulty === CampaignDifficulty.eventStandard;
                        if (!isBase) return;
                        const missing = (model?.coreCharacters ?? []).filter(unitId => !ownedCharacterIds.has(unitId));
                        return missing.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400">Missing:</span>
                                {missing.map(unitId => {
                                    const unit = CharactersService.getUnit(unitId);
                                    return (
                                        <UnitShardIcon
                                            key={unitId}
                                            icon={unit?.roundIcon ?? ''}
                                            height={20}
                                            width={20}
                                            tooltip={unit?.name ?? unitId}
                                        />
                                    );
                                })}
                            </div>
                        ) : undefined;
                    })()}
                </div>
                {!isMobile && cumulativeSavings > 0 && (
                    <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1 font-mono text-xl font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                            <MiscIcon icon={'energy'} height={14} width={14} />
                            {cumulativeSavings}
                        </span>
                        <span className="text-[11px] text-(--muted-fg)">cumulative if cleared</span>
                    </div>
                )}
                <span className="ml-1 text-(--muted-fg)" aria-hidden="true">
                    {expanded ? '▲' : '▼'}
                </span>
            </button>

            {expanded && (
                <div id={`campaign-detail-${campaign}`} className="flex flex-col">
                    {showTabs && (
                        <div className="flex border-b border-(--border)">
                            {visibleTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-inset ${
                                        effectiveTab === tab.id
                                            ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                            : 'text-(--muted-fg) hover:text-(--card-fg)'
                                    }`}>
                                    {tab.label}
                                    <span className="ml-1.5 rounded-full bg-(--card-fg)/10 px-1.5 py-0.5 text-[10px] font-normal tabular-nums">
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="p-3">
                        {showTabs ? (
                            <>
                                {effectiveTab === 'ascend' && hasAscend && (
                                    <CampaignProgressionAscensionGoals rows={ascendRows} />
                                )}
                                {effectiveTab === 'rankup' && hasRankup && (
                                    <CampaignProgressionRankupGoals rows={rankupRows} />
                                )}
                                {effectiveTab === 'mats' && hasMats && (
                                    <CampaignProgressionMaterialGoals
                                        campaignData={campaignData}
                                        progression={progression}
                                    />
                                )}
                            </>
                        ) : hasMats ? (
                            <CampaignProgressionMaterialGoals campaignData={campaignData} progression={progression} />
                        ) : (
                            <p className="text-center text-xs text-(--muted-fg)">
                                {lockReason
                                    ? 'Clear the base campaign to unlock farming here.'
                                    : 'No farmable materials match your current goals.'}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
