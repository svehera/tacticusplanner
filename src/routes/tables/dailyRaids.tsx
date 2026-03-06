import { cloneDeep } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ICampaignsFilters } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { RaidsHeader } from 'src/routes/tables/raids-header';
import { RaidsPlan } from 'src/routes/tables/raids-plan';
import { TodayRaids } from 'src/routes/tables/todayRaids';

import { useAuth } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { IUnit } from '@/fsd/3-features/characters/characters.models';
import { ActiveGoalsDialog } from '@/fsd/3-features/goals/active-goals-dialog';
import { CharacterRaidGoalSelect, IEstimatedUpgrades, IItemRaidLocation } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { LocationsFilter } from '@/fsd/3-features/goals/locations-filter';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';
import { useSyncWithTacticus } from '@/fsd/3-features/tacticus-integration/useSyncWithTacticus';

function addShardsToUpgrades(
    upgrades: Record<string, number>,
    characters: IUnit[],
    mows: IUnit[]
): Record<string, number> {
    const newUpgrades = cloneDeep(upgrades);
    characters.forEach(char => {
        newUpgrades['shards_' + char.snowprintId] = char.shards;
        newUpgrades['mythicShards_' + char.snowprintId] = char.mythicShards;
    });
    mows.forEach(mow => {
        newUpgrades['shards_' + mow.snowprintId] = mow.shards;
        newUpgrades['mythicShards_' + mow.snowprintId] = mow.mythicShards;
    });
    return newUpgrades;
}

export const DailyRaids = () => {
    const dispatch = useContext(DispatchContext);
    const { userInfo } = useAuth();
    const { syncWithTacticus } = useSyncWithTacticus();
    const {
        dailyRaids,
        characters: storeCharacters,
        mows: storeMows,
        goals,
        campaignsProgress,
        dailyRaidsPreferences,
        inventory,
    } = useContext(StoreContext);

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(storeMows), [storeMows]);

    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const upgrades = useMemo(
        () => addShardsToUpgrades(inventory.upgrades, storeCharacters, resolvedMows),
        [inventory.upgrades, storeCharacters, resolvedMows]
    );
    const units = useMemo(() => [...storeCharacters, ...resolvedMows], [storeCharacters, resolvedMows]);
    const [raidedLocations, setRaidedLocations] = useState<IItemRaidLocation[]>(dailyRaids.raidedLocations);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals } = useMemo(() => {
        return GoalsService.prepareGoals(goals, units, true);
    }, [goals, units]);

    const hasSync = !!userInfo.tacticusApiKey;

    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [charSnowprintId, setCharSnowprintId] = useState<string | null>(searchParams.get('charSnowprintId'));

    useEffect(() => {
        setCharSnowprintId(searchParams.get('charSnowprintId'));
    }, [location]);

    const handleGoalsSelectionChange = (selection: CharacterRaidGoalSelect[]) => {
        dispatch.goals({
            type: 'UpdateDailyRaids',
            value: selection.map(x => ({ goalId: x.goalId, include: x.include })),
        });
    };

    const saveInventoryUpdateChanges = (materialId: string, value: number): void => {
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: materialId,
            value: value,
        });
        setHasChanges(true);
    };

    const refresh = () => {
        setRaidedLocations([...dailyRaids.raidedLocations]);
        setHasChanges(false);
    };

    const sync = async () => {
        console.log('Syncing with Tacticus...');
        await syncWithTacticus();
        // Inline refresh after successful sync
        setRaidedLocations([...raidedLocations]);
        setHasChanges(false);
    };

    const resetDay = () => {
        dispatch.dailyRaids({ type: 'ResetCompletedBattles' });
        setHasChanges(false);
        setTimeout(() => {
            setRaidedLocations([]);
        }, 100);
    };

    const resolvedCharacters = CharactersService.resolveStoredCharacters(storeCharacters);

    const saveFilterChanges = (filters: ICampaignsFilters) => {
        dispatch.dailyRaids({
            type: 'UpdateFilters',
            value: filters,
        });
    };

    const actualEnergy = dailyRaidsPreferences.dailyEnergy;

    const estimatedRanks: IEstimatedUpgrades = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: upgrades,
                completedLocations: raidedLocations?.filter(x => !x.isShardsLocation) ?? [],
                filters: dailyRaids.filters,
            },
            resolvedCharacters,
            resolvedMows,
            ...[...upgradeRankOrMowGoals, ...shardsGoals]
        );
    }, [
        dailyRaidsPreferences.dailyEnergy,
        upgradeRankOrMowGoals,
        shardsGoals,
        dailyRaidsPreferences,
        dailyRaids.filters,
        upgrades,
        raidedLocations,
        resolvedCharacters,
        resolvedMows,
        campaignsProgress,
    ]);

    const infiniteEstimatedRanks: IEstimatedUpgrades = useMemo(() => {
        return UpgradesService.getUpgradesEstimatedDays(
            {
                dailyEnergy: 88888888,
                campaignsProgress: campaignsProgress,
                preferences: dailyRaidsPreferences,
                upgrades: upgrades,
                completedLocations: raidedLocations?.filter(x => !x.isShardsLocation) ?? [],
                filters: dailyRaids.filters,
            },
            resolvedCharacters,
            resolvedMows,
            ...[...upgradeRankOrMowGoals, ...shardsGoals]
        );
    }, [
        dailyRaidsPreferences.dailyEnergy,
        upgradeRankOrMowGoals,
        shardsGoals,
        dailyRaidsPreferences,
        dailyRaids.filters,
        upgrades,
        raidedLocations,
        resolvedCharacters,
        resolvedMows,
        campaignsProgress,
    ]);

    return (
        <div>
            <RaidsHeader
                hasSync={hasSync}
                syncHandle={sync}
                actualDailyEnergy={actualEnergy.toString()}
                refreshDisabled={!hasChanges && dailyRaids.raidedLocations.length === raidedLocations.length}
                refreshHandle={refresh}
                resetDisabled={!dailyRaids.raidedLocations?.length}
                resetHandler={resetDay}>
                <ActiveGoalsDialog units={units} goals={allGoals} onGoalsSelectChange={handleGoalsSelectionChange} />
                <LocationsFilter filter={dailyRaids.filters} filtersChange={saveFilterChanges} />
            </RaidsHeader>

            <RaidsPlan
                estimatedRanks={estimatedRanks}
                upgrades={upgrades}
                updateInventory={saveInventoryUpdateChanges}
                updateInventoryAny={() => setHasChanges(true)}
                scrollToCharSnowprintId={charSnowprintId ?? undefined}
            />

            {estimatedRanks.upgradesRaids.length > 0 && (
                <TodayRaids
                    raids={estimatedRanks.upgradesRaids[0].raids}
                    bonusRaids={UpgradesService.getDayRaidsDifference(
                        infiniteEstimatedRanks.upgradesRaids[0],
                        estimatedRanks.upgradesRaids[0]
                    )}
                />
            )}
        </div>
    );
};
