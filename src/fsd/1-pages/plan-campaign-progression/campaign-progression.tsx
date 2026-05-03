/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

import { Rank } from '@/fsd/5-shared/model';

import { CampaignsService } from '@/fsd/4-entities/campaign';
import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import {
    ICharacterAscendGoal,
    ICharacterUnlockGoal,
    ICharacterUpgradeMow,
    ICharacterUpgradeRankGoal,
} from '@/fsd/4-entities/goal';
import { MowsService } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

import { ActiveGoalsDialog } from '@/fsd/3-features/goals/active-goals-dialog';
import { TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';

import { CampaignProgressionCard } from './campaign-progression-card';
import { CampaignProgressionControls } from './campaign-progression-controls';
import { buildAscensionGoalRows, buildRankupGoalRows } from './campaign-progression-goal-rows';
import { CampaignProgressionHeader } from './campaign-progression-header';
import { CampaignProgressionSummary } from './campaign-progression-summary';
import { CampaignProgressionUnfarmableMaterials } from './campaign-progression-unfarmable-materials';
import { CampaignsProgressionService } from './campaign-progression.service';
import { getCampaignLockReason, getCampaignTags, sortCampaignData } from './campaign-progression.utils';
import { useCampaignProgressionFilters } from './use-campaign-progression-filters';

export const CampaignProgression = () => {
    const dispatch = useContext(DispatchContext);
    const {
        characters: storeCharacters,
        mows: storeMows,
        goals,
        campaignsProgress,
        inventory,
    } = useContext(StoreContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(storeMows), [storeMows]);

    const resolvedCharacters = useMemo(
        () => CharactersService.resolveStoredCharacters(storeCharacters),
        [storeCharacters]
    );

    const units = useMemo<IUnit[]>(() => [...resolvedCharacters, ...resolvedMows], [resolvedCharacters, resolvedMows]);

    const ownedCharacterIds = useMemo(
        () => new Set(resolvedCharacters.filter(c => c.rank !== Rank.Locked).map(c => c.snowprintId)),
        [resolvedCharacters]
    );

    const {
        sortMode,
        setSortMode,
        expandedCardId,
        setExpandedCardId,
        hideNoDrops,
        setHideNoDrops,
        hideLocked,
        setHideLocked,
        hideCE,
        setHideCE,
        setActiveTabs,
        getActiveTab,
    } = useCampaignProgressionFilters();

    const { allGoals, shardsGoals, upgradeRankOrMowGoals } = useMemo(() => {
        const { allGoals, shardsGoals, upgradeRankOrMowGoals } = GoalsService.prepareGoals(
            goals,
            [...resolvedCharacters, ...resolvedMows],
            false
        );
        return {
            allGoals,
            shardsGoals: shardsGoals.filter(goal => goal.include),
            upgradeRankOrMowGoals: upgradeRankOrMowGoals.filter(goal => goal.include),
        };
    }, [goals, resolvedCharacters, resolvedMows]);

    const handleGoalsSelectionChange = (selection: TypedGoalSelect[]) => {
        dispatch.goals({
            type: 'UpdateDailyRaids',
            value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
        });
    };

    const progression = useMemo(() => {
        const combined: Array<
            ICharacterUpgradeMow | ICharacterUpgradeRankGoal | ICharacterUnlockGoal | ICharacterAscendGoal
        > = [...shardsGoals, ...upgradeRankOrMowGoals];
        return CampaignsProgressionService.computeCampaignsProgress(combined, campaignsProgress, inventory.upgrades);
    }, [shardsGoals, upgradeRankOrMowGoals, campaignsProgress, inventory.upgrades]);

    const campaignDataArray = useMemo(() => [...progression.data.entries()], [progression]);

    const summaryStats = useMemo(() => {
        const totalSavings = campaignDataArray.reduce(
            (sum, entry) => sum + (entry[1].savings.at(-1)?.cumulativeSavings ?? 0),
            0
        );
        const activeCampaigns = campaignDataArray.filter(
            entry => entry[1].savings.length > 0 || entry[1].goalCost.size > 0
        ).length;
        const allGoalIds = new Set(campaignDataArray.flatMap(entry => [...entry[1].goalCost.keys()]));
        const lockedMaterials = [...progression.materialFarmData.values()].filter(f => !f.canFarm).length;
        return { totalSavings, activeCampaigns, goalCount: allGoalIds.size, lockedMaterials };
    }, [campaignDataArray, progression.materialFarmData]);

    const goalsById = useMemo(() => {
        const map = new Map<
            string,
            ICharacterAscendGoal | ICharacterUnlockGoal | ICharacterUpgradeRankGoal | ICharacterUpgradeMow
        >();
        for (const goal of [...upgradeRankOrMowGoals, ...shardsGoals]) {
            map.set(goal.goalId, goal);
        }
        return map;
    }, [shardsGoals, upgradeRankOrMowGoals]);

    const sortedCampaignDataArray = useMemo(
        () => sortCampaignData(campaignDataArray, sortMode, goalsById),
        [campaignDataArray, goalsById, sortMode]
    );

    const campaignCards = useMemo(
        () =>
            sortedCampaignDataArray
                .map(campaignData => {
                    const campaign = campaignData[0];
                    return {
                        campaign,
                        campaignData,
                        tags: getCampaignTags(campaign),
                        lockReason: getCampaignLockReason(campaign, campaignsProgress, ownedCharacterIds),
                        lastCleared: campaignsProgress[campaign as keyof typeof campaignsProgress] ?? 0,
                        totalBattles: CampaignsService.campaignsGrouped[campaign]?.length ?? 0,
                        ascendRows: buildAscensionGoalRows(campaignData, shardsGoals),
                        rankupRows: buildRankupGoalRows(campaignData, upgradeRankOrMowGoals),
                    };
                })
                .filter(card => card.campaignData[1].savings.length > 0 || card.campaignData[1].goalCost.size > 0)
                .filter(card => !hideNoDrops || card.campaignData[1].savings.length > 0)
                .filter(card => !hideLocked || !card.lockReason)
                .filter(card => !hideCE || !card.tags.includes('Campaign Event')),
        [
            campaignsProgress,
            hideCE,
            hideLocked,
            hideNoDrops,
            ownedCharacterIds,
            shardsGoals,
            sortedCampaignDataArray,
            upgradeRankOrMowGoals,
        ]
    );

    return (
        <div key="root" className="mx-auto flex max-w-[1100px] min-w-0 flex-col gap-2 overflow-x-hidden">
            <CampaignProgressionHeader
                activeGoalsAction={
                    <ActiveGoalsDialog
                        units={units}
                        goals={allGoals}
                        onGoalsSelectChange={handleGoalsSelectionChange}
                    />
                }
            />
            <CampaignProgressionUnfarmableMaterials
                progression={progression}
                campaignDataArray={campaignDataArray}
                inventoryUpgrades={inventory.upgrades}
            />

            {campaignDataArray.length === 0 && (
                <div className="mt-2 flex max-w-md flex-col gap-3 overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) p-4 shadow-sm">
                    <p className="font-semibold">No campaign data yet</p>
                    <p className="text-sm text-(--muted-fg)">
                        Add goals with campaign-farmable materials or shard goals to see savings analysis.
                    </p>
                    <Link
                        to="/plan/goals"
                        className="w-fit rounded border border-(--card-border) px-3 py-1.5 text-sm font-medium transition-colors hover:bg-(--card-border)">
                        Go to Goals
                    </Link>
                </div>
            )}

            {campaignDataArray.length > 0 && (
                <div className="flex flex-col gap-2">
                    <CampaignProgressionSummary stats={summaryStats} />
                    <CampaignProgressionControls
                        sortMode={sortMode}
                        setSortMode={setSortMode}
                        hideNoDrops={hideNoDrops}
                        setHideNoDrops={setHideNoDrops}
                        hideLocked={hideLocked}
                        setHideLocked={setHideLocked}
                        hideCE={hideCE}
                        setHideCE={setHideCE}
                    />
                </div>
            )}

            <div className="flex flex-col gap-3">
                {campaignCards.map(card => {
                    const isExpanded = expandedCardId === card.campaign;
                    return (
                        <CampaignProgressionCard
                            key={card.campaign}
                            activeTab={getActiveTab(card.campaign)}
                            ascendRows={card.ascendRows}
                            campaignData={card.campaignData}
                            expanded={isExpanded}
                            lastCleared={card.lastCleared}
                            onTabChange={tab => setActiveTabs(previous => ({ ...previous, [card.campaign]: tab }))}
                            onToggle={() => setExpandedCardId(isExpanded ? undefined : card.campaign)}
                            lockReason={card.lockReason}
                            ownedCharacterIds={ownedCharacterIds}
                            progression={progression}
                            rankupRows={card.rankupRows}
                            tags={card.tags}
                            totalBattles={card.totalBattles}
                        />
                    );
                })}
            </div>
        </div>
    );
};
